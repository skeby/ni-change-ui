import React from "react"
import { Button } from "antd"
import { useNavigate } from "react-router-dom"
import { FileQuestion, ArrowLeft } from "lucide-react"

export const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      <div className="bg-bg-muted mb-6 flex h-20 w-20 items-center justify-center rounded-2xl">
        <FileQuestion className="text-fade h-10 w-10" />
      </div>

      <h1 className="text-display-md text-primary-alpha mb-2 font-bold">404</h1>
      <p className="text-body-md text-fade-2 mb-1 font-semibold">Page Not Found</p>
      <p className="text-body-sm text-fade mb-8 max-w-sm text-center">
        The page you are looking for does not exist or has been moved.
        Check the URL or navigate back to the dashboard.
      </p>

      <Button
        type="primary"
        onClick={() => navigate("/")}
        className="bg-primary hover:bg-primary/90 text-body-sm flex h-11 items-center gap-2 rounded-xl border-none px-6 font-bold text-white"
        icon={<ArrowLeft className="h-4 w-4" />}
      >
        Go to Dashboard
      </Button>
    </div>
  )
}

export default NotFound
