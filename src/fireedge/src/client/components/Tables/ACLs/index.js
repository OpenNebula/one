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
import { useMemo, Component, useState } from 'react'
import { useViews } from 'client/features/Auth'
import { useGetAclsExtendedQuery } from 'client/features/OneApi/acl'

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import ACLColumns from 'client/components/Tables/ACLs/columns'
import ACLRow from 'client/components/Tables/ACLs/row'
import { RESOURCE_NAMES, ACL_TABLE_VIEWS } from 'client/constants'

const DEFAULT_DATA_CY = 'acls'

/**
 * `ACLsTable` component displays a table of ACLs.
 *
 * @param {object} props - Component properties.
 * @param {object} [props.rootProps={}] - Root properties for the table.
 * @param {object} [props.searchProps={}] - Search properties for the table.
 * @param {Array} props.vdcGroups - Array of VDC groups.
 * @param {Array<string|number>} [props.secondaryGroups=[]] - Array of IDs of the secondary groups.
 * @param {object} props.rest - Rest of the properties.
 * @returns {Component} Rendered component.
 */
const ACLsTable = (props) => {
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

  // Get data
  const { data = [], isFetching, refetch } = useGetAclsExtendedQuery()

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.ACL)?.filters,
        columns: ACLColumns,
      }),
    [view]
  )

  // Variable to store the type of table
  const [viewType, setViewType] = useState(ACL_TABLE_VIEWS.ICONS.type)

  // Define the type of views
  const tableViews = {
    views: ACL_TABLE_VIEWS,
    onClick: (name) => {
      setViewType(name)
    },
  }

  return (
    data && (
      <EnhancedTable
        columns={columns}
        data={data}
        rootProps={rootProps}
        searchProps={searchProps}
        refetch={refetch}
        isLoading={isFetching}
        getRowId={(row) => String(row.ID)}
        RowComponent={useMemo(() => ACLRow(viewType), [viewType])}
        singleSelect={singleSelect}
        tableViews={tableViews}
        {...rest}
      />
    )
  )
}

export default ACLsTable
