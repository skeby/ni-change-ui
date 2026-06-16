import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface UserProfile {
  id: string
  name: string
  email: string
  initials: string
  department: string
  baseRoles: string[]
  firstName?: string
  lastName?: string
  phone?: string
  officeLocation?: string
}

interface AuthState {
  users: UserProfile[]
  currentUserId: string
  activeRoles: string[]
}

const mockUsers: UserProfile[] = [
  {
    id: "adeyinka@company.com",
    name: "Adeyinka Akinsanya",
    email: "adeyinka@company.com",
    initials: "AA",
    department: "IT",
    baseRoles: ["Requester", "Approver", "Tester", "Admin"],
    firstName: "Adeyinka",
    lastName: "Akinsanya",
    phone: "+1-613-555-0199",
    officeLocation: "Ottawa, Canada",
  },
  {
    id: "sarah.j@company.com",
    name: "Sarah Jenkins",
    email: "sarah.j@company.com",
    initials: "SJ",
    department: "Finance",
    baseRoles: ["Requester", "Approver"],
    firstName: "Sarah",
    lastName: "Jenkins",
    phone: "+1-416-555-0234",
    officeLocation: "Toronto, Canada",
  },
  {
    id: "marcus.v@company.com",
    name: "Marcus Vance",
    email: "marcus.v@company.com",
    initials: "MV",
    department: "Operations",
    baseRoles: ["Requester", "Approver", "Tester", "Admin"],
    firstName: "Marcus",
    lastName: "Vance",
    phone: "+1-604-555-0178",
    officeLocation: "Vancouver, Canada",
  },
  {
    id: "elena.r@company.com",
    name: "Elena Rostova",
    email: "elena.r@company.com",
    initials: "ER",
    department: "HR",
    baseRoles: ["Requester", "Tester"],
    firstName: "Elena",
    lastName: "Rostova",
    phone: "+1-514-555-0311",
    officeLocation: "Montreal, Canada",
  },
]

const initialState: AuthState = {
  users: mockUsers,
  currentUserId: "adeyinka@company.com",
  activeRoles: ["Requester"],
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<string>) => {
      const user = state.users.find((u) => u.id === action.payload)
      if (user) {
        state.currentUserId = user.id
        state.activeRoles = [...user.baseRoles]
      }
    },
    setActiveRoles: (state, action: PayloadAction<string[]>) => {
      state.activeRoles = action.payload
    },
    toggleActiveRole: (state, action: PayloadAction<string>) => {
      const role = action.payload
      if (state.activeRoles.includes(role)) {
        if (state.activeRoles.length > 1) {
          state.activeRoles = state.activeRoles.filter((r) => r !== role)
        }
      } else {
        state.activeRoles.push(role)
      }
    },
    updateUserProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      const user = state.users.find((u) => u.id === state.currentUserId)
      if (user) {
        Object.assign(user, action.payload)
      }
    },
  },
})

export const {
  setCurrentUser,
  setActiveRoles,
  toggleActiveRole,
  updateUserProfile,
} = authSlice.actions
export default authSlice.reducer
