/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { useViews, VmGroupAPI } from '@FeaturesModule'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import { ReactElement, useEffect, useMemo } from 'react'

import { RESOURCE_NAMES, T } from '@ConstantsModule'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import VmGroupColumns from '@modules/components/Tables/VmGroups/columns'
import VmGroupRow from '@modules/components/Tables/VmGroups/row'

const DEFAULT_DATA_CY = 'vmgroups'

/**
 * @param {object} props - Props
 * @returns {ReactElement} VmGroups table
 */
const VmGroupsTable = (props) => {
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const { data = [], isFetching, refetch } = VmGroupAPI.useGetVMGroupsQuery()

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.VM_GROUP)?.filters,
        columns: VmGroupColumns,
      }),
    [view]
  )

  useEffect(() => refetch(), [])

  const listHeader = [
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    { header: T.Owner, id: 'owner', accessor: 'UNAME' },
    { header: T.Group, id: 'group', accessor: 'GNAME' },
  ]

  const { component, header } = WrapperRow(VmGroupRow)

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      RowComponent={component}
      headerList={header && listHeader}
      resourceType={RESOURCE_NAMES.VM_GROUP}
      {...rest}
    />
  )
}

VmGroupsTable.propTypes = { ...EnhancedTable.propTypes }
VmGroupsTable.displayName = 'VmGroupsTable'

export default VmGroupsTable
