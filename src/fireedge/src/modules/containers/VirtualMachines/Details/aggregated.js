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

import {
  ButtonGroup,
  DetailsDrawer,
  getLabelMenuButtonProps,
  InfoSlot,
  MenuButton,
  SummarySlot,
  TabSlot,
  ToggleGroup,
} from '@ComponentsV2Module'
import { useModalsApi, VmAPI } from '@FeaturesModule'
import { Box, useTheme } from '@mui/material'
import { Component, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Cancel, Lock, NoLock, Trash } from 'iconoir-react'
import {
  RESOURCE_NAMES,
  T,
  UNITS,
  VM_ACTION_ENUM,
  VM_ACTIONS,
} from '@ConstantsModule'
import { VirtualMachine } from '@ResourcesModule'
import {
  aggregateLockState,
  aggregateMetrics,
  getCommonValue,
  prettyBytes,
} from '@UtilsModule'
import { getVirtualMachineState, getVmHostname } from '@ModelsModule'

const DELETE_ACTIONS = [VM_ACTIONS.TERMINATE, VM_ACTIONS.TERMINATE_HARD]

const disableOptions = (options, isDisabled) =>
  options?.map((option) =>
    Array.isArray(option)
      ? disableOptions(option, isDisabled)
      : { ...option, isDisabled: isDisabled || option?.isDisabled }
  )

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object[]} root0.selectedVms - Selected VMs
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @param {object} root0.viewConfig - View config
 * @returns {Component} - Aggregated view details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedVms = [],
  handleClose,
  handleSelect,
  handleDeselect,
  viewConfig = {},
}) => {
  const { palette } = useTheme()
  const { showModal } = useModalsApi()

  const [refreshVm, { isFetching: isRefreshingVm }] = VmAPI.useLazyGetVmQuery()
  const selectedVmIds = useMemo(
    () =>
      selectedVms
        .map(({ ID }) => ID)
        .filter((ID) => ID !== undefined && ID !== null)
        .join(','),
    [selectedVms]
  )

  const { data: extendedSelectedVms = [], isFetching: isLoadingExtendedVms } =
    VmAPI.useGetVmInfosetQuery(
      { ids: selectedVmIds, extended: 1 },
      { skip: !isOpen || !selectedVmIds }
    )

  const selectedVmsForTabs = useMemo(() => {
    const extendedById = new Map(
      extendedSelectedVms.map((vm) => [String(vm.ID), vm])
    )

    return selectedVms.map((vm) => extendedById.get(String(vm.ID)) ?? vm)
  }, [extendedSelectedVms, selectedVms])

  const handleRefresh = useCallback(
    async () =>
      await Promise.all(selectedVms.map(({ ID }) => refreshVm({ id: ID }))),
    [refreshVm, selectedVms]
  )

  const actionContext = useCallback(
    (trigger) =>
      async (params = {}) => {
        await Promise.all(
          selectedVms.map(({ ID }) => trigger({ id: ID, ...params }))
        )

        if (DELETE_ACTIONS.includes(params?.action)) {
          handleClose?.()

          return
        }

        await handleRefresh()
      },
    [handleClose, handleRefresh, selectedVms]
  )

  const { actions, isLoading: isPerformingAction } =
    VirtualMachine.Actions.useActions({
      context: actionContext,
    })

  const isActionsDisabled =
    selectedVms?.length === 0 || isRefreshingVm || isPerformingAction

  const generalOptions = disableOptions(
    VirtualMachine.Actions.Utils.generateMenuOptions({
      keys: VirtualMachine.Actions.Groups.General,
      actions,
      vm: selectedVms,
      viewConfig,
      showModal,
    }),
    isActionsDisabled
  )

  const stateOptions = disableOptions(
    VirtualMachine.Actions.Utils.generateMenuOptions({
      keys: VirtualMachine.Actions.Groups.State,
      actions,
      vm: selectedVms,
      viewConfig,
      showModal,
    }),
    isActionsDisabled
  )

  const [
    { title: _unlockTitle, ...unlockAction } = {},
    { title: _lockTitle, ...lockAction } = {},
  ] = disableOptions(
    VirtualMachine.Actions.Utils.generateMenuOptions({
      keys: [VM_ACTION_ENUM.UNLOCK, VM_ACTION_ENUM.LOCK],
      actions,
      vm: selectedVms,
      viewConfig,
      showModal,
    }),
    isActionsDisabled
  )

  const terminateActions = disableOptions(
    VirtualMachine.Actions.Utils.generateMenuOptions({
      keys: [VM_ACTION_ENUM.TERMINATE, VM_ACTION_ENUM.TERMINATE_HARD],
      actions,
      vm: selectedVms,
      viewConfig,
      showModal,
    }),
    isActionsDisabled
  )

  const { allLocked, noneLocked } = aggregateLockState(selectedVms)

  const summary = useMemo(() => {
    const metrics = aggregateMetrics(selectedVms, [
      'TEMPLATE.CPU',
      'TEMPLATE.MEMORY',
    ])

    const totalDisk = selectedVms.reduce(
      (total, vm) =>
        total +
        []
          .concat(vm?.TEMPLATE?.DISK)
          .filter(Boolean)
          .reduce(
            (diskTotal, { SIZE = 0 } = {}) => diskTotal + (+SIZE || 0),
            0
          ),
      0
    )

    return {
      state: getCommonValue(
        selectedVms,
        (vm) => getVirtualMachineState(vm)?.name ?? T.Unknown
      ),
      host: getCommonValue(selectedVms, (vm) => getVmHostname(vm) ?? '-'),
      cpu: metrics?.['TEMPLATE.CPU'] || '-',
      memory: prettyBytes(metrics?.['TEMPLATE.MEMORY'] ?? 0, UNITS.MB),
      disk: prettyBytes(totalDisk, UNITS.MB),
    }
  }, [selectedVms])

  const handleChangePermission = useCallback(
    async (newPermission) =>
      await actions?.[VM_ACTION_ENUM.CHANGE_MODE]?.mutate(newPermission),
    [actions]
  )

  const handleChangeOwnership = useCallback(
    async (newOwnership) =>
      await actions?.[VM_ACTION_ENUM.CHANGE_OWNER]?.mutate(newOwnership),
    [actions]
  )

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedVms?.length} ${T.VirtualMachines} ${T.Selected}`,
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                <MenuButton
                  placeholder={T.VMActions}
                  options={[generalOptions]}
                  compactable
                />

                <MenuButton
                  placeholder={T.VMState}
                  options={[stateOptions]}
                  compactable
                />

                <ButtonGroup
                  selected={allLocked ? ['lock'] : noneLocked ? ['unlock'] : []}
                  buttons={[
                    {
                      value: 'lock',
                      startIcon: <Lock width="16px" height="16px" />,
                      ...lockAction,
                      tooltip: T.Lock,
                    },
                    {
                      value: 'unlock',
                      startIcon: <NoLock width="16px" height="16px" />,
                      ...unlockAction,
                      tooltip: T.Unlock,
                    },
                  ]}
                />

                <ToggleGroup
                  size="medium"
                  options={[
                    [
                      {
                        ...getLabelMenuButtonProps({
                          selectedRows: selectedVms,
                          resourceType: RESOURCE_NAMES.VM,
                          isDisabled: isActionsDisabled,
                        }),
                      },
                    ],
                    [
                      {
                        value: 'delete',
                        iconOnly: (
                          <Trash
                            width="16px"
                            height="16px"
                            style={{
                              color:
                                isActionsDisabled ||
                                !noneLocked ||
                                terminateActions.every(
                                  ({ isDisabled }) => isDisabled
                                )
                                  ? palette.text.disabled
                                  : palette.icon.error,
                            }}
                          />
                        ),
                        options: [terminateActions],
                        placeholder: T.Delete,

                        isDisabled:
                          isActionsDisabled ||
                          !noneLocked ||
                          terminateActions.every(
                            ({ isDisabled }) => isDisabled
                          ),
                      },
                      {
                        value: 'compact-overflow',
                        compactToolbarOverflow: true,
                        isDisabled: isActionsDisabled,
                      },
                      {
                        startIcon: <Cancel width="16px" height="16px" />,
                        onClick: handleClose,
                        value: 'close',
                        tooltip: T.Close,
                      },
                    ],
                  ]}
                />
              </Box>
            ),
          },
        ],
        [
          SummarySlot,
          {
            labels: [
              [summary.state, T.State],
              [summary.host, T.Hostname],
              [summary.cpu, T.CPU],
              [summary.memory, T.Memory],
              [summary.disk, `${T.Disk} ${T.Total}`],
            ]?.filter(([value]) => value !== undefined),
          },
        ],
        [
          TabSlot,
          {
            tabs: VirtualMachine.Tabs.Aggregated,
            resourceId: VirtualMachine.RID,
            tabProps: {
              selected: selectedVmsForTabs,
              handleChangePermission,
              handleChangeOwnership,
              handleSelect,
              handleDeselect,
              isActionsDisabled: isActionsDisabled || isLoadingExtendedVms,
              isLocked: !noneLocked,
            },
          },
          { flex: '1 1 0' },
        ],
      ]}
    />
  )
}

AggregatedView.displayName = 'AggregatedView'

AggregatedView.propTypes = {
  isOpen: PropTypes.bool,
  selectedVms: PropTypes.array,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
  viewConfig: PropTypes.object,
}
