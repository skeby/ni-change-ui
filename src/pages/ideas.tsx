import React from "react";
import { Tooltip, type TableProps } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { DataTable } from "../components/ui/data-table";
import { useAppSelector } from "../state/store";
import { type AIIdea } from "../state/slices/ai-ideas-slice";

dayjs.extend(relativeTime);

export const Ideas: React.FC = () => {
  const { ideas } = useAppSelector((state) => state.aiIdeas);

  const columns: TableProps<AIIdea>["columns"] = [
    {
      key: "title",
      dataIndex: "title",
      title: "Idea",
      width: 220,
      render: (title: string) => (
        <Tooltip title={title}>
          <span className="text-primary-alpha block max-w-[200px] truncate font-bold">
            {title}
          </span>
        </Tooltip>
      ),
    },
    {
      key: "description",
      dataIndex: "description",
      title: "Description",
      width: 320,
      render: (description: string) =>
        description ? (
          <Tooltip title={description}>
            <span className="text-fade block max-w-[280px] truncate font-medium">
              {description}
            </span>
          </Tooltip>
        ) : (
          <span className="text-fade font-medium">—</span>
        ),
    },
    {
      key: "submitter",
      dataIndex: "submitterName",
      title: "Submitted by",
      width: 220,
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="text-primary-alpha font-bold">
            {record.submitterName}
          </span>
          <span className="text-fade-2 text-body-xs">
            {record.submitterDepartment}
          </span>
        </div>
      ),
    },
    {
      key: "submittedAt",
      dataIndex: "createdAt",
      title: "Submitted",
      width: 140,
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: "descend",
      render: (date: string) => (
        <span className="text-fade text-xs font-medium whitespace-nowrap">
          {dayjs(date).fromNow()}
        </span>
      ),
    },
    {
      key: "createdAt",
      dataIndex: "createdAt",
      title: "Date",
      width: 140,
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: "descend",
      render: (date: string) => (
        <span className="text-fade text-xs font-medium whitespace-nowrap">
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        name="ai-ideas"
        columns={columns}
        dataSource={ideas}
        rowKey="id"
        pagination={false}
        search={{ placeholder: "Search ideas...", position: "left" }}
      />
    </div>
  );
};

export default Ideas;
