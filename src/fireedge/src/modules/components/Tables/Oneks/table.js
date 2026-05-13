/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { OneKsAPI, useViews, SystemAPI } from '@FeaturesModule'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import OneKsColumns from '@modules/components/Tables/Oneks/columns'
import OneKsRow from '@modules/components/Tables/Oneks/row'
import { timeFromMilliseconds } from '@ModelsModule'
import Timer from '@modules/components/Timer'
import { generateDocLink } from '@UtilsModule'
import { Alert, Typography } from '@mui/material'
import { Translate, Tr } from '@modules/components/HOC'

const DEFAULT_DATA_CY = 'oneks'

/**
 * @param {object} props - Props
 * @returns {ReactElement} OneKS table
 */
const OneKSTable = (props) => {
  const {
    rootProps = {},
    searchProps = {},
    useQuery = OneKsAPI.useGetOneKsClustersQuery,
    datastoreId,
    vdcClusters,
    zoneId,
    ...rest
  } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  // Get version to show links to documentation
  const { data: version } = SystemAPI.useGetOneVersionQuery()

  const { view, getResourceView } = useViews()
  const {
    data = [],
    isFetching,
    refetch,
    error,
  } = useQuery(
    { zone: zoneId },
    {
      selectFromResult: (result) => ({
        ...result,
        data: result?.data?.map((cluster) => ({
          ...cluster.DOCUMENT,
        })),
      }),
    }
  )

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.ONEKS)?.filters,
        columns: OneKsColumns,
      }),
    [view]
  )

  const listHeader = [
    { header: T.ID, accessor: 'ID', sortType: 'number' },
    { header: T.Name, accessor: 'NAME' },
    {
      header: T.State,
      id: 'STATE',
      accessor: (row) => row?.TEMPLATE?.CLUSTER_BODY?.state ?? '',
    },
    {
      header: T.Version,
      id: 'VERSION',
      accessor: (row) => row?.TEMPLATE?.CLUSTER_BODY?.kubernetes_version ?? '',
    },
    {
      header: T.Created,
      id: 'CREATED',
      accessor: (row) => {
        const CreatedTime = row?.TEMPLATE?.CLUSTER_BODY?.registration_time ?? ''
        if (!CreatedTime) {
          return ''
        }
        const fromMill = timeFromMilliseconds(+CreatedTime)

        return <Timer initial={fromMill} />
      },
    },
  ]

  const { component, header } = WrapperRow(OneKsRow)

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      noDataMessage={
        error?.status === 500 && (
          <Alert severity="error" variant="outlined">
            <Translate word={T.CannotConnectOneKS} />
            <Typography variant="body2" gutterBottom>
              {Tr(T['oneks.info.more'])}
              <a
                target="_blank"
                href={generateDocLink(version, '')}
                rel="noreferrer"
              >
                {Tr(T['oneks.info.more.link'])}
              </a>
            </Typography>
          </Alert>
        )
      }
      RowComponent={component}
      headerList={header && listHeader}
      resourceType={RESOURCE_NAMES.ONEKS}
      {...rest}
    />
  )
}

OneKSTable.propTypes = { ...EnhancedTable.propTypes }
OneKSTable.displayName = 'OneKSTable'

export default OneKSTable
