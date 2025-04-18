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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import { VmAPI } from '@FeaturesModule'
import ScheduleActionCard from '@modules/components/Cards/ScheduleActionCard'
import {
  CreateSchedButton,
  CharterButton,
  UpdateSchedButton,
  DeleteSchedButton,
} from '@modules/components/Buttons/ScheduleAction'

import {
  getScheduleActions,
  getHypervisor,
  isVmAvailableAction,
  getActionsAvailable,
  jsonToXml,
} from '@ModelsModule'
import { VM_ACTIONS, SERVER_CONFIG, T } from '@ConstantsModule'

const {
  SCHED_ACTION_CREATE,
  SCHED_ACTION_UPDATE,
  SCHED_ACTION_DELETE,
  CHARTER_CREATE,
} = VM_ACTIONS

/**
 * Renders the list of schedule actions from a VM.
 *
 * @param {object} props - Props
 * @param {object|boolean} props.tabProps - Tab properties
 * @param {object} [props.tabProps.actions] - Actions from user view yaml
 * @param {string} props.id - Virtual Machine id
 * @param {object} props.oneConfig - OpenNEbula configuration
 * @param {boolean} props.adminGroup - If the user is admin
 * @returns {ReactElement} Schedule actions tab
 */
const VmSchedulingTab = ({
  tabProps: { actions } = {},
  id,
  oneConfig,
  adminGroup,
}) => {
  const [addScheduledAction] = VmAPI.useAddScheduledActionMutation()
  const [updateScheduledAction] = VmAPI.useUpdateScheduledActionMutation()
  const [deleteScheduledAction] = VmAPI.useDeleteScheduledActionMutation()
  const { data: vm = {} } = VmAPI.useGetVmQuery({ id })

  const [scheduling, actionsAvailable] = useMemo(() => {
    const hypervisor = getHypervisor(vm)
    const actionsByHypervisor = getActionsAvailable(actions, hypervisor)
    const actionsByState = actionsByHypervisor.filter((action) =>
      isVmAvailableAction(action, vm)
    )

    return [getScheduleActions(vm), actionsByState]
  }, [vm])

  const isCreateEnabled = actionsAvailable?.includes?.(SCHED_ACTION_CREATE)
  const isUpdateEnabled = actionsAvailable?.includes?.(SCHED_ACTION_UPDATE)
  const isDeleteEnabled = actionsAvailable?.includes?.(SCHED_ACTION_DELETE)
  const isCharterEnabled =
    actionsAvailable?.includes?.(CHARTER_CREATE) && SERVER_CONFIG?.leases

  /**
   * Add new schedule action to VM.
   *
   * @param {object} formData - New schedule action
   * @returns {Promise} - Add schedule action and refetch VM data
   */
  const handleCreateSchedAction = async (formData) => {
    const template = jsonToXml({ SCHED_ACTION: formData })
    await addScheduledAction({ id, template })
  }

  /**
   * Update schedule action to VM.
   *
   * @param {object} formData - Updated schedule action
   * @param {string|number} schedId - Schedule action id
   * @returns {Promise} - Update schedule action and refetch VM data
   */
  const handleUpdate = async (formData, schedId) => {
    const template = jsonToXml({ SCHED_ACTION: formData })
    await updateScheduledAction({ id, schedId, template })
  }

  /**
   * Delete schedule action to VM.
   *
   * @param {string|number} schedId - Schedule action id
   * @returns {Promise} - Delete schedule action and refetch VM data
   */
  const handleRemove = async (schedId) => {
    await deleteScheduledAction({ id, schedId })
  }

  /**
   * Add leases from sunstone-server.conf to VM.
   *
   * @param {object[]} formData - List of leases (schedule action)
   * @returns {Promise} - Add schedule actions and refetch VM data
   */
  const handleCreateCharter = async (formData) => {
    await Promise.all(
      formData.map((action) => {
        const template = jsonToXml({ SCHED_ACTION: action })

        return addScheduledAction({ id, template })
      })
    )
  }

  return (
    <>
      {(isCreateEnabled || isCharterEnabled) && (
        <Stack flexDirection="row" gap="1em">
          {isCreateEnabled && (
            <CreateSchedButton vm={vm} onSubmit={handleCreateSchedAction} />
          )}
          {isCharterEnabled && <CharterButton onSubmit={handleCreateCharter} />}
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
                  {isUpdateEnabled && !noMore && (
                    <UpdateSchedButton
                      vm={vm}
                      schedule={schedule}
                      onSubmit={(newAction) => handleUpdate(newAction, ID)}
                      oneConfig={oneConfig}
                      adminGroup={adminGroup}
                    />
                  )}
                  {isDeleteEnabled && (
                    <DeleteSchedButton
                      vmId={id}
                      onSubmit={() => handleRemove(ID)}
                      schedule={schedule}
                      oneConfig={oneConfig}
                      adminGroup={adminGroup}
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

VmSchedulingTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

VmSchedulingTab.label = T.ScheduledActions

export default VmSchedulingTab
