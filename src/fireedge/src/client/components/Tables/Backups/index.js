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
import { useGetBackupsQuery } from 'client/features/OneApi/image'

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import backupColumns from 'client/components/Tables/Backups/columns'
import BackupRow from 'client/components/Tables/Backups/row'
import { RESOURCE_NAMES } from 'client/constants'

const DEFAULT_DATA_CY = 'backups'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Backups table
 */
const BackupsTable = (props) => {
  const {
    rootProps = {},
    searchProps = {},
    vm,
    refetchVm,
    filter,
    isFetchingVm,
    ...rest
  } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const {
    data = [],
    isFetching,
    refetch,
  } = useGetBackupsQuery(undefined, {
    selectFromResult: (result) => {
      const backupsIds = vm?.BACKUPS?.BACKUP_IDS?.ID
        ? Array.isArray(vm?.BACKUPS?.BACKUP_IDS?.ID)
          ? vm?.BACKUPS?.BACKUP_IDS?.ID
          : [vm?.BACKUPS?.BACKUP_IDS?.ID]
        : []

      const backupData = result?.data?.filter((backup) =>
        vm ? backupsIds?.includes(backup.ID) : true
      )

      return {
        ...result,
        data: typeof filter === 'function' ? filter(backupData) : backupData,
      }
    },
  })

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.BACKUP)?.filters,
        columns: backupColumns,
      }),
    [view]
  )

  /**
   * Refetch vms and backups. If a new backup is created, the id of the backup will be in the data of a vm, so we need to refetch also the vms query when we are showing the backups of a vm.
   */
  const refetchAll = () => {
    // Refetch vm only if the function exists (if not, we are looking for all backups, no matter which vm is associated)
    refetchVm && refetchVm()
    refetch()
  }

  const isFetchingAll = () =>
    isFetchingVm ? !!(isFetchingVm && isFetching) : isFetching

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetchAll}
      isLoading={isFetchingAll()}
      getRowId={(row) => String(row.ID)}
      RowComponent={BackupRow}
      {...rest}
    />
  )
}

BackupsTable.displayName = 'BackupsTable'

export default BackupsTable
