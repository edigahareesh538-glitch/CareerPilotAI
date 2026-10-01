import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "./api";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  role: string;
  created_at: string;
  last_login_at: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: true,

      setAuth: (user, accessToken, refreshToken) => {
        api.setAccessToken(accessToken);
        set({ user, accessToken, refreshToken, isLoading: false });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        api.setAccessToken(null);
        set({ user: null, accessToken: null, refreshToken: null });
      },

      checkAuth: async () => {
        // The app no longer has a login page/gate. If we happen to hold an
        // access token (e.g. from the optional /auth/register flow) send it
        // along, but either way just ask the API who the current user is —
        // the backend resolves this to the demo/guest account when no token
        // is present, so the app always has a usable user.
        const { accessToken } = get();
        if (accessToken) {
          api.setAccessToken(accessToken);
        }

        try {
          const user = await api.get<User>("/api/v1/auth/me");
          set({ user, isLoading: false });
        } catch {
          set({ user: null, isLoading: false });
        }
      },
    }),
    {
      name: "careerpilot-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);