const TOKEN_KEY = 'calculadora_auth_token';
const USER_KEY = 'calculadora_auth_user';

export interface User {
  id: number;
  username: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Salvar token e usuário
export const saveAuth = (token: string, user: User) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Obter token
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Obter usuário
export const getUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// Verificar se está autenticado
export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};

// Remover autenticação
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Obter headers com token
export const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  if (!token) {
    return {};
  }
  return {
    'Authorization': `Bearer ${token}`
  };
};

