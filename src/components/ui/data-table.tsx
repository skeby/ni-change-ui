import { Button, Empty, Input, Table, type TableProps } from "antd"
import {
  Fragment,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Key,
  type ReactElement,
  type ReactNode,
} from "react"
import { AiOutlineSearch } from "react-icons/ai"
import ExportIcon from "../../assets/icons/export.svg?react"
import { HiOutlineEllipsisVertical } from "react-icons/hi2"
import { FaFileExcel, FaFilePdf } from "react-icons/fa6"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import DataTableActions from "./data-table-actions"
import { Utils } from "../../utils"
import { MdCancel } from "react-icons/md"
import Fuse, { type IFuseOptions } from "fuse.js"
import Mark from "mark.js"
import { useSearchParams } from "../../hooks"
import { TableFilter, type FilterField } from "./table-filter"

export type { FilterField }

type TableRecord = Record<string, unknown>

type DataTableColumn = {
  key?: Key
  title?: ReactNode
  dataIndex?: string | number | readonly (string | number)[]
  render?: (value: unknown, record: TableRecord, index: number) => unknown
  children?: DataTableColumn[]
}

type SearchDocument = {
  row: TableRecord
  searchText: string
}

type RenderCellLike = {
  children?: ReactNode
}

type ExtractTextProps = {
  children?: ReactNode
  [key: string]: unknown
}

const NON_TEXT_PROP_KEYS = new Set([
  "className",
  "style",
  "to",
  "href",
  "src",
  "target",
  "rel",
  "tabIndex",
  "icon",
  "prefix",
  "suffix",
  "avatarProps",
])

const isRenderCellLike = (value: unknown): value is RenderCellLike =>
  typeof value === "object" && value !== null && "children" in value

const normalizeSearchText = (value: string) =>
  value.toLowerCase().replace(/\s+/g, " ").trim()

const getDataIndexPath = (
  dataIndex?: string | number | readonly (string | number)[]
): (string | number)[] => {
  if (Array.isArray(dataIndex)) return [...dataIndex]
  if (typeof dataIndex === "string" || typeof dataIndex === "number") {
    return [dataIndex]
  }
  return []
}

const getValueByPath = (record: TableRecord, path: (string | number)[]) => {
  // AntD passes the full row as the first render arg when dataIndex is not set.
  if (path.length === 0) return record

  return path.reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined) return undefined
    if (Array.isArray(acc) && typeof key === "number") return acc[key]
    if (typeof acc === "object") {
      return (acc as Record<string | number, unknown>)[key]
    }
    return undefined
  }, record)
}

const extractTextFromPropValue = (
  value: unknown,
  seen: WeakSet<object>
): string => {
  if (value === null || value === undefined || typeof value === "boolean")
    return ""
  if (typeof value === "string" || typeof value === "number") {
    return String(value)
  }
  if (typeof value === "function") return ""
  if (Array.isArray(value)) {
    return value.map((item) => extractTextFromPropValue(item, seen)).join(" ")
  }
  if (isValidElement<ExtractTextProps>(value)) {
    return extractTextFromElement(value, seen)
  }
  if (typeof value === "object") {
    if (seen.has(value)) return ""
    seen.add(value)
    return Object.values(value as Record<string, unknown>)
      .map((item) => extractTextFromPropValue(item, seen))
      .join(" ")
  }
  return ""
}

const extractTextFromElementProps = (
  props: ExtractTextProps,
  seen: WeakSet<object>
) =>
  Object.entries(props)
    .map(([key, value]) => {
      if (key === "children") return ""
      if (key.startsWith("on")) return ""
      if (NON_TEXT_PROP_KEYS.has(key)) return ""
      return extractTextFromPropValue(value, seen)
    })
    .join(" ")

const extractTextFromElement = (
  node: ReactElement<ExtractTextProps>,
  seen: WeakSet<object>
) => {
  const childrenText = extractTextFromNode(node.props.children ?? null, seen)
  const propsText = extractTextFromElementProps(node.props, seen)
  return `${childrenText} ${propsText}`.trim()
}

const extractTextFromNode = (
  node: ReactNode,
  seen = new WeakSet<object>()
): string => {
  if (node === null || node === undefined || typeof node === "boolean")
    return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) {
    return node.map((item) => extractTextFromNode(item, seen)).join(" ")
  }
  if (isValidElement<ExtractTextProps>(node)) {
    return extractTextFromElement(node, seen)
  }
  return ""
}

const extractTextFromUnknown = (value: unknown): string => {
  if (value === null || value === undefined || typeof value === "boolean")
    return ""
  if (typeof value === "string" || typeof value === "number") {
    return String(value)
  }
  if (Array.isArray(value)) {
    return value.map((item) => extractTextFromUnknown(item)).join(" ")
  }
  if (isValidElement<ExtractTextProps>(value)) {
    return extractTextFromElement(value, new WeakSet<object>())
  }
  return ""
}

const getRenderableText = (value: unknown): string => {
  if (isRenderCellLike(value)) {
    return extractTextFromNode(value.children ?? null)
  }
  return extractTextFromUnknown(value)
}

const getLeafColumns = (columns: DataTableColumn[]): DataTableColumn[] =>
  columns.flatMap((column) =>
    Array.isArray(column.children) && column.children.length > 0
      ? getLeafColumns(column.children)
      : [column]
  )

const getColumnIdentifiers = (column: DataTableColumn): string[] => {
  const identifiers = new Set<string>()
  const path = getDataIndexPath(column.dataIndex)

  if (column.key !== undefined) {
    identifiers.add(String(column.key))
  }

  if (path.length > 0) {
    identifiers.add(path.join("."))
    if (path.length === 1) identifiers.add(String(path[0]))
  }

  return [...identifiers]
}

const DataTable = <T extends any = any>(
  props: TableProps<T> & {
    name?: string
    search?: {
      placeholder?: string
      onSearch?: (value: string) => void
      position?: "left" | "right"
      keys?: string[]
      debounceMs?: number
      minChars?: number
      fuseOptions?: Omit<IFuseOptions<SearchDocument>, "keys">
    }
    filter?: {
      loading?: boolean
      fields: FilterField[]
      value: Record<string, (string | number)[]>
      onChange: (value: Record<string, (string | number)[]>) => void
    }
    exportTable?: {
      columns?: DataTableColumn[]
      fileName?: string
      fileNamePrefix?: string
    }
    left?: ReactNode[]
    right?: ReactNode[]
    menu?: Record<string, never>
    cardClassName?: string
    headerClassName?: string
    leftClassName?: string
    rightClassName?: string
  }
) => {
  const {
    name,
    search,
    left,
    right,
    filter,
    exportTable,
    menu,
    cardClassName,
    headerClassName,
    leftClassName,
    rightClassName,
    dataSource,
    columns,
    ...rest
  } = props
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [searchParam, setSearchParams] = useSearchParams()

  const tableRef = useRef<HTMLDivElement>(null)
  const debounceMs = search?.debounceMs ?? 250
  const minChars = search?.minChars ?? 1

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => window.clearTimeout(timeoutId)
  }, [query, debounceMs])

  const normalizedDataSource = useMemo<TableRecord[]>(
    () => (Array.isArray(dataSource) ? (dataSource as TableRecord[]) : []),
    [dataSource]
  )

  const leafColumns = useMemo(
    () => getLeafColumns((columns as DataTableColumn[]) || []),
    [columns]
  )

  const searchKeys = useMemo(() => search?.keys ?? [], [search?.keys])

  const searchableColumns = useMemo(() => {
    if (searchKeys.length === 0) return leafColumns

    return leafColumns.filter((column) => {
      const identifiers = getColumnIdentifiers(column)
      return identifiers.some((identifier) => searchKeys.includes(identifier))
    })
  }, [leafColumns, searchKeys])

  const unmatchedSearchKeys = useMemo(() => {
    if (searchKeys.length === 0) return []

    return searchKeys.filter(
      (key) =>
        !searchableColumns.some((column) =>
          getColumnIdentifiers(column).includes(key)
        )
    )
  }, [searchKeys, searchableColumns])

  const searchDocuments = useMemo<SearchDocument[]>(() => {
    return normalizedDataSource.map((record, rowIndex) => {
      const renderedText = searchableColumns
        .map((column) => {
          const rawValue = getValueByPath(
            record,
            getDataIndexPath(column.dataIndex)
          )
          if (column.render) {
            const renderedValue = column.render(rawValue, record, rowIndex)
            return getRenderableText(renderedValue)
          }
          return extractTextFromUnknown(rawValue)
        })
        .join(" ")

      const unmatchedRawText = unmatchedSearchKeys
        .map((key) =>
          extractTextFromUnknown(getValueByPath(record, key.split(".")))
        )
        .join(" ")

      return {
        row: record,
        searchText: normalizeSearchText(`${renderedText} ${unmatchedRawText}`),
      }
    })
  }, [normalizedDataSource, searchableColumns, unmatchedSearchKeys])

  const fuse = useMemo(
    () =>
      new Fuse(searchDocuments, {
        keys: ["searchText"],
        threshold: 0.3,
        ignoreLocation: true,
        ...search?.fuseOptions,
      }),
    [searchDocuments, search?.fuseOptions]
  )

  const trimmedDebouncedQuery = debouncedQuery.trim()
  const normalizedQuery = normalizeSearchText(trimmedDebouncedQuery)

  const filteredData = useMemo(() => {
    if (!normalizedQuery) return normalizedDataSource
    if (normalizedQuery.length < minChars) return normalizedDataSource

    const result = fuse.search(normalizedQuery).map((res) => res.item.row)
    return result
  }, [normalizedDataSource, normalizedQuery, minChars, fuse])

  const exportName =
    exportTable?.fileName ||
    `NI_Change_${exportTable?.fileNamePrefix || name || "export"}_${new Date().toISOString()}`.replaceAll(
      " ",
      "_"
    )

  // Sanitize worksheet name - Excel doesn't allow: * ? : \ / [ ]
  const sanitizeWorksheetName = (name: string) =>
    name.replace(/[*?:\\/[\]]/g, "-").slice(0, 31)

  const handleExportExcel = async () => {
    if (!exportTable) return

    const exportColumns = (exportTable.columns || leafColumns)?.filter(
      (col) => col.key !== "actions"
    )

    const workbook = new ExcelJS.Workbook()

    const worksheet = workbook.addWorksheet(sanitizeWorksheetName(exportName))

    worksheet.columns = exportColumns.map((col) => ({
      header: String(
        extractTextFromUnknown(col.title) || col.key || col.dataIndex || ""
      ),
      key: String(
        col.key ||
          (Array.isArray(col.dataIndex)
            ? col.dataIndex.join(".")
            : col.dataIndex)
      ),
      width: 25,
    }))

    filteredData.forEach((record, index) => {
      const rowData: Record<string, unknown> = {}
      exportColumns.forEach((col) => {
        const key = String(
          col.key ||
            (Array.isArray(col.dataIndex)
              ? col.dataIndex.join(".")
              : col.dataIndex)
        )
        let value = getValueByPath(record, getDataIndexPath(col.dataIndex))
        if (col.render) {
          const renderedVal = col.render(value, record, index)
          value = getRenderableText(renderedVal)
        } else {
          value = extractTextFromUnknown(value)
        }
        rowData[key] = value
      })
      worksheet.addRow(rowData)
    })

    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.alignment = { vertical: "middle", horizontal: "center" }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    saveAs(blob, `${exportName}.xlsx`)
  }

  const handleExportPdf = () => {
    if (!exportTable) return

    const exportColumns = (exportTable.columns || leafColumns)?.filter(
      (col) => col.key !== "actions"
    )
    const doc = new jsPDF()

    const headers = exportColumns.map((col) =>
      String(
        extractTextFromUnknown(col.title) || col.key || col.dataIndex || ""
      )
    )

    const data = filteredData.map((record, index) => {
      return exportColumns.map((col) => {
        const value = getValueByPath(record, getDataIndexPath(col.dataIndex))
        if (col.render) {
          const renderedVal = col.render(value, record, index)
          return getRenderableText(renderedVal)
        }
        return extractTextFromUnknown(value)
      })
    })

    autoTable(doc, {
      head: [headers],
      body: data,
      margin: 5,
    })

    doc.save(`${exportName}.pdf`)
  }

  const highlightedQuery =
    trimmedDebouncedQuery.length >= minChars ? trimmedDebouncedQuery : ""

  useEffect(() => {
    if (!tableRef.current) return

    // Target the table body specifically to avoid highlighting headers
    const context =
      tableRef.current.querySelector(".ant-table-tbody") || tableRef.current

    const instance = new Mark(context as HTMLElement)
    instance.unmark({
      done: () => {
        if (highlightedQuery && filteredData && filteredData.length > 0) {
          instance.mark(highlightedQuery)
        }
      },
    })

    return () => instance.unmark()
  }, [filteredData, highlightedQuery])

  const renderSearch = () => {
    if (!search) return null
    return (
      <Input
        value={query}
        onChange={(e) => {
          const val = e.target.value
          setQuery(val)
          search.onSearch?.(val)
        }}
        placeholder={search?.placeholder || "Search"}
        prefix={<AiOutlineSearch className="size-5! text-[#D0D0D2]" />}
        suffix={
          <MdCancel
            className={`text-border-active transition-all duration-200 ${query.length > 0 ? "cursor-pointer opacity-100" : "pointer-events-none opacity-0"}`}
            onClick={() => {
              if (query.length > 0) {
                setQuery("")
                search.onSearch?.("")
              }
            }}
          />
        }
        className="w-fit! rounded-lg! placeholder:text-sm! placeholder:tracking-tight! placeholder:text-[#D0D0D2]!"
      />
    )
  }

  return (
    <div className={Utils.cn("card overflow-hidden", cardClassName)}>
      {((left && left.length > 0) ||
        (right && right.length > 0) ||
        search ||
        filter ||
        exportTable ||
        menu) && (
        <div
          className={Utils.cn(
            "flex flex-wrap items-center justify-between gap-x-2.5 gap-y-3 px-6 py-4",
            headerClassName
          )}
        >
          <div
            className={Utils.cn(
              "flex flex-wrap gap-x-2.5 gap-y-3",
              leftClassName
            )}
          >
            {left &&
              left.length > 0 &&
              left.map((element, index) => (
                <Fragment key={index}>{element}</Fragment>
              ))}
            {search && search.position !== "right" && renderSearch()}
          </div>
          <div
            className={Utils.cn(
              "flex flex-wrap items-center gap-2.5",
              rightClassName
            )}
          >
            {search && search.position === "right" && renderSearch()}

            {exportTable && (
              <DataTableActions
                items={[
                  {
                    label: "Export as Excel",
                    icon: <FaFileExcel className="size-4.5 text-[#30BEB7]" />,
                    onClick: handleExportExcel,
                  },
                  {
                    label: "Export as PDF",
                    icon: <FaFilePdf className="size-4.5 text-[#EA580C]" />,
                    onClick: handleExportPdf,
                  },
                ]}
              >
                <Button
                  type="primary"
                  icon={<ExportIcon className="size-4.5! shrink-0!" />}
                  className="h-11! rounded-lg! bg-[#30BEB7]! leading-none! tracking-tight text-white! shadow-none!"
                >
                  Export
                </Button>
              </DataTableActions>
            )}
            {menu && (
              <Button
                icon={<HiOutlineEllipsisVertical size={22} />}
                className="bg-primary-light! text-primary! size-11! rounded-lg! border-none! leading-none!"
              />
            )}
            {filter && (
              <TableFilter
                fields={filter.fields}
                value={filter.value}
                onChange={filter.onChange}
                loading={filter.loading}
              />
            )}
            {right &&
              right.length > 0 &&
              right.map((element, index) => (
                <Fragment key={index}>{element}</Fragment>
              ))}
          </div>
        </div>
      )}

      <div ref={tableRef}>
        <Table
          rowKey="id"
          dataSource={filteredData as any}
          columns={columns as any}
          {...rest}
          tableLayout="auto"
          pagination={
            rest.pagination === false
              ? false
              : {
                  ...rest.pagination,
                  current: Number(searchParam.get("page")) || 1,
                  onChange: (page) => {
                    setSearchParams({
                      page: page.toString(),
                    })
                  },
                  showTotal: (total, range) =>
                    `Showing ${range[0]}-${range[1]?.toLocaleString()} of ${total?.toLocaleString()} ${name?.toLowerCase() || "records"}`,
                }
          }
          locale={{
            emptyText: (
              <Empty
                description={`No ${name?.toLowerCase() || "data"}`}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          className={Utils.cn("overflow-auto!", rest.className)}
        />
      </div>
    </div>
  )
}

export default DataTable
export { DataTable }
