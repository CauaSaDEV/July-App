import { Alert } from "react-native";

/**
 * Converte um erro do axios numa mensagem amigável em português,
 * baseado no status HTTP retornado pelo backend (ver doc da API).
 */
export function getErrorMessage(error) {
  if (!error?.response) {
    // Sem resposta do servidor: timeout, sem internet, backend fora do ar etc.
    return "Não foi possível conectar ao servidor. Verifique sua internet ou tente novamente em instantes.";
  }

  const { status, data } = error.response;
  const backendMessage = data?.message;

  switch (status) {
    case 400:
      return backendMessage || "Dados inválidos. Confira as informações e tente novamente.";
    case 401:
      return "Sua sessão expirou. Faça login novamente.";
    case 403:
      return "Você não tem permissão para acessar esse recurso.";
    case 404:
      return backendMessage || "Não encontramos o que você procurava.";
    case 409:
      return backendMessage || "Já existe um registro com essas informações.";
    default:
      if (status >= 500) {
        return "Ocorreu um erro no servidor. Tente novamente mais tarde.";
      }
      return backendMessage || "Algo deu errado. Tente novamente.";
  }
}

/**
 * Mostra um Alert nativo com o erro, pronto pra usar em catch blocks.
 * @param {*} error erro capturado (do axios)
 * @param {string} [title] título opcional do alerta
 */
export function notifyError(error, title = "Ops!") {
  Alert.alert(title, getErrorMessage(error));
}