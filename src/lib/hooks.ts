import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import * as React from "react";

// ==========================================
// AUTHENTICATION HOOKS
// ==========================================

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["auth_user"],
    queryFn: async () => {
      if (!apiClient.getAccessToken()) {
        return null;
      }
      try {
        return await apiClient.get("/users/me");
      } catch (err) {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: any) => {
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);
      
      const res = await apiClient.post("/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        skipAuth: true,
      });
      apiClient.setTokens(res.access_token, res.refresh_token);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth_user"] });
    },
  });

  const signupMutation = useMutation({
    mutationFn: (data: any) => apiClient.post("/auth/signup", data, { skipAuth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth_user"] });
    },
  });

  const demoLoginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/auth/demo-login", undefined, { skipAuth: true });
      apiClient.setTokens(res.access_token, res.refresh_token);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth_user"] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  const logout = () => {
    apiClient.clearTokens();
    queryClient.setQueriesData({ queryKey: ["auth_user"] }, null);
    queryClient.clear();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const forgotPasswordMutation = useMutation({
    mutationFn: (data: { email: string }) => apiClient.post("/auth/forgot-password", data, { skipAuth: true }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: any) => apiClient.post("/auth/reset-password", data, { skipAuth: true }),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiClient.put("/users/me/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth_user"] });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => apiClient.put("/users/me/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth_user"] });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: any) => apiClient.put("/users/me/password", data),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => apiClient.delete("/users/me"),
    onSuccess: () => {
      logout();
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: any) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth_user"] });
    },
  });

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    signup: signupMutation.mutateAsync,
    isSigningUp: signupMutation.isPending,
    demoLogin: demoLoginMutation.mutateAsync,
    isDemoLoggingIn: demoLoginMutation.isPending,
    logout,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    isForgotPasswordPending: forgotPasswordMutation.isPending,
    resetPassword: resetPasswordMutation.mutateAsync,
    isResetPasswordPending: resetPasswordMutation.isPending,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    updateSettings: updateSettingsMutation.mutateAsync,
    isUpdatingSettings: updateSettingsMutation.isPending,
    updatePassword: updatePasswordMutation.mutateAsync,
    isUpdatingPassword: updatePasswordMutation.isPending,
    deleteAccount: deleteAccountMutation.mutateAsync,
    isDeletingAccount: deleteAccountMutation.isPending,
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    isUploadingAvatar: uploadAvatarMutation.isPending,
  };
}

// ==========================================
// MEETINGS HOOKS
// ==========================================

export function useMeetings(filters: { search?: string; archived?: boolean } = {}) {
  const queryClient = useQueryClient();

  const queryParams = new URLSearchParams();
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.archived !== undefined) queryParams.append("archived", String(filters.archived));
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  const meetingsQuery = useQuery({
    queryKey: ["meetings", filters],
    queryFn: () => apiClient.get(`/meetings${queryString}`),
  });

  const uploadMeetingMutation = useMutation({
    mutationFn: (formData: FormData) => apiClient.post("/meetings/upload", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/meetings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  const updateMeetingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.patch(`/meetings/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["meeting", variables.id] });
    },
  });

  return {
    meetings: meetingsQuery.data || [],
    isLoading: meetingsQuery.isLoading,
    error: meetingsQuery.error,
    refetch: meetingsQuery.refetch,
    uploadMeeting: uploadMeetingMutation.mutateAsync,
    isUploading: uploadMeetingMutation.isPending,
    deleteMeeting: deleteMeetingMutation.mutateAsync,
    isDeleting: deleteMeetingMutation.isPending,
    updateMeeting: updateMeetingMutation.mutateAsync,
  };
}

export function useMeeting(id: string) {
  const queryClient = useQueryClient();

  const meetingQuery = useQuery({
    queryKey: ["meeting", id],
    queryFn: () => apiClient.get(`/meetings/${id}`),
    enabled: !!id,
  });

  const chatMutation = useMutation({
    mutationFn: (message: string) => apiClient.post(`/meetings/${id}/chat`, { message }),
  });

  return {
    meeting: meetingQuery.data,
    isLoading: meetingQuery.isLoading,
    error: meetingQuery.error,
    refetch: meetingQuery.refetch,
    chat: chatMutation.mutateAsync,
    isChatting: chatMutation.isPending,
  };
}

// ==========================================
// TASKS HOOKS
// ==========================================

export function useTasks() {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: () => apiClient.get("/tasks"),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: any) => apiClient.post("/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
  };
}

// ==========================================
// NOTIFICATIONS HOOKS
// ==========================================

export function useNotifications() {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiClient.get("/notifications"),
    refetchInterval: 15000, // Poll every 15s fallback
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/notifications/${id}/read`, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient.post("/notifications/read-all", null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    notifications: notificationsQuery.data || [],
    unreadCount: (notificationsQuery.data || []).filter((n: any) => !n.is_read).length,
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutateAsync,
  };
}

// ==========================================
// ANALYTICS & SEARCH HOOKS
// ==========================================

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: () => apiClient.get("/analytics"),
  });
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => apiClient.get(`/meetings/search/semantic?query=${encodeURIComponent(query)}`),
    enabled: !!query,
  });
}

export function useGlobalChat() {
  const chatMutation = useMutation({
    mutationFn: (message: string) => apiClient.post("/meetings/chat", { message }),
  });

  return {
    chat: chatMutation.mutateAsync,
    isChatting: chatMutation.isPending,
    error: chatMutation.error,
  };
}

// ==========================================
// WEBSOCKET REAL-TIME HOOK
// ==========================================

export function useWebSocket(userId: string | undefined, onMessage?: (data: any) => void) {
  const queryClient = useQueryClient();
  const socketRef = React.useRef<WebSocket | null>(null);

  React.useEffect(() => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || `${protocol}//localhost:8000/ws`;
    const socketUrl = `${wsBaseUrl}/${userId}`;
    const ws = new WebSocket(socketUrl);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        if (event.data === "pong") return;
        const data = JSON.parse(event.data);
        
        // Trigger generic callback if registered
        if (onMessage) {
          onMessage(data);
        }

        // Auto-invalidate matching query caches on events
        if (data.type === "meeting_update") {
          queryClient.invalidateQueries({ queryKey: ["meetings"] });
          queryClient.invalidateQueries({ queryKey: ["meeting", data.meeting_id] });
          queryClient.invalidateQueries({ queryKey: ["analytics"] });
        } else if (data.type === "notification") {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        } else if (data.type === "task") {
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        }
      } catch (err) {
        // Simple text frame ignore
      }
    };

    ws.onclose = () => {
      // Reconnect logic can be placed here if needed
    };

    // Heartbeat ping interval
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("ping");
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, [userId, queryClient, onMessage]);

  return socketRef.current;
}
