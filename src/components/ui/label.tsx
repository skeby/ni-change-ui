import * as React from "react"
import { cn } from "../../utils/cn"

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-body-sm font-bold text-primary-alpha block mb-1.5 cursor-pointer select-none",
          className
        )}
        {...props}
      />
    )
  }
)
Label.displayName = "Label"

export default Label
export { Label }
