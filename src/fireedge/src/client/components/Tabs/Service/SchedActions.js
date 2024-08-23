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
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import { parseVmTemplateContents } from 'client/utils'

import {
  useGetServiceQuery,
  useServiceRoleActionMutation,
  useServiceAddActionMutation,
} from 'client/features/OneApi/service'
import {} from 'client/features/OneApi/vm'

import ScheduleActionCard from 'client/components/Cards/ScheduleActionCard'
import { PerformActionButton } from 'client/components/Buttons/ScheduleAction'

import { getScheduleActions } from 'client/models/VirtualMachine'

import { VM_ACTIONS, T } from 'client/constants'

import { useGeneralApi } from 'client/features/General'

const { PERFORM_ACTION } = VM_ACTIONS

/**
 * Renders the list of schedule actions from a Service.
 *
 * @param {object} props - Props
 * @param {string} props.id - Service id
 * @param {object|boolean} props.tabProps - Tab properties
 * @param {object} [props.tabProps.actions] - Actions from user view yaml
 * @returns {ReactElement} Schedule actions tab
 */
const SchedulingTab = ({ id, tabProps: { actions } = {} }) => {
  const { enqueueError, enqueueSuccess, enqueueInfo } = useGeneralApi()

  // Get service info
  const { data: service = {} } = useGetServiceQuery({ id })

  // Functions to manage sched actions
  const [useServiceAddAction] = useServiceAddActionMutation()
  const [serviceRoleAction] = useServiceRoleActionMutation()

  // Check actions and roles
  const [scheduling, actionsAvailable, roles] = useMemo(() => {
    const schedActions = {
      TEMPLATE: {
        SCHED_ACTION: parseVmTemplateContents(
          service?.TEMPLATE?.BODY?.roles[0]?.vm_template_contents,
          true
        )?.schedActions,
      },
    }

    const updatedRoles = service?.TEMPLATE?.BODY?.roles

    return [getScheduleActions(schedActions), actions, updatedRoles]
  }, [service])

  const isPerformActionEnabled = actionsAvailable[PERFORM_ACTION]

  /**
   * Add new schedule action to VM.
   *
   * @param {object} formData - New schedule action
   * @returns {Promise} - Add schedule action and refetch VM data
   */
  const handlePerformAction = async (formData) => {
    enqueueInfo(T.InfoServiceActionRole, [formData.ACTION, formData.ROLE])

    try {
      if (formData.ROLE === 'ALL') {
        await useServiceAddAction({
          id,
          perform: formData.ACTION,
          params: {
            args: formData.ARGS,
          },
        })
        enqueueSuccess(T.SuccessRoleActionCompleted, [
          formData.ACTION,
          formData.ROLE,
        ])
      } else {
        await serviceRoleAction({
          id,
          role: formData.ROLE,
          perform: formData.ACTION,
          params: {
            args: formData.ARGS,
          },
        })
        enqueueSuccess(T.SuccessRoleActionCompleted, [
          formData.ACTION,
          formData.ROLE,
        ])
      }
    } catch (error) {
      enqueueError(T.ErrorServiceActionRole, [
        formData?.ACTION,
        formData?.ROLE,
        error,
      ])
    }
  }

  return (
    <>
      {isPerformActionEnabled && (
        <Stack flexDirection="row" gap="1em">
          {isPerformActionEnabled && (
            <PerformActionButton onSubmit={handlePerformAction} roles={roles} />
          )}
        </Stack>
      )}

      <Stack gap="1em" py="0.8em">
        {scheduling.map((schedule) => {
          const { ID, NAME } = schedule

          return <ScheduleActionCard key={ID ?? NAME} schedule={schedule} />
        })}
      </Stack>
    </>
  )
}

SchedulingTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

export default SchedulingTab
