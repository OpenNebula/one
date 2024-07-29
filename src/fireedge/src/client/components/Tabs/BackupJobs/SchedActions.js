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
import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, useMemo } from 'react'

import {
  CreateSchedButton,
  DeleteSchedButton,
  UpdateSchedButton,
} from 'client/components/Buttons/ScheduleAction'
import ScheduleActionCard from 'client/components/Cards/ScheduleActionCard'
import {
  useAddScheduledActionBackupJobMutation,
  useDeleteScheduledActionBackupJobMutation,
  useGetBackupJobQuery,
  useUpdateScheduledActionBackupJobMutation,
} from 'client/features/OneApi/backupjobs'

import { VM_ACTIONS } from 'client/constants'
import { getActionsAvailable, jsonToXml } from 'client/models/Helper'
import { getScheduleActions } from 'client/models/VirtualMachine'

const { SCHED_ACTION_CREATE, SCHED_ACTION_UPDATE, SCHED_ACTION_DELETE } =
  VM_ACTIONS

/**
 * Renders the list of schedule actions from a VM.
 *
 * @param {object} props - Props
 * @param {object|boolean} props.tabProps - Tab properties
 * @param {object} [props.tabProps.actions] - Actions from user view yaml
 * @param {string} props.id - Virtual Machine id
 * @returns {ReactElement} Schedule actions tab
 */
const BackupJobSchedulingTab = ({ tabProps: { actions } = {}, id }) => {
  const [addScheduledAction] = useAddScheduledActionBackupJobMutation()
  const [updateScheduledAction] = useUpdateScheduledActionBackupJobMutation()
  const [deleteScheduledAction] = useDeleteScheduledActionBackupJobMutation()
  const { data: backupjob = {} } = useGetBackupJobQuery({ id })

  const [scheduling, actionsAvailable] = useMemo(
    () => [getScheduleActions(backupjob), getActionsAvailable(actions)],
    [backupjob]
  )

  const isCreateEnabled = actionsAvailable?.includes?.(SCHED_ACTION_CREATE)
  const isUpdateEnabled = actionsAvailable?.includes?.(SCHED_ACTION_UPDATE)
  const isDeleteEnabled = actionsAvailable?.includes?.(SCHED_ACTION_DELETE)

  /**
   * Add new schedule action to Backup Job.
   *
   * @param {object} formData - New schedule action
   * @returns {Promise} - Add schedule action and refetch Backup Job data
   */
  const handleCreateSchedAction = async (formData) => {
    const template = jsonToXml({
      SCHED_ACTION: { ...formData, ACTION: 'backup' },
    })
    await addScheduledAction({ id, template })
  }

  /**
   * Update schedule action to Backup Job.
   *
   * @param {object} formData - Updated schedule action
   * @param {string|number} schedId - Schedule action id
   * @returns {Promise} - Update schedule action and refetch BackupJob data
   */
  const handleUpdate = async (formData, schedId) => {
    const template = jsonToXml({
      SCHED_ACTION: { ...formData, ACTION: 'backup' },
    })
    await updateScheduledAction({ id, schedId, template })
  }

  /**
   * Delete schedule action to BackupJob.
   *
   * @param {string|number} schedId - Schedule action id
   * @returns {Promise} - Delete schedule action and refetch BackupJob data
   */
  const handleRemove = async (schedId) => {
    await deleteScheduledAction({ id, schedId })
  }

  return (
    <>
      {isCreateEnabled && (
        <Stack flexDirection="row" gap="1em">
          <CreateSchedButton
            vm={backupjob}
            onSubmit={handleCreateSchedAction}
            backupjobs
          />
        </Stack>
      )}

      <Stack gap="1em" py="0.8em">
        {scheduling.map((schedule) => {
          const { ID, NAME } = schedule

          return (
            <ScheduleActionCard
              key={ID ?? NAME}
              schedule={schedule}
              actions={({ noMore }) => (
                <>
                  {isUpdateEnabled && (
                    <UpdateSchedButton
                      vm={backupjob}
                      schedule={schedule}
                      backupjobs
                      onSubmit={(newAction) => handleUpdate(newAction, ID)}
                    />
                  )}
                  {isDeleteEnabled && (
                    <DeleteSchedButton
                      onSubmit={() => handleRemove(ID)}
                      schedule={schedule}
                    />
                  )}
                </>
              )}
            />
          )
        })}
      </Stack>
    </>
  )
}

BackupJobSchedulingTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}
BackupJobSchedulingTab.displayName = 'BackupJobSchedulingTab'

export default BackupJobSchedulingTab
