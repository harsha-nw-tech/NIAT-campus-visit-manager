import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserInfo } from "@workspace/api-client-react";

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string, user: UserInfo) => void;
  logout: () => void;
  getHeaders: () => HeadersInit;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isAuthenticated: false,
  });
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("niat_token");
    const userStr = localStorage.getItem("niat_user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as UserInfo;
        setState({ token, user, isAuthenticated: true });
      } catch (e) {
        localStorage.removeItem("niat_token");
        localStorage.removeItem("niat_user");
      }
    }
    setIsInitializing(false);
  }, []);

  const login = (token: string, user: UserInfo) => {
    localStorage.setItem("niat_token", token);
    localStorage.setItem("niat_user", JSON.stringify(user));
    setState({ token, user, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem("niat_token");
    localStorage.removeItem("niat_user");
    setState({ token: null, user: null, isAuthenticated: false });
    window.location.href = "/login";
  };

  const getHeaders = (): HeadersInit => {
    return state.token ? { Authorization: `Bearer ${state.token}` } : {};
  };

  if (isInitializing) return null; // Or a beautiful splash screen

  return (
    <AuthContext.Provider value={{ ...state, login, logout, getHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
