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

import { useMemo, ReactElement } from 'react'

import { useViews } from 'client/features/Auth'
import { useGetVNTemplatesQuery } from 'client/features/OneApi/networkTemplate'

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import VNetworkTemplateColumns from 'client/components/Tables/VNetworkTemplates/columns'
import VNetworkTemplateRow from 'client/components/Tables/VNetworkTemplates/row'
import { RESOURCE_NAMES } from 'client/constants'

const DEFAULT_DATA_CY = 'vnet-templates'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Virtual Network Templates table
 */
const VNetworkTemplatesTable = (props) => {
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const { data = [], isFetching, refetch } = useGetVNTemplatesQuery()

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.VN_TEMPLATE)?.filters,
        columns: VNetworkTemplateColumns,
      }),
    [view]
  )

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      RowComponent={VNetworkTemplateRow}
      {...rest}
    />
  )
}

VNetworkTemplatesTable.propTypes = { ...EnhancedTable.propTypes }
VNetworkTemplatesTable.displayName = 'VNetworkTemplatesTable'

export default VNetworkTemplatesTable
