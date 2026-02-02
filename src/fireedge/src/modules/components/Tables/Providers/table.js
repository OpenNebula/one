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
import { ReactElement, useEffect, useMemo } from 'react'
import { Alert, Typography } from '@mui/material'
import { Translate, Tr } from '@modules/components/HOC'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import ProviderColumns from '@modules/components/Tables/Providers/columns'
import ProviderRow from '@modules/components/Tables/Providers/row'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { timeFromMilliseconds } from '@ModelsModule'
import { useViews, ProviderAPI, SystemAPI } from '@FeaturesModule'
import { generateDocLink } from '@UtilsModule'
import Timer from '@modules/components/Timer'

const DEFAULT_DATA_CY = 'providers'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Providers table
 */
const ProvidersTable = (props) => {
  const {
    rootProps = {},
    searchProps = {},
    handleRefetch,
    ...rest
  } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const {
    data: providers = [],
    isFetching,
    refetch,
    error,
  } = ProviderAPI.useGetProvidersQuery()

  // Filter data if there is filter function
  const data =
    props?.filterData && typeof props?.filterData === 'function'
      ? props?.filterData(providers)
      : providers

  // Get version to show links to documentation
  const { data: version } = SystemAPI.useGetOneVersionQuery()

  useEffect(() => {
    if (handleRefetch && refetch) {
      handleRefetch(refetch)
    }
  }, [handleRefetch, refetch])

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.PROVIDER)?.filters,
        columns: ProviderColumns,
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
        TEMPLATE: { PROVIDER_BODY: { registration_time: regTime } = {} },
      }) => {
        const time = useMemo(() => timeFromMilliseconds(+regTime), [regTime])

        return <Timer translateWord={T.RegisteredAt} initial={time} />
      },
    },
  ]

  const { component, header } = WrapperRow(ProviderRow)

  return (
    <EnhancedTable
      columns={columns}
      data={data}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      noDataMessage={
        error?.status === 500 && (
          <Alert severity="error" variant="outlined">
            <Translate word={T.CannotConnectOneForm} />
            <Typography variant="body2" gutterBottom>
              {Tr(T['oneform.info.more'])}
              <a
                target="_blank"
                href={generateDocLink(
                  version,
                  'product/operation_references/opennebula_services_configuration/oneform/'
                )}
                rel="noreferrer"
              >
                {Tr(T['oneform.info.more.link'])}
              </a>
            </Typography>
          </Alert>
        )
      }
      RowComponent={component}
      headerList={header && listHeader}
      resourceType={RESOURCE_NAMES.PROVIDER}
      {...rest}
    />
  )
}

ProvidersTable.propTypes = { ...EnhancedTable.propTypes }
ProvidersTable.displayName = 'ProvidersTable'

export default ProvidersTable
