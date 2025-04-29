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
import { ReactElement, useMemo } from 'react'
import MultipleTags from '@modules/components/MultipleTags'

import { getColorFromString } from '@ModelsModule'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import VrColumns from '@modules/components/Tables/Vrs/columns'
import VrRow from '@modules/components/Tables/Vrs/row'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { useViews, VrAPI, useAuth } from '@FeaturesModule'
import { getResourceLabels } from '@UtilsModule'

const DEFAULT_DATA_CY = 'vrouters'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Virtual Routers table
 */
const VrsTable = (props) => {
  const { labels = {} } = useAuth()
  const {
    rootProps = {},
    searchProps = {},
    useQuery = VrAPI.useGetVrsQuery,
    ...rest
  } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const { data = [], isFetching, refetch } = useQuery()

  const fmtData = useMemo(
    () =>
      data?.map((row) => ({
        ...row,
        TEMPLATE: {
          ...(row?.TEMPLATE ?? {}),
          LABELS: getResourceLabels(
            labels,
            row?.ID,
            RESOURCE_NAMES.VROUTER,
            true
          ),
        },
      })),
    [data, labels]
  )

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.VROUTER)?.filters,
        columns: VrColumns,
      }),
    [view]
  )

  const listHeader = [
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    { header: T.Owner, id: 'owner', accessor: 'UNAME' },
    { header: T.Group, id: 'group', accessor: 'GNAME' },
    {
      header: T.Labels,
      id: 'labels',
      accessor: ({ TEMPLATE: { LABELS = [] } }) => {
        const fmtLabels = LABELS?.map((label) => ({
          text: label,
          dataCy: `label-${label}`,
          stateColor: getColorFromString(label),
        }))

        return <MultipleTags tags={fmtLabels} truncateText={10} />
      },
    },
  ]

  const { component, header } = WrapperRow(VrRow)

  return (
    <EnhancedTable
      columns={columns}
      data={fmtData}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      RowComponent={component}
      headerList={header && listHeader}
      resourceType={RESOURCE_NAMES.VROUTER}
      {...rest}
    />
  )
}

VrsTable.propTypes = { ...EnhancedTable.propTypes }
VrsTable.displayName = 'VrsTable'

export default VrsTable
