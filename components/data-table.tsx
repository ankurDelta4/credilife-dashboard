"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export interface Column {
  key: string
  label: string
  width?: string
}

export interface DataTableProps<T = Record<string, unknown>> {
  columns: Column[]
  data: T[]
  onRowClick?: (item: T) => void
}

export function DataTable<T = Record<string, unknown>>({ columns, data, onRowClick }: DataTableProps<T>) {
  const formatCellValue = (value: unknown, key: string) => {
    if (key === "status") {
      const statusColors = {
        active: "bg-green-100 text-green-800",
        pending: "bg-yellow-100 text-yellow-800",
        overdue: "bg-red-100 text-red-800",
        approved: "bg-blue-100 text-blue-800",
        rejected: "bg-red-100 text-red-800",
        completed: "bg-green-100 text-green-800",
        inactive: "bg-gray-100 text-gray-800",
        suspended: "bg-red-100 text-red-800",
      }
      return (
        <Badge className={statusColors[value as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
          {String(value)}
        </Badge>
      )
    }

    if (key === "role") {
      const roleColors = {
        admin: "bg-purple-100 text-purple-800",
        manager: "bg-blue-100 text-blue-800",
        agent: "bg-green-100 text-green-800",
        viewer: "bg-gray-100 text-gray-800",
      }
      return (
        <Badge className={roleColors[value as keyof typeof roleColors] || "bg-gray-100 text-gray-800"}>
          {String(value)}
        </Badge>
      )
    }

    if ((key === "amount" || key === "loanAmount" || key === "monthlyPayment" || key === "remainingBalance") && typeof value === "number") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value)
    }

    if (key === "interestRate" && typeof value === "number") {
      return `${value}`
    }

    if (key === "creditScore" && typeof value === "number") {
      const color = value >= 750 ? "text-green-600" : value >= 650 ? "text-yellow-600" : "text-red-600"
      return <span className={color}>{value}</span>
    }

    if (value instanceof Date) {
      return value.toLocaleDateString('en-US')
    }

    // Handle date strings (like submitDate, createdAt, updatedAt)
    if ((key === "submitDate" || key === "createdAt" || key === "updatedAt" || key === "lastLogin") && typeof value === "string") {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US')
        }
      } catch (error) {
        // If date parsing fails, return the original string
        return String(value)
      }
    }

    if (key === "installments" && typeof value === "number") {
      return `${value} months`
    }

    if (typeof value === "string" && value.includes("@")) {
      return <span className="text-blue-600">{value}</span>
    }

    return String(value)
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} style={{ width: column.width }}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow
                key={(item as { id?: string }).id || index}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {formatCellValue((item as Record<string, unknown>)[column.key], column.key)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}