/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useContext, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import { useAuth } from 'client/features/Auth'
import { useVmApi } from 'client/features/One'
import { TabContext } from 'client/components/Tabs/TabProvider'
import ScheduleActionCard from 'client/components/Cards/ScheduleActionCard'
import {
  CreateSchedButton,
  CharterButton,
} from 'client/components/Buttons/ScheduleAction'

import {
  getScheduleActions,
  getHypervisor,
  isAvailableAction,
} from 'client/models/VirtualMachine'
import { getActionsAvailable, jsonToXml } from 'client/models/Helper'
import { VM_ACTIONS } from 'client/constants'

const {
  SCHED_ACTION_CREATE,
  SCHED_ACTION_UPDATE,
  SCHED_ACTION_DELETE,
  CHARTER_CREATE,
} = VM_ACTIONS

/**
 * Renders the list of schedule action from a VM.
 *
 * @param {object} props - Props
 * @param {object|boolean} props.tabProps - Tab properties
 * @param {object} [props.tabProps.actions] - Actions from user view yaml
 * @returns {ReactElement} List of schedule actions
 */
const VmSchedulingTab = ({ tabProps: { actions } = {} }) => {
  const { config } = useAuth()
  const { handleRefetch, data: vm } = useContext(TabContext)

  const { addScheduledAction, updateScheduledAction, deleteScheduledAction } =
    useVmApi()

  const [scheduling, actionsAvailable] = useMemo(() => {
    const hypervisor = getHypervisor(vm)
    const actionsByHypervisor = getActionsAvailable(actions, hypervisor)
    const actionsByState = actionsByHypervisor.filter(
      (action) => !isAvailableAction(action)(vm)
    )

    return [getScheduleActions(vm), actionsByState]
  }, [vm])

  const iCreateEnabled = actionsAvailable?.includes?.(SCHED_ACTION_CREATE)
  const isUpdateEnabled = actionsAvailable?.includes?.(SCHED_ACTION_UPDATE)
  const isDeleteEnabled = actionsAvailable?.includes?.(SCHED_ACTION_DELETE)
  const isCharterEnabled =
    actionsAvailable?.includes?.(CHARTER_CREATE) && config?.leases

  /**
   * Add new schedule action to VM.
   *
   * @param {object} formData - New schedule action
   * @returns {Promise} - Add schedule action and refetch VM data
   */
  const handleCreateSchedAction = async (formData) => {
    const data = { template: jsonToXml({ SCHED_ACTION: formData }) }
    const response = await addScheduledAction(vm.ID, data)

    String(response) === String(vm.ID) && (await handleRefetch?.(vm.ID))
  }

  /**
   * Update schedule action to VM.
   *
   * @param {object} formData - Updated schedule action
   * @param {string|number} id - Schedule action id
   * @returns {Promise} - Update schedule action and refetch VM data
   */
  const handleUpdate = async (formData, id) => {
    const data = {
      id_sched: id,
      template: jsonToXml({ SCHED_ACTION: formData }),
    }

    const response = await updateScheduledAction(vm.ID, data)

    String(response) === String(vm.ID) && (await handleRefetch?.(vm.ID))
  }

  /**
   * Delete schedule action to VM.
   *
   * @param {string|number} id - Schedule action id
   * @returns {Promise} - Delete schedule action and refetch VM data
   */
  const handleRemove = async (id) => {
    const data = { id_sched: id }
    const response = await deleteScheduledAction(vm.ID, data)

    String(response) === String(vm.ID) && (await handleRefetch?.(vm.ID))
  }

  /**
   * Add leases from sunstone-server.conf to VM.
   *
   * @param {object[]} formData - List of leases (schedule action)
   * @returns {Promise} - Add schedule actions and refetch VM data
   */
  const handleCreateCharter = async (formData) => {
    const responses = await Promise.all(
      formData.map((schedAction) => {
        const data = { template: jsonToXml({ SCHED_ACTION: schedAction }) }

        return addScheduledAction(vm.ID, data)
      })
    )

    responses.some((response) => String(response) === String(vm?.ID)) &&
      (await handleRefetch?.(vm.ID))
  }

  return (
    <>
      {(iCreateEnabled || isCharterEnabled) && (
        <Stack flexDirection="row" gap="1em">
          {iCreateEnabled && (
            <CreateSchedButton vm={vm} onSubmit={handleCreateSchedAction} />
          )}
          {isCharterEnabled && <CharterButton onSubmit={handleCreateCharter} />}
        </Stack>
      )}

      <Stack display="grid" gap="1em" py="0.8em">
        {scheduling.map((schedule) => {
          const { ID, NAME } = schedule

          return (
            <ScheduleActionCard
              key={ID ?? NAME}
              vm={vm}
              schedule={schedule}
              {...(isUpdateEnabled && {
                handleUpdate: (newAction) => handleUpdate(newAction, ID),
              })}
              {...(isDeleteEnabled && { handleRemove: () => handleRemove(ID) })}
            />
          )
        })}
      </Stack>
    </>
  )
}

VmSchedulingTab.propTypes = {
  tabProps: PropTypes.shape({
    actions: PropTypes.object,
  }),
}

VmSchedulingTab.displayName = 'VmSchedulingTab'

export default VmSchedulingTab
