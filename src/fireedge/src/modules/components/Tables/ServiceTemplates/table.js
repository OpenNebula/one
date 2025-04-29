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
import { Alert } from '@mui/material'
import { Translate } from '@modules/components/HOC'
import MultipleTags from '@modules/components/MultipleTags'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import ServiceTemplateColumns from '@modules/components/Tables/ServiceTemplates/columns'
import ServiceTemplateRow from '@modules/components/Tables/ServiceTemplates/row'
import Timer from '@modules/components/Timer'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { useAuth, useViews, ServiceTemplateAPI } from '@FeaturesModule'
import { getColorFromString, timeFromMilliseconds } from '@ModelsModule'
import { ReactElement, useMemo } from 'react'
import { getResourceLabels } from '@UtilsModule'

const DEFAULT_DATA_CY = 'service-templates'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Service Templates table
 */
const ServiceTemplatesTable = (props) => {
  const { labels = {} } = useAuth()
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const {
    data = [],
    isFetching,
    refetch,
    error,
  } = ServiceTemplateAPI.useGetServiceTemplatesQuery()

  const fmtData = useMemo(
    () =>
      data?.map((row) => ({
        ...row,
        TEMPLATE: {
          ...(row?.TEMPLATE ?? {}),
          LABELS: getResourceLabels(
            labels,
            row?.ID,
            RESOURCE_NAMES.VM_TEMPLATE,
            true
          ),
        },
      })),
    [data, labels]
  )

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.SERVICE_TEMPLATE)?.filters,
        columns: ServiceTemplateColumns,
      }),
    [view]
  )

  const listHeader = [
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Owner, id: 'owner', accessor: 'UNAME' },
    { header: T.Group, id: 'group', accessor: 'GNAME' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    {
      header: T.StartTime,
      id: 'start-time',
      accessor: ({
        TEMPLATE: { BODY: { registration_time: regTime } = {} },
      }) => {
        const time = useMemo(() => timeFromMilliseconds(+regTime), [regTime])

        return <Timer translateWord={T.RegisteredAt} initial={time} />
      },
    },
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
  const { component, header } = WrapperRow(ServiceTemplateRow)

  return (
    <EnhancedTable
      columns={columns}
      data={fmtData}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      noDataMessage={
        error?.status === 500 && (
          <Alert severity="error" variant="outlined">
            <Translate word={T.CannotConnectOneFlow} />
          </Alert>
        )
      }
      RowComponent={component}
      headerList={header && listHeader}
      resourceType={RESOURCE_NAMES.SERVICE_TEMPLATE}
      {...rest}
    />
  )
}

ServiceTemplatesTable.propTypes = { ...EnhancedTable.propTypes }
ServiceTemplatesTable.displayName = 'ServiceTemplatesTable'

export default ServiceTemplatesTable
