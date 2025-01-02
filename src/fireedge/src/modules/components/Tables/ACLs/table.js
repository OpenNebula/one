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
import ACLColumns from '@modules/components/Tables/ACLs/columns'
import ACLRow from '@modules/components/Tables/ACLs/row'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import { ACL_TABLE_VIEWS, RESOURCE_NAMES, T } from '@ConstantsModule'
import { useViews, AclAPI } from '@FeaturesModule'
import { sentenceCase } from '@UtilsModule'
import { Component, useMemo, useState } from 'react'

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
  const { data = [], isFetching, refetch } = AclAPI.useGetAclsExtendedQuery()

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

  const listHeader = [
    { header: T.ID, id: 'id', accessor: 'ID' },
    {
      header: T.AppliesTo,
      id: 'applies',
      accessor: ({ USER }) =>
        USER?.type ? sentenceCase(`${USER?.type} ${USER?.name ?? ''}`) : '',
    },
    {
      header: T.AffectedResources,
      id: 'affected-resources',
      accessor: ({ RESOURCE }) =>
        Array.isArray(RESOURCE?.resources)
          ? sentenceCase(RESOURCE.resources.join(', '))
          : '',
    },
    {
      header: T.AllowedOperations,
      id: 'allowed-operations',
      accessor: ({ RIGHTS }) => sentenceCase(RIGHTS?.string || ''),
    },
    {
      header: T.Zone,
      id: 'zone',
      accessor: ({ ZONE }) => ZONE?.name || T.All,
    },
  ]
  const CardStyle = useMemo(() => ACLRow(viewType), [viewType])
  const { component, header } = WrapperRow(CardStyle)

  const EnhancedTableProps = {
    columns,
    data,
    rootProps,
    searchProps,
    refetch,
    isLoading: isFetching,
    getRowId: (row) => String(row.ID),
    singleSelect,
    RowComponent: component,
    headerList: header && listHeader,
    ...rest,
  }
  !header && (EnhancedTableProps.tableViews = tableViews)

  return data && <EnhancedTable {...EnhancedTableProps} />
}

ACLsTable.propTypes = { ...EnhancedTable.propTypes }
ACLsTable.displayName = 'ACLsTable'

export default ACLsTable
