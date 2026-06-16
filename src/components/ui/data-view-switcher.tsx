import React from "react"
import { FaTableCellsLarge, FaList } from "react-icons/fa6"
import { Tooltip } from "antd"
import { useAppDispatch, useAppSelector } from "../../state/store"
import { setDataView } from "../../state/slices/app-slice"

export const DataViewSwitcher: React.FC = () => {
  const dispatch = useAppDispatch()
  const { dataView } = useAppSelector((state) => state.app)

  return (
    <div className="border-border bg-bg-muted flex h-11! shrink-0 items-center rounded-xl border p-1 shadow-xs relative transition-all duration-300 ease-in-out">
      <Tooltip title="Card View" mouseEnterDelay={0.3}>
        <button
          onClick={() => dispatch(setDataView("card"))}
          className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg p-2 transition-all duration-200 active:scale-90 ${
            dataView === "card"
              ? "text-primary-alpha bg-bg border-border border shadow-xs scale-100 font-bold"
              : "text-fade-2 hover:text-fade border border-transparent bg-transparent hover:scale-105"
          }`}
          aria-label="Card View"
        >
          <FaTableCellsLarge className="h-4 w-4" />
        </button>
      </Tooltip>
      <Tooltip title="Table View" mouseEnterDelay={0.3}>
        <button
          onClick={() => dispatch(setDataView("table"))}
          className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg p-2 transition-all duration-200 active:scale-90 ${
            dataView === "table"
              ? "text-primary-alpha bg-bg border-border border shadow-xs scale-100 font-bold"
              : "text-fade-2 hover:text-fade border border-transparent bg-transparent hover:scale-105"
          }`}
          aria-label="Table View"
        >
          <FaList className="h-4 w-4" />
        </button>
      </Tooltip>
    </div>
  )
}
export default DataViewSwitcher
