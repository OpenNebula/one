/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { Column } from 'react-table'

import {
  CategoryFilter,
  GlobalAction,
  TimeFilter,
} from 'client/components/Tables/Enhanced/Utils'

/**
 * Add filters defined in view yaml to columns.
 *
 * @param {object} config - Config
 * @param {object} config.filters - List of criteria to filter the columns
 * @param {Column[]} config.columns - Columns
 * @returns {Column[]} Column with filters
 */
export const createColumns = ({ filters = {}, columns = [] }) => {
  if (Object.keys(filters).length === 0) return columns

  return columns.map((column) => {
    const { id = '', accessor } = column

    // noFilterIds is a list of column ids that should not have a filter
    // it's defined in the resource columns definition
    if (columns.noFilterIds?.includes(id)) return column

    const filterById = !!filters[String(id.toLowerCase())]

    const filterByAccessor =
      typeof accessor === 'string' && !!filters[String(accessor.toLowerCase())]

    return {
      ...column,
      ...((filterById || filterByAccessor) &&
        (
          {
            // TODO: Implements time filter component
            time: createTimeFilter,
          }[`${id}`.toLowerCase()] ?? createCategoryFilter
        )(column)),
    }
  })
}

/**
 * Create label filter as column.
 *
 * @param {Column} column - Column
 * @returns {Column} - Label filter
 */
// export const createLabelFilter = (column) => ({
//   disableFilters: false,
//   Filter: LabelFilter,
//   ...column,
// })

/**
 * Create time filter as column.
 *
 * @param {Column} column - Column
 * @returns {Column} - Time filter
 */
export const createTimeFilter = (column) => ({
  disableFilters: false,
  Filter: TimeFilter,
  ...column,
})

/**
 * Create category filter as column.
 *
 * @param {Column} column - Column
 * @returns {Column} - Category filter
 */
export const createCategoryFilter = (column) => ({
  disableFilters: false,
  Filter: CategoryFilter,
  filter: 'includesValue',
  ...column,
})

/**
 * Add filters defined in view yaml to bulk actions.
 *
 * @param {object} params - Config parameters
 * @param {object} params.filters - Which buttons are visible to operate over the resources
 * @param {GlobalAction[]} params.actions - Actions
 * @returns {object} Action with filters
 */
export const createActions = ({ filters = {}, actions = [] }) => {
  if (Object.keys(filters).length === 0) return actions

  return actions
    .filter(
      ({ accessor }) =>
        !accessor || filters[String(accessor.toLowerCase())] === true
    )
    .map((action) => {
      const { accessor, options } = action

      if (accessor) return action

      const groupActions = options?.filter(
        (option) => filters[`${option.accessor?.toLowerCase()}`] === true
      )

      return groupActions?.length > 0
        ? { ...action, options: groupActions }
        : undefined
    })
    .filter(Boolean)
}
