/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { MoreVert } from 'iconoir-react'
import { VM_ACTION_ENUM, T, VM_ACTIONS } from '@ConstantsModule'
import {
  MenuButton,
  ResourceActionConfirmation,
  Table,
} from '@ComponentsV2Module'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { getStyles } from '@modules/resources/resources/VirtualMachine/Tabs/ScheduledActions/styles'
import { isVmAvailableAction, vmschedactionsTable } from '@ModelsModule'
import { VirtualMachine } from '@modules/resources/resources'
import { useGeneralApi, useModalsApi } from '@FeaturesModule'
import { sentenceCase } from '@UtilsModule'

const getScheduleActionResourceName = (schedule) => {
  const titleName = schedule?.NAME ? ` (${schedule.NAME})` : ''

  return `${sentenceCase(schedule?.ACTION)}${titleName}`
}

const getScheduleActionName = (schedule) =>
  `#${schedule?.ID} ${getScheduleActionResourceName(schedule)}`

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - VM Instances info tab
 */
export const ScheduledActions = ({ data, config }) => {
  const { selectedVm } = data || {}
  const { showModal } = useModalsApi()
  const { enqueueSuccess } = useGeneralApi()
  const handleActionSuccess = (message) =>
    message && enqueueSuccess(message, [selectedVm?.ID])

  const { data: history = [], isFetching: isFetchingScheduledActions } =
    vmschedactionsTable.useData(
      { id: selectedVm?.ID },
      { skip: !selectedVm?.ID }
    )

  const { actions, isLoading: isPerformingAction } =
    VirtualMachine.Actions.useActions({
      context:
        (fn) =>
        (params = {}) =>
          fn?.({
            id: selectedVm?.ID,
            ...params,
          }),
    })

  const openDeleteScheduleActionConfirm = (schedule) =>
    showModal({
      name: T.SCHED_ACTION_DELETE,
      isConfirmDialog: true,
      dialogProps: {
        title: T.DeleteScheduleAction.replace(
          '%s',
          getScheduleActionName(schedule)
        ),
        dataCy: 'modal-delete-sched-action',
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={{
              ID: schedule?.ID,
              NAME: getScheduleActionResourceName(schedule),
            }}
            resourceType={T.ScheduleAction}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        const action = actions?.[VM_ACTION_ENUM.SCHED_ACTION_DELETE]
        const result = await action?.mutate?.(schedule)

        if (result?.error) return false
        enqueueSuccess(T.DeleteScheduleActionSuccess, [selectedVm?.ID])

        return result
      },
    })

  const getDeleteScheduleActionOption = (schedule) => {
    const action = actions?.[VM_ACTION_ENUM.SCHED_ACTION_DELETE]
    const actionType = VM_ACTIONS.SCHED_ACTION_DELETE
    const isDisabled =
      action?.isDisabled ||
      !config?.actions?.[actionType] ||
      !isVmAvailableAction(actionType, selectedVm)

    return {
      title: T.SCHED_ACTION_DELETE,
      tooltip: isDisabled ? T.DetachRestricted : T.SCHED_ACTION_DELETE,
      isDisabled,
      onClick: () => openDeleteScheduleActionConfirm(schedule),
    }
  }

  const columns = [
    ...vmschedactionsTable.columns(),
    {
      header: '',
      id: 'actions',
      grow: false,
      cell: ({ row }) => {
        const [updateScheduleActionOption] =
          VirtualMachine.Actions.Utils.generateMenuOptions({
            keys: [VM_ACTION_ENUM.SCHED_ACTION_UPDATE],
            actions,
            vm: selectedVm,
            paramsContext: row?.original,
            formContext: row?.original,
            viewConfig: config,
            showModal,
            onSuccess: handleActionSuccess,
          })
        const deleteScheduleActionOption = getDeleteScheduleActionOption(
          row?.original
        )

        return (
          <MenuButton
            iconOnly={<MoreVert />}
            options={[
              [updateScheduleActionOption, deleteScheduleActionOption].filter(
                Boolean
              ),
            ]}
          />
        )
      },
    },
  ]

  const attachDiskOptions = VirtualMachine.Actions.Utils.generateMenuOptions({
    keys: [VM_ACTION_ENUM.SCHED_ACTION_CREATE, VM_ACTION_ENUM.CHARTER_CREATE],
    actions,
    vm: selectedVm,
    viewConfig: config,
    showModal,
    onSuccess: handleActionSuccess,
  })

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <MenuButton placeholder={T.AddAction} options={[attachDiskOptions]} />
      <Box className="table-container">
        <Table
          columns={columns}
          data={history}
          isLoading={isFetchingScheduledActions || isPerformingAction}
          emptyContentProps={{
            title: T.NoScheduleActions,
            subtitle: T.ScheduleActionsWillAppearHere,
          }}
          size="medium"
          isEnableSearchBar
          isEnableSort
          isEnableFilters
        />
      </Box>
    </Box>
  )
}

ScheduledActions.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

ScheduledActions.id = 'sched_actions'
ScheduledActions.title = T.ScheduledActions
