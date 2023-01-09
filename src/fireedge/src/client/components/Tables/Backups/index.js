/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
  const { rootProps = {}, searchProps = {}, vm, ...rest } = props ?? {}
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

      return {
        ...result,
        data: result?.data?.filter((backup) =>
          vm ? backupsIds?.includes(backup.ID) : true
        ),
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

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      RowComponent={BackupRow}
      {...rest}
    />
  )
}

BackupsTable.displayName = 'BackupsTable'

export default BackupsTable
