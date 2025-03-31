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
import MultipleTags from '@modules/components/MultipleTags'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import VmTemplateColumns from '@modules/components/Tables/VmTemplates/columns'
import VmTemplateRow from '@modules/components/Tables/VmTemplates/row'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { useAuth, useViews, VmTemplateAPI } from '@FeaturesModule'
import {
  getColorFromString,
  getUniqueLabels,
  timeToString,
} from '@ModelsModule'
import { ReactElement, useEffect, useMemo } from 'react'

const DEFAULT_DATA_CY = 'vm-templates'

/**
 * @param {object} props - Props
 * @returns {ReactElement} VM Templates table
 */
const VmTemplatesTable = (props) => {
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const {
    data = [],
    isFetching,
    refetch,
  } = VmTemplateAPI.useGetTemplatesQuery()

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.VM_TEMPLATE)?.filters,
        columns: VmTemplateColumns,
      }),
    [view]
  )
  useEffect(() => refetch(), [])

  const listHeader = [
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    {
      header: T.RegistrationTime,
      id: 'registration-time',
      accessor: (vm) => timeToString(vm.REGTIME),
    },
    { header: T.Owner, id: 'owner', accessor: 'UNAME' },
    { header: T.Group, id: 'group', accessor: 'GNAME' },
    {
      header: T.Labels,
      id: 'labels',
      accessor: ({ TEMPLATE: { LABELS } = {} }) => {
        const { labels: userLabels } = useAuth()
        const labels = useMemo(
          () =>
            getUniqueLabels(LABELS).reduce((acc, label) => {
              if (userLabels?.includes(label)) {
                acc.push({
                  text: label,
                  dataCy: `label-${label}`,
                  stateColor: getColorFromString(label),
                })
              }

              return acc
            }, []),

          [LABELS]
        )

        return <MultipleTags tags={labels} truncateText={10} />
      },
    },
  ]

  const { component, header } = WrapperRow(VmTemplateRow)

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
      {...rest}
    />
  )
}

VmTemplatesTable.propTypes = { ...EnhancedTable.propTypes }
VmTemplatesTable.displayName = 'VmTemplatesTable'

export default VmTemplatesTable
