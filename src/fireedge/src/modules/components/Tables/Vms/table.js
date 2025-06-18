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

import { useAuth, useViews, VmAPI } from '@FeaturesModule'

import {
  RESOURCE_NAMES,
  STATES,
  T,
  VM_EXTENDED_POOL,
  VM_STATES,
  VM_POOL_PAGINATION_SIZE,
} from '@ConstantsModule'
import {
  getColorFromString,
  getIps,
  getLastHistory,
  getVirtualMachineState,
} from '@ModelsModule'
import MultipleTags from '@modules/components/MultipleTags'
import { StatusCircle } from '@modules/components/Status'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import VmColumns from '@modules/components/Tables/Vms/columns'
import VmRow from '@modules/components/Tables/Vms/row'
import RowAction from '@modules/components/Tables/Vms/rowActions'
import { getResourceLabels } from '@UtilsModule'

const DEFAULT_DATA_CY = 'vms'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Virtual Machines table
 */
const VmsTable = (props) => {
  const {
    rootProps = {},
    searchProps = {},
    initialState = {},
    host,
    backupjobs,
    backupjobsState,
    filterData = [],
    filterLoose = true,
    enabledFullScreen = false,
    handleRefetch,
    ...rest
  } = props ?? {}
  const { labels } = useAuth()

  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`
  initialState.filters = useMemo(
    () => initialState.filters ?? [],
    [initialState.filters]
  )

  const { view, getResourceView } = useViews()

  const { data, refetch, isFetching } = VmAPI.useGetVmsPaginatedQuery(
    { extended: VM_EXTENDED_POOL ? 1 : 0, pageSize: VM_POOL_PAGINATION_SIZE },
    {
      selectFromResult: (result) => ({
        ...result,
        data:
          result?.data
            ?.filter((vm) => {
              // this filters data for host
              if (host?.ID) {
                if (
                  host?.ERROR_VMS?.ID ||
                  host?.UPDATED_VMS?.ID ||
                  host?.UPDATING_VMS?.ID
                ) {
                  return [
                    host?.ERROR_VMS.ID ?? [],
                    host?.UPDATED_VMS.ID ?? [],
                    host?.UPDATING_VMS.ID ?? [],
                  ]
                    .flat()
                    .includes(vm.ID)
                }

                return [host?.VMS?.ID ?? []].flat().includes(vm.ID)
              }

              // this filters data for backupjobs
              if (backupjobs?.ID) {
                if (backupjobsState) {
                  return [backupjobs?.[backupjobsState]?.ID ?? []]
                    .flat()
                    .includes(vm.ID)
                } else {
                  return [
                    (backupjobs?.TEMPLATE?.BACKUP_VMS &&
                      backupjobs?.TEMPLATE?.BACKUP_VMS.split(',')) ??
                      [],
                  ]
                    .flat()
                    .includes(vm.ID)
                }
              }

              // This is for return data without filters
              return true
            })
            ?.filter(({ ID }) =>
              filterData?.length ? filterData?.includes(ID) : filterLoose
            )
            ?.filter(({ STATE }) => VM_STATES[STATE]?.name !== STATES.DONE) ??
          [],
      }),
    }
  )

  useEffect(() => {
    if (handleRefetch && refetch) {
      handleRefetch(refetch)
    }
  }, [handleRefetch, refetch])

  const fmtData = useMemo(
    () =>
      data?.map((row) => ({
        ...row,
        TEMPLATE: {
          ...(row?.TEMPLATE ?? {}),
          LABELS: getResourceLabels(labels, row?.ID, RESOURCE_NAMES.VM, true),
        },
      })),
    [data, labels]
  )

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.VM)?.filters,
        columns: VmColumns,
      }),
    [view]
  )
  const listHeader = [
    {
      header: '',
      id: 'status-icon',
      accessor: (vm) => {
        const {
          color: stateColor,
          name: stateName,
          displayName: stateDisplayName,
        } = getVirtualMachineState(vm)

        return (
          <StatusCircle
            color={stateColor}
            tooltip={stateDisplayName ?? stateName}
          />
        )
      },
    },
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    {
      header: T.Host,
      id: 'hostname',
      accessor: (vm) => getLastHistory(vm)?.HOSTNAME,
    },
    {
      header: T.IP,
      id: 'ips',
      accessor: (vm) => {
        const ips = useMemo(() => getIps(vm), [vm])

        return <>{!!ips?.length && <MultipleTags tags={ips} />}</>
      },
    },
    {
      header: '',
      id: 'consoles',
      accessor: (vm) => <RowAction vm={vm} />,
    },
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
  const { component, header } = WrapperRow(VmRow, enabledFullScreen)

  return (
    <EnhancedTable
      columns={columns}
      data={fmtData}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      initialState={initialState}
      RowComponent={component}
      headerList={header && listHeader}
      enabledFullScreen={enabledFullScreen}
      resourceType={RESOURCE_NAMES.VM}
      {...rest}
    />
  )
}

VmsTable.displayName = 'VmsTable'

export default VmsTable
