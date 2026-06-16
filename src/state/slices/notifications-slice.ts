import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  changeId?: string
  timestamp: string
}

interface NotificationsState {
  notifications: Notification[]
}

const initialState: NotificationsState = {
  notifications: [
    {
      id: "n-1",
      title: "Change request approved",
      message: "CR-2026-0002 has been approved by Adeyinka Akinsanya.",
      type: "success",
      read: false,
      changeId: "CR-2026-0002",
      timestamp: "2026-06-12T14:00:00Z",
    },
    {
      id: "n-2",
      title: "New change request submitted",
      message: "CR-2026-0006 submitted by Elena Rostova requires your review.",
      type: "info",
      read: false,
      changeId: "CR-2026-0006",
      timestamp: "2026-06-13T14:00:00Z",
    },
    {
      id: "n-3",
      title: "Testing in progress",
      message: "CR-2026-0003 sandbox testing has started.",
      type: "info",
      read: true,
      changeId: "CR-2026-0003",
      timestamp: "2026-06-14T09:00:00Z",
    },
    {
      id: "n-4",
      title: "Deployment complete",
      message: "CR-2026-0004 has been deployed to production.",
      type: "success",
      read: true,
      changeId: "CR-2026-0004",
      timestamp: "2026-06-09T14:00:00Z",
    },
  ],
}

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload)
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const n = state.notifications.find((n) => n.id === action.payload)
      if (n) n.read = true
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((n) => (n.read = true))
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload)
    },
  },
})

export const { addNotification, markAsRead, markAllAsRead, removeNotification } =
  notificationsSlice.actions
export default notificationsSlice.reducer
