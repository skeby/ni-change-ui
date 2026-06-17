import React from "react"

export interface CustomChartTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  isDarkMode?: boolean
  valuePrefix?: string
  valueSuffix?: string
  getColor?: (name: string) => string
}

export const CustomChartTooltip: React.FC<CustomChartTooltipProps> = ({
  active,
  payload,
  label,
  isDarkMode = false,
  valuePrefix = "",
  valueSuffix = "",
  getColor,
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="card p-3 shadow-xl space-y-1.5 border"
        style={{
          background: isDarkMode ? "#252525" : "#FFF",
          borderColor: isDarkMode ? "#3d3d3d" : "#E2E8F0",
          borderRadius: "12px",
        }}
      >
        {label && (
          <p className="text-xs font-bold" style={{ color: isDarkMode ? "#fff" : "#0f172a" }}>
            {label}
          </p>
        )}
        <div className="space-y-1">
          {payload.map((item, index) => {
            const finalColor = getColor
              ? getColor(item.payload.name || item.name || "")
              : (item.color || item.payload.fill || "#2563EB")
            return (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: finalColor }}
                />
                <span className="text-xs font-medium" style={{ color: isDarkMode ? "#e5e5e5" : "#334155" }}>
                  {item.name}:{" "}
                  <span className="font-bold">
                    {valuePrefix}
                    {item.value?.toLocaleString()}
                    {valueSuffix}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  return null
}

export default CustomChartTooltip
