import { Button, Dropdown, type DropdownProps } from "antd"
import type { ReactNode } from "react"
import {
  AiFillCheckCircle,
  AiFillCloseCircle,
  AiFillEdit,
  AiFillEye,
  AiFillQuestionCircle,
  AiFillStar,
} from "react-icons/ai"
import { HiEllipsisVertical } from "react-icons/hi2"
import { Utils } from "../../utils"
import { RiAddCircleFill, RiIndeterminateCircleFill } from "react-icons/ri"
import { FaTrash } from "react-icons/fa6"

interface Props extends Omit<DropdownProps, "menu"> {
  items: {
    label: string
    icon?:
      | "edit"
      | "delete"
      | "activate"
      | "deactivate"
      | "star"
      | "view"
      | "check"
      | "close"
      | "question"
      | ReactNode
    onClick?: () => void
    disabled?: boolean
  }[]
}

const DataTableActions = ({ items, ...dropdownProps }: Props) => {
  const iconMap: Record<string, ReactNode> = {
    edit: <AiFillEdit className="text-primary size-5" />,
    view: <AiFillEye className="text-primary size-5" />,
    add: <RiAddCircleFill className="text-primary size-5" />,
    activate: <RiAddCircleFill className="text-success size-5" />,
    deactivate: <RiIndeterminateCircleFill className="size-5 text-[#EA580C]" />,
    delete: <FaTrash className="text-error ml-0.5 size-4" />,
    star: <AiFillStar className="text-amber size-5" />,
    check: <AiFillCheckCircle className="text-success size-5" />,
    close: <AiFillCloseCircle className="text-error size-4.5" />,
    question: <AiFillQuestionCircle className="text-amber size-5" />,
  }

  const filteredItems = items.filter((i) => !i.disabled)

  if (filteredItems.length === 0) return null

  return (
    <Dropdown
      {...dropdownProps}
      trigger={["click"]}
      menu={{
        items: filteredItems.map((item, index) => ({
          key: index,
          type: "item",
          label: item.label,
          className:
            "text-secondary-alpha! leading-5! tracking-tight! font-semibold! p-2!",
          icon: typeof item.icon === "string" ? iconMap[item.icon] : item.icon,
          onClick: (info) => {
            info.domEvent.stopPropagation()
            item.onClick?.()
          },
        })),
        className: "p-2! rounded-lg!",
      }}
      rootClassName={Utils.cn("", dropdownProps.rootClassName)}
    >
      {dropdownProps?.children ?? (
        <Button
          type="link"
          className="size-8 px-0!"
          onClick={(e) => e.stopPropagation()}
        >
          <HiEllipsisVertical className="text-primary size-6" />
        </Button>
      )}
    </Dropdown>
  )
}

export default DataTableActions
export { DataTableActions }
