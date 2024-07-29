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
import { useGetBackupJobsQuery } from 'client/features/OneApi/backupjobs'

import BackupJobsColumns from 'client/components/Tables/BackupJobs/columns'
import BackupJobsRow from 'client/components/Tables/BackupJobs/row'
import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import { RESOURCE_NAMES } from 'client/constants'

const DEFAULT_DATA_CY = 'backupjobs'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Backup Jobs table
 */
const BackupJobsTable = (props) => {
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const { data = [], isFetching, refetch } = useGetBackupJobsQuery()

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.BACKUPJOBS)?.filters,
        columns: BackupJobsColumns,
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
      RowComponent={BackupJobsRow}
      {...rest}
    />
  )
}

BackupJobsTable.propTypes = { ...EnhancedTable.propTypes }
BackupJobsTable.displayName = 'BackupJobsTable'

export default BackupJobsTable
