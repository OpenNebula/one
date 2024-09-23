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

import { useAuth, useViews } from 'client/features/Auth'
import { useGetVmsQuery } from 'client/features/OneApi/vm'

import { ConsoleButton } from 'client/components/Buttons'
import MultipleTags from 'client/components/MultipleTags'
import { StatusCircle } from 'client/components/Status'
import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import WrapperRow from 'client/components/Tables/Enhanced/WrapperRow'
import VmColumns from 'client/components/Tables/Vms/columns'
import VmRow from 'client/components/Tables/Vms/row'
import {
  RESOURCE_NAMES,
  STATES,
  T,
  VM_ACTIONS,
  VM_EXTENDED_POOL,
  VM_STATES,
} from 'client/constants'
import { getColorFromString, getUniqueLabels } from 'client/models/Helper'
import { getIps, getLastHistory, getState } from 'client/models/VirtualMachine'
const DEFAULT_DATA_CY = 'vms'

const { VNC, RDP, SSH, VMRC } = VM_ACTIONS
const CONNECTION_TYPES = [VNC, RDP, SSH, VMRC]

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
    ...rest
  } = props ?? {}

  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`
  initialState.filters = useMemo(
    () => initialState.filters ?? [],
    [initialState.filters]
  )

  const { view, getResourceView } = useViews()

  const { data, refetch, isFetching } = useGetVmsQuery(
    { extended: VM_EXTENDED_POOL },
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

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.VM)?.filters,
        columns: VmColumns,
      }),
    [view]
  )

  const { zone, defaultZone } = useGeneral()
  const listHeader = [
    {
      header: '',
      id: 'status-icon',
      accessor: (vm) => {
        const {
          color: stateColor,
          name: stateName,
          displayName: stateDisplayName,
        } = getState(vm)

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
    { header: T.Owner, id: 'owner', accessor: 'UNAME' },
    { header: T.Group, id: 'group', accessor: 'GNAME' },
    {
      header: T.State,
      id: 'state',
      accessor: (vm) => getState(vm)?.name,
    },
    {
      header: T.Hostname,
      id: 'hostname',
      accessor: (vm) => getLastHistory(vm)?.HOSTNAME,
    },
    {
      header: T.IP,
      id: 'ips',
      accessor: (vm) => getIps(vm).join(),
    },
  ]

  zone === defaultZone &&
    listHeader.push({
      header: '',
      id: 'consoles',
      accessor: (vm) => (
        <>
          {CONNECTION_TYPES.map((connectionType) => (
            <ConsoleButton
              key={`${vm}-${connectionType}`}
              connectionType={connectionType}
              vm={vm}
            />
          ))}
        </>
      ),
    },
    {
      header: T.Labels,
      id: 'labels',
      accessor: ({ USER_TEMPLATE: { LABELS } = {} }) => {
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
  const { component, header } = WrapperRow(VmRow)

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      initialState={initialState}
      RowComponent={component}
      headerList={header && listHeader}
      {...rest}
    />
  )
}

VmsTable.displayName = 'VmsTable'

export default VmsTable
