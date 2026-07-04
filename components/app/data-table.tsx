"use client";

import * as React from "react";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortDir = "asc" | "desc";
export type SortState = { column: string; dir: SortDir };

export type Column<T> = {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  /** When set, the header becomes a sort control keyed by this id. */
  sortId?: string;
  headerClassName?: string;
  cellClassName?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  sort?: SortState | null;
  onSortChange?: (next: SortState) => void;
  activeRowId?: string | null;
  emptyLabel?: string;
  className?: string;
};

const alignClass = (align: Column<unknown>["align"]) =>
  align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  sort,
  onSortChange,
  activeRowId,
  emptyLabel = "No rows",
  className,
}: DataTableProps<T>) {
  const handleSort = (sortId: string) => {
    if (!onSortChange) return;
    const dir: SortDir = sort?.column === sortId && sort.dir === "asc" ? "desc" : "asc";
    onSortChange({ column: sortId, dir });
  };

  return (
    <div className={cn("relative overflow-auto rounded-lg border bg-card", className)}>
      <table className="w-full caption-bottom text-sm">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b">
            {columns.map((col) => {
              const isSorted = col.sortId && sort?.column === col.sortId;
              return (
                <th
                  key={col.id}
                  className={cn(
                    "h-10 whitespace-nowrap px-3 align-middle text-xs font-medium text-muted-foreground",
                    alignClass(col.align),
                    col.headerClassName,
                  )}
                >
                  {col.sortId ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.sortId!)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-sm transition-colors hover:text-foreground",
                        col.align === "right" && "flex-row-reverse",
                        isSorted && "text-foreground",
                      )}
                    >
                      {col.header}
                      {isSorted ? (
                        sort?.dir === "asc" ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3.5 opacity-50" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-10 text-center text-sm text-muted-foreground"
              >
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const id = getRowId(row);
              const clickable = Boolean(onRowClick);
              return (
                <tr
                  key={id}
                  data-state={activeRowId === id ? "selected" : undefined}
                  onClick={clickable ? () => onRowClick?.(row) : undefined}
                  onKeyDown={
                    clickable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick?.(row);
                          }
                        }
                      : undefined
                  }
                  tabIndex={clickable ? 0 : undefined}
                  role={clickable ? "button" : undefined}
                  className={cn(
                    "border-b transition-colors last:border-0",
                    "data-[state=selected]:bg-muted/60",
                    clickable &&
                      "cursor-pointer hover:bg-muted/40 focus:bg-muted/40 focus:outline-none",
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        "px-3 py-2.5 align-middle",
                        alignClass(col.align),
                        col.align === "right" && "tabular-nums",
                        col.cellClassName,
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
