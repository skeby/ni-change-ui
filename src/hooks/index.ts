import { useAppSelector } from "../state/store"
import { useSearchParams as useInternalSearchParams } from "react-router-dom"

export const useAuth = () => useAppSelector((state) => state.auth)
export const useChanges = () => useAppSelector((state) => state.changes)
export const useSettings = () => useAppSelector((state) => state.settings)
export const useNotifications = () => useAppSelector((state) => state.notifications)

export { useTheme } from "./use-theme"

type SetURLSearchParams = (obj: { [key: string]: string }) => void
type RemoveURLSearchParams = () => void

export const useSearchParams = () => {
  const [internalSearchParams, internalSetSearchParams] =
    useInternalSearchParams()

  const setSearchParams: SetURLSearchParams = (obj?: {
    [key: string]: string
  }) => {
    const params = new URLSearchParams(internalSearchParams)
    Object.entries(obj ?? {}).forEach(([key, value]) => {
      params.set(key, value)
    })
    internalSetSearchParams(params)
  }

  const removeSearchParams: RemoveURLSearchParams = () => {
    internalSetSearchParams({})
  }

  return [internalSearchParams, setSearchParams, removeSearchParams] as [
    URLSearchParams,
    SetURLSearchParams,
    RemoveURLSearchParams,
  ]
}
