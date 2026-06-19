import { configureStore, combineReducers } from "@reduxjs/toolkit"
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist"
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "react-redux"

import authReducer from "./slices/auth-slice"
import appReducer from "./slices/app-slice"
import changesReducer from "./slices/changes-slice"
import settingsReducer from "./slices/settings-slice"
import notificationsReducer from "./slices/notifications-slice"

const localStorageEngine = {
  getItem: (key: string): Promise<string | null> => {
    return Promise.resolve(localStorage.getItem(key))
  },
  setItem: (key: string, value: string): Promise<void> => {
    localStorage.setItem(key, value)
    return Promise.resolve()
  },
  removeItem: (key: string): Promise<void> => {
    localStorage.removeItem(key)
    return Promise.resolve()
  },
}

// Clean up old persist key
if (typeof window !== "undefined" && window.localStorage) {
  try {
    localStorage.removeItem("persist:ni-change-mgmt-root-v5")
  } catch (e) {
    console.error("Failed to clean up old persist key", e)
  }
}

const rootReducer = combineReducers({
  auth: authReducer,
  app: appReducer,
  changes: changesReducer,
  settings: settingsReducer,
  notifications: notificationsReducer,
})

const persistConfig = {
  key: "ni-change-mgmt-root-v6",
  storage: localStorageEngine,
  whitelist: ["auth", "changes", "settings", "app", "notifications"],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
