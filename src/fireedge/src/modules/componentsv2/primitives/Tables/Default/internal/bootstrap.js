/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */

import { useEffect, useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table'
import { CopyColumn } from '@modules/componentsv2/primitives/Tables/Default/internal'
import { useControllableState } from '@HooksModule'

/**
 * Flattens any value into a single
 * space-separated string for searching.
 *
 * @param {any} value - Value to normalize
 * @returns {string} Searchable string
 */
const normalizeValue = (value) => {
  if (value == null) return ''
  if (typeof value !== 'object') return String(value)

  return [].concat(Object.values(value)).map(normalizeValue).join(' ')
}

/**
 * Default global filter: normalizes any cell value to a searchable string
 * and does a case-insensitive substring match.
 *
 * @param {object} row - Table row
 * @param {string} columnId - Column id
 * @param {string} filterValue - Search expression
 * @returns {boolean} Whether the row matches
 */
const globalFilterFn = (row, columnId, filterValue) => {
  const search = String(filterValue ?? '')
    .trim()
    .toLowerCase()
  if (!search) return true

  return normalizeValue(row.getValue(columnId)).toLowerCase().includes(search)
}

/**
 * @param {object} options - React/Tanstack table configuration options.
 * @returns {object} - Bootstrapped table props
 */
export const initTable = (options) => {
  const {
    data,
    columns,
    isCopyColumn,
    enableRowSelection,
    enableMultiRowSelection,
    rowSelection: rowSelectionProp,
    onRowSelectionChange: onRowSelectionChangeProp,
    globalFilter,
    onGlobalFilterChange,
    sorting,
    onSortingChange,
    defaultPageSize = 10,
    ...rest
  } = options

  const [rowSelection, setRowSelection] = useControllableState({
    value: rowSelectionProp,
    defaultValue: {},
    onChange: onRowSelectionChangeProp,
  })

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })

  const fallbackPageSize = Number(defaultPageSize) || 10
  const pageSize = Math.max(1, Number(pagination.pageSize) || fallbackPageSize)
  const pageCount = Math.max(1, Math.ceil((data?.length ?? 0) / pageSize))
  const pageIndex = Math.min(
    Math.max(Number(pagination.pageIndex) || 0, 0),
    pageCount - 1
  )
  const safePagination = useMemo(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize]
  )

  useEffect(() => {
    if (
      pagination.pageIndex === safePagination.pageIndex &&
      pagination.pageSize === safePagination.pageSize
    ) {
      return
    }

    setPagination(safePagination)
  }, [pagination.pageIndex, pagination.pageSize, safePagination])

  const mColumns = useMemo(
    () => (isCopyColumn ? [CopyColumn()] : []).concat(columns),
    [isCopyColumn, columns]
  )

  const table = useReactTable({
    data,
    columns: mColumns,
    state: { rowSelection, pagination: safePagination, globalFilter, sorting },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onGlobalFilterChange,
    onSortingChange,
    globalFilterFn,
    enableRowSelection,
    enableMultiRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    ...rest,
  })

  return { table }
}
