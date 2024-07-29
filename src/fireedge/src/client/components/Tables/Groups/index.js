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
import { useMemo, Component } from 'react'
import { useViews } from 'client/features/Auth'
import { useGetGroupsQuery } from 'client/features/OneApi/group'
import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import GroupColumns from 'client/components/Tables/Groups/columns'
import GroupRow from 'client/components/Tables/Groups/row'
import { RESOURCE_NAMES } from 'client/constants'

const DEFAULT_DATA_CY = 'groups'

/**
 * `GroupsTable` component displays a table of groups with their respective primary and secondary labels.
 *
 * @param {object} props - Component properties.
 * @param {object} [props.rootProps={}] - Root properties for the table.
 * @param {object} [props.searchProps={}] - Search properties for the table.
 * @param {Array} props.vdcGroups - Array of VDC groups.
 * @param {Array<string|number>} [props.secondaryGroups=[]] - Array of IDs of the secondary groups.
 * @param {object} props.rest - Rest of the properties.
 * @returns {Component} Rendered component.
 */
const GroupsTable = (props) => {
  const {
    rootProps = {},
    searchProps = {},
    vdcGroups,
    singleSelect = false,
    ...rest
  } = props ?? {}

  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const { data = [], isFetching, refetch } = useGetGroupsQuery()

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.GROUP)?.filters,
        columns: GroupColumns,
      }),
    [view]
  )

  return (
    <EnhancedTable
      columns={columns}
      data={data}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      RowComponent={GroupRow}
      singleSelect={singleSelect}
      {...rest}
    />
  )
}

export default GroupsTable
