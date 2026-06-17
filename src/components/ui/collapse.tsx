import { Collapse as AntdCollapse, type CollapseProps } from "antd"
import { FaChevronDown } from "react-icons/fa6"
import { Utils } from "../../utils"

export interface CustomCollapseProps extends CollapseProps {
  className?: string
}

export const Collapse = ({
  className,
  expandIconPosition = "end",
  ...rest
}: CustomCollapseProps) => {
  return (
    <AntdCollapse
      expandIconPosition={expandIconPosition}
      expandIcon={({ isActive }) => (
        <FaChevronDown
          className={Utils.cn(
            "text-fade-2 h-3.5 w-3.5 transition-transform duration-200",
            isActive && "rotate-180"
          )}
        />
      )}
      {...rest}
      className={Utils.cn("custom-collapse", className)}
    />
  )
}

export default Collapse
