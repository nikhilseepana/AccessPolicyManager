import { createContext, useContext, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import type { LoginData } from "@shared/schema";

const AuthContext = createContext<ReturnType<typeof useAuthProvider> | null>(null);

function useAuthProvider() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const userQuery = useQuery<User>({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Login failed");
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["user"], user);
      toast({
        description: "Logged in successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: "Login failed. Please check your credentials.",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Registration failed");
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["user"], user);
      toast({
        description: "Registered successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: "Registration failed. Please try again.",
      });
    },
  });

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    loginMutation,
    registerMutation,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}