import { Tag as AntTag, Skeleton, type TagProps } from "antd"
import { colorMap } from "../../static"
import { Utils } from "../../utils"
import chroma from "chroma-js"
import { useTheme } from "../../hooks"

interface Props extends TagProps {
  value?: string
  loading?: boolean
  format?: boolean
}

const Tag = ({ children, value, loading, format = true, ...rest }: Props) => {
  const { primary } = useTheme()
  const status = value?.toLowerCase()?.trim()
    ? value?.toLowerCase()?.trim()
    : typeof children === "string"
      ? children
      : "default"

  const color =
    rest.color === "primary"
      ? primary
      : rest.color || colorMap[status.toLowerCase()] || "#6b7280"

  if (loading)
    return (
      <Skeleton.Node
        active
        style={{
          width: 20,
          height: 18,
          borderRadius: 8,
        }}
        rootClassName="leading-none!"
      />
    )

  return (
    <AntTag
      {...rest}
      style={{
        backgroundColor: chroma.valid(color)
          ? chroma(color).alpha(0.1).css()
          : "transparent",
        color: color,
        ...rest.style,
      }}
      className={Utils.cn(
        "w-fit! rounded-sm! px-3! py-1.5! leading-none! font-semibold! capitalize!",
        rest.className
      )}
    >
      {typeof children === "string" && format
        ? `${children.charAt(0).toUpperCase()}${children.slice(1).replace(/[_-]+/g, " ")}`
        : children}
    </AntTag>
  )
}

export default Tag
