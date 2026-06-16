import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

export interface AppState {
  showSideBar: boolean
  sidebarAutoHidden: boolean
  themeOverride: "light" | "dark" | null
  dataView: DataView
}

export type DataView = "table" | "card"

const initialState: AppState = {
  showSideBar: true,
  sidebarAutoHidden: false,
  themeOverride: null,
  dataView: "table",
}

const AppSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setShowSideBar: (state, action: PayloadAction<boolean>) => {
      state.showSideBar = action.payload
    },
    setSidebarAutoHidden: (state, action: PayloadAction<boolean>) => {
      state.sidebarAutoHidden = action.payload
    },
    setThemeOverride: (
      state,
      action: PayloadAction<"light" | "dark" | null>
    ) => {
      state.themeOverride = action.payload
    },
    setDataView: (state, action: PayloadAction<DataView>) => {
      state.dataView = action.payload
    },
    resetAppSlice: () => {
      return { ...initialState }
    },
  },
})

export default AppSlice.reducer
export const {
  setShowSideBar,
  resetAppSlice,
  setDataView,
  setSidebarAutoHidden,
  setThemeOverride,
} = AppSlice.actions
