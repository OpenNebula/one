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

import { useViews } from 'client/features/Auth'
import { useGetVmsQuery } from 'client/features/OneApi/vm'

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import VmColumns from 'client/components/Tables/Vms/columns'
import VmRow from 'client/components/Tables/Vms/row'
import {
  RESOURCE_NAMES,
  STATES,
  VM_EXTENDED_POOL,
  VM_STATES,
} from 'client/constants'

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

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      RowComponent={VmRow}
      initialState={initialState}
      {...rest}
    />
  )
}

VmsTable.displayName = 'VmsTable'

export default VmsTable
