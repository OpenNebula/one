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
import { ReactElement, useMemo } from 'react'

import { useViews, ZoneAPI } from '@FeaturesModule'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import ZoneColumns from '@modules/components/Tables/Zones/columns'
import ZoneRow from '@modules/components/Tables/Zones/row'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { MuiProvider, SunstoneTheme } from '@ProvidersModule'

const DEFAULT_DATA_CY = 'zones'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Zones table
 */
const ZonesTable = (props) => {
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const { data = [], isFetching, refetch } = ZoneAPI.useGetZonesQuery()

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.ZONE)?.filters,
        columns: ZoneColumns,
      }),
    [view]
  )

  const listHeader = [
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    { header: T.Endpoint, id: 'endpoint', accessor: 'TEMPLATE.ENDPOINT' },
  ]
  const { component, header } = WrapperRow(ZoneRow)

  return (
    <MuiProvider theme={SunstoneTheme}>
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
        {...rest}
      />
    </MuiProvider>
  )
}

ZonesTable.propTypes = { ...EnhancedTable.propTypes }
ZonesTable.displayName = 'ZonesTable'

export default ZonesTable
