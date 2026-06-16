import React from "react"
import { useAppSelector } from "../state/store"
import { FaMapPin, FaPhone } from "react-icons/fa6"
import { IoIosMail } from "react-icons/io"

export const Profile: React.FC = () => {
  const { currentUserId, users, activeRoles } = useAppSelector(
    (state) => state.auth
  )
  const currentUser = users.find((u) => u.id === currentUserId)

  if (!currentUser) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-fade text-body-md">No user profile found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex w-full flex-col items-start gap-6 md:flex-row">
        {/* Left Sidebar Profile Card */}
        <div className="w-full shrink-0 md:sticky md:top-0 md:w-80">
          <div className="card flex flex-col items-center space-y-4 p-6 text-center">
            {/* Initials Avatar */}
            <div className="bg-ni-primary text-display-md flex h-20 w-20 items-center justify-center rounded-full font-bold text-white shadow-[0_4px_12px_rgba(164,52,58,0.2)]">
              {currentUser.initials}
            </div>

            <div>
              <h2 className="text-h2 text-primary-alpha font-bold">
                {currentUser.name}
              </h2>
              <p className="text-body-sm text-fade mt-1 font-medium">
                {currentUser.department}
              </p>
            </div>

            {/* Active Roles */}
            <div className="flex flex-wrap justify-center gap-1.5">
              {activeRoles.map((role) => (
                <span
                  key={role}
                  className="bg-primary-light text-primary text-[11px] font-semibold rounded-full px-2.5 py-0.5"
                >
                  {role}
                </span>
              ))}
            </div>

            <div className="border-border-muted my-2 w-full border-t" />

            {/* Contact Details */}
            <div className="w-full space-y-3 text-left">
              <div className="text-body-sm text-fade flex items-center gap-2 font-medium">
                <IoIosMail className="h-4 w-4 shrink-0" />
                <span className="truncate" title={currentUser.email}>
                  {currentUser.email}
                </span>
              </div>
              {currentUser.phone && (
                <div className="text-body-sm text-fade flex items-center gap-2 font-medium">
                  <FaPhone className="h-3.5 w-3.5 shrink-0" />
                  <span>{currentUser.phone}</span>
                </div>
              )}
              {currentUser.officeLocation && (
                <div className="text-body-sm text-fade flex items-center gap-2 font-medium">
                  <FaMapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{currentUser.officeLocation}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Main Detail Card */}
        <div className="w-full flex-1 space-y-6">
          {/* Personal Information */}
          <div className="card space-y-4 p-6">
            <h3 className="card-title text-ni-primary font-sora">
              Personal Information
            </h3>
            <div className="divide-border-muted divide-y">
              <div className="text-body-md flex items-center justify-between py-3.5">
                <span className="text-fade font-medium">First Name</span>
                <span className="text-primary-alpha font-bold">
                  {currentUser.firstName || "--"}
                </span>
              </div>
              <div className="text-body-md flex items-center justify-between py-3.5">
                <span className="text-fade font-medium">Last Name</span>
                <span className="text-primary-alpha font-bold">
                  {currentUser.lastName || "--"}
                </span>
              </div>
              <div className="text-body-md flex items-center justify-between py-3.5">
                <span className="text-fade font-medium">Email</span>
                <span className="text-primary-alpha font-bold">
                  {currentUser.email || "--"}
                </span>
              </div>
              <div className="text-body-md flex items-center justify-between py-3.5">
                <span className="text-fade font-medium">Phone</span>
                <span className="text-primary-alpha font-bold">
                  {currentUser.phone || "--"}
                </span>
              </div>
              <div className="text-body-md flex items-center justify-between py-3.5">
                <span className="text-fade font-medium">Department</span>
                <span className="text-primary-alpha font-bold">
                  {currentUser.department || "--"}
                </span>
              </div>
              <div className="text-body-md flex items-center justify-between py-3.5">
                <span className="text-fade font-medium">Office Location</span>
                <span className="text-primary-alpha font-bold">
                  {currentUser.officeLocation || "--"}
                </span>
              </div>
            </div>
          </div>

          {/* Roles & Permissions */}
          <div className="card space-y-4 p-6">
            <h3 className="card-title text-ni-primary font-sora">
              Roles & Permissions
            </h3>
            <div className="divide-border-muted divide-y">
              <div className="text-body-md flex items-center justify-between py-3.5">
                <span className="text-fade font-medium">Base Roles</span>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {currentUser.baseRoles.map((role) => (
                    <span
                      key={role}
                      className="bg-bg-muted text-primary-alpha rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-body-md flex items-center justify-between py-3.5">
                <span className="text-fade font-medium">Active Roles</span>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {activeRoles.map((role) => (
                    <span
                      key={role}
                      className="bg-primary-light text-primary rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
