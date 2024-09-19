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
import { StatusCircle } from 'client/components/Status'
import BackupJobsColumns from 'client/components/Tables/BackupJobs/columns'
import BackupJobsRow from 'client/components/Tables/BackupJobs/row'
import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import WrapperRow from 'client/components/Tables/Enhanced/WrapperRow'
import Timer from 'client/components/Timer'
import { RESOURCE_NAMES, T } from 'client/constants'
import COLOR from 'client/constants/color'
import { useViews } from 'client/features/Auth'
import { useGetBackupJobsQuery } from 'client/features/OneApi/backupjobs'
import { timeFromMilliseconds } from 'client/models/Helper'
import { ReactElement, useMemo } from 'react'

const DEFAULT_DATA_CY = 'backupjobs'

const haveValues = function (object) {
  return Object.values(object).length > 0
}

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

  const listHeader = [
    {
      header: '',
      id: 'status-icon',
      accessor: ({
        OUTDATED_VMS,
        BACKING_UP_VMS,
        ERROR_VMS,
        LAST_BACKUP_TIME,
      }) => {
        const status = useMemo(() => {
          const completed = {
            color: COLOR.success.main,
            tooltip: T.Completed,
          }
          const noStarted = {
            color: COLOR.warning.main,
            tooltip: T.NotStartedYet,
          }

          const error = {
            color: COLOR.error.main,
            tooltip: T.Error,
          }

          const onGoing = {
            color: COLOR.info.main,
            tooltip: T.OnGoing,
          }

          if (haveValues(ERROR_VMS)) {
            return error
          }

          if (!haveValues(OUTDATED_VMS) && !haveValues(BACKING_UP_VMS)) {
            return LAST_BACKUP_TIME === '0' ? noStarted : completed
          }

          if (haveValues(OUTDATED_VMS)) {
            return completed
          }

          if (haveValues(BACKING_UP_VMS)) {
            return onGoing
          }
        }, [OUTDATED_VMS, BACKING_UP_VMS, ERROR_VMS, LAST_BACKUP_TIME])

        return <StatusCircle color={status.color} tooltip={status.tooltip} />
      },
    },
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    { header: T.Owner, id: 'owner', accessor: 'UNAME' },
    { header: T.Group, id: 'group', accessor: 'GNAME' },
    { header: T.Priority, id: 'priority', accessor: 'PRIORITY' },
    {
      header: T.LastBackupTimeInfo,
      id: 'last-time',
      accessor: ({ LAST_BACKUP_TIME }) => {
        const LastBackupTime = +LAST_BACKUP_TIME
        if (LastBackupTime > 0) {
          const timer = timeFromMilliseconds(LastBackupTime)

          return (
            <span title={timer.toFormat('ff')}>
              <Timer translateWord={T.LastBackupTime} initial={timer} />
            </span>
          )
        } else {
          return ''
        }
      },
    },
  ]

  const { component, header } = WrapperRow(BackupJobsRow)

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

BackupJobsTable.propTypes = { ...EnhancedTable.propTypes }
BackupJobsTable.displayName = 'BackupJobsTable'

export default BackupJobsTable
