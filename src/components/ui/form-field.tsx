import { cloneElement, type ReactElement, type ReactNode } from "react"
import {
  type Control,
  Controller,
  type ControllerProps,
  type FieldError,
  type FieldValues,
  type Path,
} from "react-hook-form"
import Label, { type LabelProps } from "./label"
import { cn } from "../../utils/cn"

type FormFieldProps<T extends FieldValues> = {
  name?: Path<T>
  children?: ReactElement<any>
  control?: Control<T>
  label?: ReactNode
  error?: FieldError
  render?: ControllerProps<T>["render"]
  labelProps?: LabelProps
  rootClassName?: string
  bodyClassName?: string
  alignment?: "horizontal" | "vertical"
  valuePropName?: string
  required?: boolean
}

const FormField = <T extends FieldValues>({
  name,
  children,
  label,
  control,
  error,
  render,
  labelProps,
  rootClassName,
  alignment = "vertical",
  valuePropName = "value",
  bodyClassName,
  required = false,
}: FormFieldProps<T>) => {
  const defaultRender: ControllerProps<T>["render"] = ({
    field: { value, onChange, ...fieldRest },
    fieldState: { error: fieldError },
  }) => {
    const isSelect = children && (
      (children.type as any)?.displayName === "Select" ||
      (children.type as any)?.name === "Select"
    );
    const resolvedValue = isSelect && value === "" ? undefined : value;

    return children ? (
      <div className={cn("w-full", bodyClassName)}>
        {cloneElement(children, {
          ...fieldRest,
          id: name,
          [valuePropName]: resolvedValue,
          onChange: (e: any) => {
            if (e?.target && typeof e.target === "object") {
              const target = e.target as HTMLInputElement
              if (valuePropName === "checked") {
                onChange(target.checked)
                return
              }
              if ("value" in target) {
                onChange(target.value)
                return
              }
            }
            onChange(e)
          },
        })}
        {(fieldError || error) && (
          <span className="text-error mt-1.5 block text-sm">
            {fieldError?.message || error?.message || error?.root?.message}
          </span>
        )}
      </div>
    ) : (
      <></>
    );
  };

  return (
    <div
      className={cn(
        `flex ${alignment === "vertical" ? "flex-col animate-fade-in" : "flex-row items-center"}`,
        rootClassName
      )}
    >
      {label && (
        <Label
          htmlFor={name}
          {...labelProps}
          className={cn(
            `flex items-center gap-x-1 ${alignment === "vertical" ? "" : "mb-0"}`,
            labelProps?.className
          )}
        >
          {label} {required && <span className="text-error font-bold">*</span>}
        </Label>
      )}

      {control && name ? (
        <Controller
          name={name}
          control={control}
          render={
            render
              ? (renderProps) => {
                  const {
                    fieldState: { error: fieldError },
                  } = renderProps
                  const renderedChildren = render(renderProps)
                  return (
                    <div className={cn("w-full", bodyClassName)}>
                      {renderedChildren}
                      {(fieldError || error) && (
                        <span className="text-error mt-1.5 block text-sm">
                          {fieldError?.message ||
                            error?.message ||
                            error?.root?.message}
                        </span>
                      )}
                    </div>
                  )
                }
              : defaultRender
          }
        />
      ) : (
        <div className={cn("w-full", bodyClassName)}>
          {children}
          {error && (
            <span className="text-error mt-1.5 block text-sm">
              {error.message || error.root?.message}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default FormField
export { FormField }
