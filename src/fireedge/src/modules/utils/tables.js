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
import { T } from '@ConstantsModule'

const getColumnId = ({ id, accessorKey } = {}) => id ?? accessorKey

const getColumnValue = (row, { accessorFn, accessorKey } = {}) =>
  accessorFn?.(row) ??
  accessorKey?.split('.').reduce((value, key) => value?.[key], row)

const normalizeKey = (value) =>
  String(value ?? '')
    .replace(/[-_.\s]/g, '')
    .toLowerCase()

const FILTER_ALIASES = {
  group: ['gname'],
  label: ['labels', 'templatelabels'],
  locked: ['lock'],
  owner: ['uname'],
  zone: ['zoneid'],
}

const getColumnFilterKeys = ({ id, accessorKey } = {}) => {
  const accessorParts = accessorKey?.split('.') ?? []
  const keys = [id, accessorKey, accessorParts[accessorParts.length - 1]]
    .filter(Boolean)
    .map(normalizeKey)

  Object.entries(FILTER_ALIASES).forEach(([filterKey, aliases]) => {
    if (aliases.some((alias) => keys.includes(normalizeKey(alias)))) {
      keys.push(normalizeKey(filterKey))
    }
  })

  return [...new Set(keys)]
}

const isFilterEnabled = (column, filters = {}) => {
  if (filters === true) return true

  const activeFilters = Object.entries(filters ?? {})
    .filter(([, enabled]) => enabled === true)
    .map(([key]) => normalizeKey(key))

  return getColumnFilterKeys(column).some((key) => activeFilters.includes(key))
}

const normalizeSortValue = (value) => {
  if (value == null) return ''
  if (typeof value !== 'object') return value
  if (value instanceof Date) return value.getTime()
  if (Array.isArray(value)) return value.map(normalizeSortValue).join(' ')

  return Object.values(value).map(normalizeSortValue).join(' ')
}

const isNumeric = (value) =>
  value !== '' && value !== null && value !== undefined && !Number.isNaN(+value)

const compareValues = (a, b, sortType) => {
  const valueA = normalizeSortValue(a)
  const valueB = normalizeSortValue(b)

  if (sortType === 'number' || (isNumeric(valueA) && isNumeric(valueB))) {
    return (+valueA || 0) - (+valueB || 0)
  }

  return String(valueA).localeCompare(String(valueB), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

const normalizeFilterValues = (value) => {
  if (value === undefined || value === null || value === '') return []
  if (Array.isArray(value)) return value.flatMap(normalizeFilterValues)
  if (typeof value === 'object') return [JSON.stringify(value)]

  return [value]
}

const getFilterOptionText = (value) => {
  if (typeof value === 'boolean') return value ? T.Yes : T.No

  return String(value)
}

/**
 * @param {object|string|number} option - Filter option
 * @returns {string|number} Option value
 */
export const getOptionValue = (option) =>
  typeof option === 'object' ? option?.value ?? option?.text : option

/**
 * @param {object|string|number} option - Filter option
 * @returns {string|number} Option text
 */
export const getOptionText = (option) =>
  typeof option === 'object' ? option?.text : option

/**
 * @param {object} values - Filter values
 * @returns {object} Values without empty entries
 */
export const cleanFilterValues = (values = {}) =>
  typeof values === 'object' && !Array.isArray(values)
    ? Object.fromEntries(
        Object.entries(values).filter(
          ([, value]) => value !== undefined && value !== null && value !== ''
        )
      )
    : {}

/**
 * @param {object} values - Filter values
 * @param {string} id - Filter identifier
 * @returns {string|number|undefined} Filter value
 */
export const getFilterValue = (values, id) =>
  typeof values === 'object' && !Array.isArray(values)
    ? values?.[id]
    : undefined

/**
 * @param {object} filter - Filter definition
 * @returns {object} Empty all option
 */
export const getAllFilterOption = (filter) => ({
  text: filter.allText ?? `${T.All} ${filter.label}`,
  value: '',
})

/**
 * @param {Array} filters - Filter definitions
 * @param {object} values - Applied values
 * @returns {Array} Active filter labels
 */
export const getActiveFilters = (filters = [], values = {}) => {
  const filterValues =
    typeof values === 'object' && !Array.isArray(values) ? values : {}

  return filters
    .map((filter) => {
      const value = filterValues?.[filter.id]
      if (value === undefined || value === null || value === '') return null

      const option = filter.options?.find(
        (filterOption) => String(getOptionValue(filterOption)) === String(value)
      )

      return {
        id: filter.id,
        label: `${filter.label}: ${getOptionText(option) ?? value}`,
      }
    })
    .filter(Boolean)
}

const getSortValue = (sortExpression) =>
  Array.isArray(sortExpression)
    ? sortExpression?.[0]?.id
    : typeof sortExpression === 'object'
    ? sortExpression?.value
    : sortExpression

const getSortDesc = (sortExpression) =>
  Array.isArray(sortExpression)
    ? !!sortExpression?.[0]?.desc
    : typeof sortExpression === 'object'
    ? !!sortExpression?.desc
    : false

const getSortColumn = (columns, value) =>
  columns?.find((column) => {
    const columnId = getColumnId(column)

    return (
      value != null &&
      (String(columnId) === String(value) ||
        String(column?.accessorKey) === String(value))
    )
  })

/**
 * @param {Array} columns - List of table column definitions
 * @returns {Array} - Sort options
 */
export const getTableSortOptions = (columns = []) =>
  columns
    .filter(
      (column) =>
        column?.enableSorting !== false &&
        column?.header &&
        (column?.accessorKey || column?.accessorFn)
    )
    .map((column) => ({
      text: column.header,
      value: getColumnId(column),
    }))

/**
 * @param {Array} data - Rows to sort
 * @param {object} sortExpression - Sort expression
 * @param {Array} columns - Column definitions
 * @returns {Array} - Sorted rows
 */
export const sortTableData = (data = [], sortExpression, columns = []) => {
  const rows = data ?? []
  const sortValue = getSortValue(sortExpression)
  const sortColumn = getSortColumn(columns, sortValue)

  if (!sortColumn) return rows

  const sortDesc = getSortDesc(sortExpression)

  return [...rows].sort((rowA, rowB) => {
    const result = compareValues(
      getColumnValue(rowA, sortColumn),
      getColumnValue(rowB, sortColumn),
      sortColumn?.sortType
    )

    return sortDesc ? -result : result
  })
}

/**
 * @param {Array} data - Rows to build filter options from
 * @param {object|boolean} filters - Filters enabled in the resource view, or true for all columns
 * @param {Array} columns - Column definitions
 * @returns {Array} - Filter options
 */
export const getTableFilterOptions = (data = [], filters = {}, columns = []) =>
  columns
    .filter(
      (column) =>
        column?.header &&
        column?.enableColumnFilter !== false &&
        (column?.accessorKey || column?.accessorFn) &&
        isFilterEnabled(column, filters)
    )
    .map((column) => {
      const options = []

      data?.forEach((row) => {
        normalizeFilterValues(getColumnValue(row, column)).forEach((value) => {
          const stringValue = String(value)

          if (!options.some((option) => String(option.value) === stringValue)) {
            options.push({ text: getFilterOptionText(value), value })
          }
        })
      })

      return {
        id: getColumnId(column),
        label: column.header,
        options: options.sort((optionA, optionB) =>
          String(optionA.text).localeCompare(String(optionB.text), undefined, {
            numeric: true,
            sensitivity: 'base',
          })
        ),
        getValue: (row) => getColumnValue(row, column),
      }
    })

/**
 * @param {Array} data - Rows to filter
 * @param {object} filterExpression - Active filter expression
 * @param {Array} filterOptions - Available filter definitions
 * @returns {Array} - Filtered rows
 */
export const filterTableData = (
  data = [],
  filterExpression = {},
  filterOptions = []
) => {
  const filters =
    typeof filterExpression === 'object' && !Array.isArray(filterExpression)
      ? filterExpression
      : {}

  return filterOptions.reduce((rows, filter) => {
    const value = filters?.[filter.id]
    if (value === undefined || value === null || value === '') return rows

    return rows?.filter((row) =>
      normalizeFilterValues(filter.getValue(row)).some(
        (filterValue) => String(filterValue) === String(value)
      )
    )
  }, data)
}

/**
 * @param {Array} [columns=[]] - List of table column definitions
 * @param {Function} useQuery - RTK data fetching function
 * @param {object} tableOptions - Table descriptor options
 * @param {string} tableOptions.dataCy - Cypress selector prefix
 * @returns {object} - Table descriptor
 */
export const createTable = (columns = [], useQuery, tableOptions = {}) => {
  const { dataCy } = tableOptions

  return {
    dataCy,
    columns: (override) => override ?? columns,
    sortOptions: (override) => getTableSortOptions(override ?? columns),
    sortData: (data, sortExpression, override) =>
      sortTableData(data, sortExpression, override ?? columns),
    filterOptions: (data, filters, override, extraColumns = []) =>
      getTableFilterOptions(data, filters, [
        ...(override ?? columns),
        ...extraColumns,
      ]),
    filterData: filterTableData,
    useData: (args, options) => useQuery(args, options),
  }
}
