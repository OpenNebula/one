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
import PropTypes from 'prop-types'
import { ReactElement, useMemo } from 'react'

import { List } from 'client/components/Tabs/Common'
import {
  useRenameBackupJobMutation,
  useUpdatePriorityBackupJobMutation,
} from 'client/features/OneApi/backupjobs'

import { BACKUPJOB_ACTIONS, T } from 'client/constants'

import { levelLockToString, timeFromMilliseconds } from 'client/models/Helper'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {object} props.backupjob - Template
 * @param {string[]} props.actions - Available actions to information tab
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ backupjob = {}, actions }) => {
  const [rename] = useRenameBackupJobMutation()
  const [setPriority] = useUpdatePriorityBackupJobMutation()

  const { ID, NAME, PRIORITY, LAST_BACKUP_TIME, LAST_BACKUP_DURATION, LOCK } =
    backupjob

  const time = useMemo(() => {
    const LastBackupTime = +LAST_BACKUP_TIME
    if (LastBackupTime > 0) {
      const timer = timeFromMilliseconds(+LAST_BACKUP_TIME)

      return timer.toFormat('ff')
    } else {
      return '-'
    }
  }, [LAST_BACKUP_TIME])

  const handleRename = async (_, newName) => {
    await rename({ id: ID, name: newName })
  }
  const handlePriority = async (_, priority) => {
    await setPriority({ id: ID, priority })
  }

  const info = [
    { name: T.ID, value: ID, dataCy: 'id' },
    {
      name: T.Name,
      value: NAME,
      canEdit: actions?.includes?.(BACKUPJOB_ACTIONS.RENAME),
      handleEdit: handleRename,
      dataCy: 'name',
    },
    {
      name: T.Priority,
      value: PRIORITY,
      canEdit: actions?.includes?.(BACKUPJOB_ACTIONS.PRIORITY),
      handleEdit: handlePriority,
      dataCy: 'priority',
    },
    {
      name: T.LastBackupTimeInfo,
      value: time,
      dataCy: 'lastBackupTime',
    },
    {
      name: T.LastBackupDuration,
      value: LAST_BACKUP_DURATION,
      dataCy: 'lastDurationTime',
    },
    {
      name: T.Locked,
      value: levelLockToString(LOCK?.LOCKED),
      dataCy: 'locked',
    },
  ].filter(Boolean)

  return (
    <List
      title={T.Information}
      list={info}
      containerProps={{ sx: { gridRow: 'span 3' } }}
    />
  )
}

InformationPanel.displayName = 'InformationPanel'

InformationPanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  backupjob: PropTypes.object,
}

export default InformationPanel
