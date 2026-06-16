import { Outlet, useNavigation } from "react-router-dom"
import Spinner from "../ui/spinner"

const RootLayout = () => {
  const navigation = useNavigation()
  const isLoading = navigation.state === "loading"

  return (
    <>
      <Spinner loading={isLoading} className="bg-bg fixed z-500 h-screen" />
      <Outlet />
    </>
  )
}

export default RootLayout
