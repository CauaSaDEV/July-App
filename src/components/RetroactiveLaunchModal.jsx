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
import { createRetroactiveAppointment } from "../services/appointments";
import { combineDateAndTime, formatTime, formatDateToISO, dateToKey } from "../utils/date";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const COLLAPSED_HEIGHT = SCREEN_HEIGHT * 0.75;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.90;

function defaultTime(hours, minutes) {
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
}

function Field({ label, value, placeholder, onPress, required }) {
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={styles.label}>
                {label} {required && <Text style={styles.requiredMark}>*</Text>}
            </Text>
            <TouchableOpacity style={styles.input} onPress={onPress}>
                <Text style={value ? styles.inputValue : styles.inputPlaceholder}>
                    {value || placeholder}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

function formatDateDisplay(date) {
    if (!date) return "";
    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export default function RetroactiveAppointmentFormModal({
    visible,
    onClose,
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
    
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dateInputText, setDateInputText] = useState("");
    const [useManualDateInput, setUseManualDateInput] = useState(false);

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
        const initialDate = new Date();
        setSelectedDate(initialDate);
        setDateInputText(formatDateDisplay(initialDate));
        setUseManualDateInput(false);

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
                        price: s.defaultPrice ?? s.price,
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
            // Trato no interceptor da API
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

    function handleStartTimeChange(selectedDateValue) {
        setStartTime(selectedDateValue);
        if (service?.durationMinutes) {
            const newEndTime = new Date(selectedDateValue.getTime() + service.durationMinutes * 60000);
            setEndTime(newEndTime);
        }
    }

    function handleDateTextChange(text) {
        const cleaned = text.replace(/\D/g, "");
        let formatted = cleaned;

        if (cleaned.length > 2 && cleaned.length <= 4) {
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
        } else if (cleaned.length > 4) {
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
        }

        setDateInputText(formatted);

        if (formatted.length === 10) {
            const [day, month, year] = formatted.split("/").map(Number);
            const parsedDate = new Date(year, month - 1, day);
            if (!isNaN(parsedDate.getTime())) {
                setSelectedDate(parsedDate);
            }
        }
    }

    async function handleSubmit() {
        if (!client?.id) {
            Alert.alert("Atenção", "Selecione um cliente.");
            return;
        }
        if (!staff?.id) {
            Alert.alert("Atenção", "Selecione um profissional.");
            return;
        }
        if (!service?.id) {
            Alert.alert("Atenção", "O campo Serviço é obrigatório.");
            return;
        }

        let finalDate = selectedDate;
        if (useManualDateInput) {
            const [day, month, year] = dateInputText.split("/").map(Number);
            const parsedDate = new Date(year, month - 1, day);
            if (isNaN(parsedDate.getTime()) || dateInputText.length !== 10) {
                Alert.alert("Atenção", "Informe uma data válida no formato DD/MM/AAAA.");
                return;
            }
            finalDate = parsedDate;
        }

        const dateKey = formatDateToISO(finalDate);
        const startAt = combineDateAndTime(dateKey, startTime);
        const endAt = combineDateAndTime(dateKey, endTime);

        if (endAt <= startAt) {
            Alert.alert("Atenção", "O horário de término deve ser depois do início.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                clientId: client.id,
                staffId: staff.id,
                serviceItemId: service.id,
                startAt: startAt.toISOString(),
                endAt: endAt.toISOString(),
                appointmentNotes: notes || undefined,
                amount: service?.price ? parseFloat(service.price) : 0,
                discount: 0,
                paymentStatus: "PAID",
                paymentMethod: "PIX",
                receivedAt: startAt.toISOString(),
            };

            await createRetroactiveAppointment(payload);
            onCreated?.();
            onClose();
        } catch (err) {
            const message = err.response?.data?.message || "Erro ao registrar lançamento retroativo.";
            Alert.alert("Erro no Cadastro", message);
        } finally {
            setSubmitting(false);
        }
    }

    const handleDateChange = (event, dateValue) => {
        if (Platform.OS === "android") {
            setTimePicker(null);
        }
        if (dateValue) {
            if (timePicker === "date") {
                setSelectedDate(dateValue);
                setDateInputText(formatDateDisplay(dateValue));
            } else if (timePicker === "start") {
                handleStartTimeChange(dateValue);
            } else if (timePicker === "end") {
                setEndTime(dateValue);
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
                        <Animated.View style={[styles.modalContent, { height: modalHeight }]}>
                            <KeyboardAvoidingView
                                behavior={Platform.OS === "ios" ? "padding" : undefined}
                                style={{ flex: 1 }}
                            >
                                <View style={styles.dragHeaderArea} {...panResponder.panHandlers}>
                                    <View style={styles.dragIndicator} />
                                    <Text style={styles.title}>Lançar agendamento retroativo</Text>
                                    <Text style={styles.subtitleDescription}>
                                        Registre atendimentos já realizados
                                    </Text>
                                </View>

                                <ScrollView
                                    style={styles.scrollArea}
                                    contentContainerStyle={styles.scrollContainer}
                                    showsVerticalScrollIndicator={false}
                                >
                                    <View style={{ marginBottom: 16 }}>
                                        <View style={styles.dateHeaderRow}>
                                            <Text style={styles.label}>
                                                Data do atendimento <Text style={styles.requiredMark}>*</Text>
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => setUseManualDateInput(!useManualDateInput)}
                                            >
                                                <Text style={styles.toggleModeText}>
                                                    {useManualDateInput ? "Usar calendário" : "Digitar data"}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        {useManualDateInput ? (
                                            <TextInput
                                                style={styles.textInputStyle}
                                                value={dateInputText}
                                                onChangeText={handleDateTextChange}
                                                placeholder="DD/MM/AAAA"
                                                keyboardType="numeric"
                                                maxLength={10}
                                                placeholderTextColor="#999"
                                            />
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.input}
                                                onPress={() => setTimePicker("date")}
                                            >
                                                <Text style={styles.inputValue}>
                                                    {formatDateDisplay(selectedDate)}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <Field
                                        label="Cliente"
                                        required
                                        value={client?.label}
                                        placeholder="Selecionar cliente"
                                        onPress={() => setPickerOpen("client")}
                                    />

                                    <Field
                                        label="Profissional"
                                        required
                                        value={staff?.label}
                                        placeholder="Selecionar profissional"
                                        onPress={() => setPickerOpen("staff")}
                                    />

                                    <Field
                                        label="Serviço"
                                        required
                                        value={service?.label}
                                        placeholder="Selecionar serviço (Obrigatório)"
                                        onPress={() => setPickerOpen("service")}
                                    />

                                    <View style={styles.row}>
                                        <View style={{ flex: 1, marginRight: 8 }}>
                                            <Field
                                                label="Início"
                                                required
                                                value={formatTime(startTime.toISOString())}
                                                onPress={() => setTimePicker("start")}
                                            />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 8 }}>
                                            <Field
                                                label="Fim"
                                                required
                                                value={formatTime(endTime.toISOString())}
                                                onPress={() => setTimePicker("end")}
                                            />
                                        </View>
                                    </View>

                                    <Text style={styles.label}>Observações</Text>
                                    <TextInput
                                        style={[styles.textInputStyle, { height: 80, textAlignVertical: "top" }]}
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
                                            <Text style={styles.submitButtonText}>Salvar registro</Text>
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
                            value={
                                timePicker === "date"
                                    ? selectedDate
                                    : timePicker === "start"
                                    ? startTime
                                    : endTime
                            }
                            mode={timePicker === "date" ? "date" : "time"}
                            maximumDate={new Date()}
                            is24Hour={true}
                            display={
                                timePicker === "date"
                                    ? Platform.OS === "ios"
                                        ? "inline"
                                        : "calendar"
                                    : Platform.OS === "ios"
                                    ? "spinner"
                                    : "clock"
                            }
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
    subtitleDescription: {
        fontSize: 14,
        color: "#666",
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 6,
    },
    requiredMark: {
        color: "#d9534f",
        fontWeight: "bold",
    },
    dateHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    toggleModeText: {
        fontSize: 12,
        color: "#D1779F",
        fontWeight: "bold",
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
    textInputStyle: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        backgroundColor: "#fff",
        fontSize: 16,
        color: "#000",
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