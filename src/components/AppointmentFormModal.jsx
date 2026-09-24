import { useEffect, useState, useRef } from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Platform,
    Alert,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Animated,
    PanResponder,
    Dimensions,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import SelectModal from "./SelectModal";
import { getClients } from "../services/clients";
import { getServiceCatalog } from "../services/catalog";
import { getUsers } from "../services/users";
import { createAppointment } from "../services/appointments";
import { combineDateAndTime, formatTime } from "../utils/date";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const COLLAPSED_HEIGHT = SCREEN_HEIGHT * 0.75;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.90;

function defaultTime(hours, minutes) {
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
}

function Field({ label, value, placeholder, onPress }) {
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity style={styles.input} onPress={onPress}>
                <Text style={value ? styles.inputValue : styles.inputPlaceholder}>
                    {value || placeholder}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

function formatDateFull(dateString) {
    if (!dateString) return "";

    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

export default function AppointmentFormModal({
    visible,
    onClose,
    dateKey,
    isManager,
    currentUser,
    onCreated,
}) {
    const [clients, setClients] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [services, setServices] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    const [client, setClient] = useState(null);
    const [staff, setStaff] = useState(null);
    const [service, setService] = useState(null);
    const [startTime, setStartTime] = useState(defaultTime(9, 0));
    const [endTime, setEndTime] = useState(defaultTime(10, 0));
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [pickerOpen, setPickerOpen] = useState(null);
    const [timePicker, setTimePicker] = useState(null);

    const modalHeight = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
    const isExpanded = useRef(false);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                const baseHeight = isExpanded.current ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
                const newHeight = baseHeight - gestureState.dy;

                if (newHeight <= EXPANDED_HEIGHT + 40 && newHeight >= 0) {
                    modalHeight.setValue(newHeight);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                const currentH = (isExpanded.current ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT) - gestureState.dy;

                if (gestureState.dy > 180 || gestureState.vy > 1.2) {
                    Animated.timing(modalHeight, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: false,
                    }).start(() => {
                        onClose();
                    });
                    return;
                }

                const threshold = (EXPANDED_HEIGHT + COLLAPSED_HEIGHT) / 2;
                let targetHeight = COLLAPSED_HEIGHT;

                if (currentH > threshold || gestureState.vy < -0.5) {
                    targetHeight = EXPANDED_HEIGHT;
                    isExpanded.current = true;
                } else {
                    targetHeight = COLLAPSED_HEIGHT;
                    isExpanded.current = false;
                }

                Animated.spring(modalHeight, {
                    toValue: targetHeight,
                    bounciness: 4,
                    useNativeDriver: false,
                }).start();
            },
        })
    ).current;

    useEffect(() => {
        if (!visible) return;

        isExpanded.current = false;
        modalHeight.setValue(COLLAPSED_HEIGHT);

        setClient(null);
        setService(null);
        setNotes("");
        setStartTime(defaultTime(9, 0));
        setEndTime(defaultTime(10, 0));

        if (currentUser) {
            setStaff({ id: currentUser.id, label: currentUser.name });
        } else {
            setStaff(null);
        }

        loadOptions();
    }, [visible]);

    async function loadOptions() {
        setLoadingOptions(true);
        try {
            const tasks = [getClients(), getServiceCatalog(), getUsers()];
            const results = await Promise.all(tasks);

            setClients(results[0].map((c) => ({ id: c.id, label: c.name, subtitle: c.phone })));

            setServices(
                results[1]
                    .filter((s) => s.active !== false)
                    .map((s) => ({
                        id: s.id,
                        label: s.name,
                        durationMinutes: s.durationMinutes,
                        subtitle: `${s.durationMinutes} min`,
                    }))
            );

            setStaffList(
                results[2]
                    .filter((u) => u.active !== false)
                    .map((u) => ({ id: u.id, label: u.name, subtitle: u.role }))
            );
        } catch (err) {
            // Trato no interceptor
        } finally {
            setLoadingOptions(false);
        }
    }

    function handleSelectService(selectedService) {
        setService(selectedService);
        setPickerOpen(null);

        if (selectedService?.durationMinutes) {
            const newEndTime = new Date(startTime.getTime() + selectedService.durationMinutes * 60000);
            setEndTime(newEndTime);
        }
    }

    function handleStartTimeChange(selectedDate) {
        setStartTime(selectedDate);
        if (service?.durationMinutes) {
            const newEndTime = new Date(selectedDate.getTime() + service.durationMinutes * 60000);
            setEndTime(newEndTime);
        }
    }

    async function handleSubmit() {
        if (!client) {
            Alert.alert("Atenção", "Selecione um cliente.");
            return;
        }
        if (!staff) {
            Alert.alert("Atenção", "Selecione um profissional.");
            return;
        }
         if (!service || !service.id){
             Alert.alert("Atenção", "Selecione um serviço para continuar.");
            return;
            
         }
    

        const startAt = combineDateAndTime(dateKey, startTime);
        const endAt = combineDateAndTime(dateKey, endTime);

        if (endAt <= startAt) {
            Alert.alert("Atenção", "O horário de término deve ser depois do início.");
            return;
        }

        setSubmitting(true);
        try {
            await createAppointment({
                clientId: client.id,
                staffId: staff.id,
                serviceItemId: service?.id,
                startAt: startAt.toISOString(),
                endAt: endAt.toISOString(),
                notes: notes || undefined,
            });
            onCreated();
            onClose();
        } catch (err) {
            // Trato no interceptor
        } finally {
            setSubmitting(false);
        }
    }

    const handleDateChange = (event, selectedDate) => {
        if (Platform.OS === "android") {
            setTimePicker(null);
        }
        if (selectedDate) {
            if (timePicker === "start") {
                handleStartTimeChange(selectedDate);
            } else {
                setEndTime(selectedDate);
            }
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            presentationStyle="overFullScreen"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={() => {}}>
                        <Animated.View
                            style={[
                                styles.modalContent,
                                {
                                    height: modalHeight,
                                },
                            ]}
                        >
                            <KeyboardAvoidingView
                                behavior={Platform.OS === "ios" ? "padding" : undefined}
                                style={{ flex: 1 }}
                            >
                                <View style={styles.dragHeaderArea} {...panResponder.panHandlers}>
                                    <View style={styles.dragIndicator} />
                                    <Text style={styles.title}>Novo agendamento</Text>
                                    <Text style={styles.dateLabel}>{formatDateFull(dateKey)}</Text>
                                </View>

                                <ScrollView
                                    style={styles.scrollArea}
                                    contentContainerStyle={styles.scrollContainer}
                                    showsVerticalScrollIndicator={false}
                                >
                                    <Field
                                        label="Cliente"
                                        value={client?.label}
                                        placeholder="Selecionar cliente"
                                        onPress={() => setPickerOpen("client")}
                                    />

                                    <Field
                                        label="Profissional"
                                        value={staff?.label}
                                        placeholder="Selecionar profissional"
                                        onPress={() => setPickerOpen("staff")}
                                    />

                                    <Field
                                        label="Serviço"
                                        value={service?.label}
                                        placeholder="Selecionar serviço"
                                        onPress={() => setPickerOpen("service")}
                                    />

                                    <View style={styles.row}>
                                        <View style={{ flex: 1, marginRight: 8 }}>
                                            <Field
                                                label="Início"
                                                value={formatTime(startTime.toISOString())}
                                                onPress={() => setTimePicker("start")}
                                            />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 8 }}>
                                            <Field
                                                label="Fim"
                                                value={formatTime(endTime.toISOString())}
                                                onPress={() => setTimePicker("end")}
                                            />
                                        </View>
                                    </View>

                                    <Text style={styles.label}>Observações</Text>
                                    <TextInput
                                        style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                                        multiline
                                        value={notes}
                                        onChangeText={setNotes}
                                        placeholder="Opcional"
                                        placeholderTextColor="#999"
                                    />

                                    <TouchableOpacity
                                        style={styles.submitButton}
                                        onPress={handleSubmit}
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.submitButtonText}>Criar agendamento</Text>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </KeyboardAvoidingView>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>

            <SelectModal
                visible={pickerOpen === "client"}
                title="Selecionar cliente"
                items={clients}
                loading={loadingOptions}
                onSelect={(item) => {
                    setClient(item);
                    setPickerOpen(null);
                }}
                onClose={() => setPickerOpen(null)}
            />
            <SelectModal
                visible={pickerOpen === "service"}
                title="Selecionar serviço"
                items={services}
                loading={loadingOptions}
                onSelect={handleSelectService}
                onClose={() => setPickerOpen(null)}
            />
            <SelectModal
                visible={pickerOpen === "staff"}
                title="Selecionar profissional"
                items={staffList}
                loading={loadingOptions}
                onSelect={(item) => {
                    setStaff(item);
                    setPickerOpen(null);
                }}
                onClose={() => setPickerOpen(null)}
            />

            {timePicker && (
                <View style={Platform.OS === "ios" ? styles.iosPickerWrapper : undefined}>
                    {Platform.OS === "ios" && (
                        <View style={styles.iosPickerHeader}>
                            <TouchableOpacity onPress={() => setTimePicker(null)}>
                                <Text style={styles.iosPickerDone}>Concluir</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.pickerContainer}>
                        <DateTimePicker
                            value={timePicker === "start" ? startTime : endTime}
                            mode="time"
                            is24Hour={true}
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            textColor="#000000"
                            themeVariant="light"
                            onChange={handleDateChange}
                            onValueChange={handleDateChange}
                            onDismiss={() => setTimePicker(null)}
                            style={styles.dateTimePicker}
                        />
                    </View>
                </View>
            )}
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        width: "100%",
        overflow: "hidden",
    },
    dragHeaderArea: {
        paddingHorizontal: 20,
        paddingTop: 12,
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    dragIndicator: {
        width: 44,
        height: 5,
        backgroundColor: "#ccc",
        borderRadius: 3,
        alignSelf: "center",
        marginBottom: 16,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 4,
        color: "#333",
    },
    dateLabel: {
        fontSize: 16,
        color: "#666",
        marginBottom: 12,
        textTransform: "capitalize",
    },
    label: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        backgroundColor: "#fff",
        justifyContent: "center",
    },
    inputValue: {
        color: "#000",
        fontSize: 16,
    },
    inputPlaceholder: {
        color: "#999",
        fontSize: 16,
    },
    row: {
        flexDirection: "row",
    },
    submitButton: {
        backgroundColor: "#D1779F",
        padding: 16,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 24,
    },
    submitButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    cancelButton: {
        padding: 16,
        alignItems: "center",
        marginTop: 8,
    },
    cancelButtonText: {
        color: "#999",
        fontSize: 16,
    },
    iosPickerWrapper: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#ffffff",
        borderTopWidth: 1,
        borderTopColor: "#e3e3e3",
        zIndex: 999,
    },
    iosPickerHeader: {
        flexDirection: "row",
        justifyContent: "flex-end",
        padding: 12,
        backgroundColor: "#f9f9f9",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        width: "100%",
    },
    iosPickerDone: {
        color: "#D1779F",
        fontWeight: "bold",
        fontSize: 16,
    },
    pickerContainer: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        paddingBottom: 20,
    },
    dateTimePicker: {
        width: "100%",
    },
});