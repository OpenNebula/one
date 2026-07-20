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
  DetailsDrawer,
  InfoSlot,
  SummarySlot,
  TabSlot,
  ToggleGroup,
  ButtonGroup,
  Button,
  MenuButton,
  SkeletonLoading,
  StatusTag,
  TagList,
  Tooltip,
  AlertNotification,
  getLabelMenuButtonProps,
} from '@ComponentsV2Module'
import {
  useModalsApi,
  VmAPI,
  ClusterAPI,
  ImageAPI,
  useGeneral,
} from '@FeaturesModule'
import { useClipboard } from '@HooksModule'
import { Component, useMemo } from 'react'
import {
  PATH,
  RESOURCE_NAMES,
  T,
  UNITS,
  VM_ACTION_ENUM,
} from '@ConstantsModule'
import { useHistory } from 'react-router-dom'
import { Box, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import {
  Lock,
  NoLock,
  RefreshDouble,
  Cancel,
  Trash,
  Play,
  Cart,
  SaveFloppyDisk,
  Check as CopiedIcon,
  Copy as CopyIcon,
} from 'iconoir-react'
import {
  getBackupList,
  getIpAddresses,
  getVirtualMachineState,
  getVmHostname,
  getVmClusterId,
  getLabelTags,
} from '@ModelsModule'

import { prettyBytes, jsonToXml } from '@UtilsModule'
import { VirtualMachine } from '@ResourcesModule'

const VmErrorAlert = ({ message, isDismissible, onDismiss }) => (
  <AlertNotification
    type="primary"
    status="error"
    description={String(message)}
    isDismissible={isDismissible}
    onDismiss={onDismiss}
    style={{ width: '100%', boxSizing: 'border-box' }}
  />
)

VmErrorAlert.propTypes = {
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isDismissible: PropTypes.bool,
  onDismiss: PropTypes.func,
}

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object} root0.selectedVm - Selected VM group
 * @param {Function} root0.handleClose - Handle close
 * @param {object} root0.viewConfig - View config
 * @returns {Component} - Single view details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedVm = {},
  handleClose,
  viewConfig = {},
}) => {
  const { zone, defaultZone } = useGeneral()
  const { copy, isCopied } = useClipboard()
  const history = useHistory()
  const vmId = selectedVm?.ID
  const hostName = getVmHostname(selectedVm)
  const { palette, scale } = useTheme()
  const { showModal } = useModalsApi()
  const {
    data: extendedVmData,
    isFetching: isLoadingExtended,
    refetch: refreshVm,
  } = VmAPI.useGetVmQuery(
    { id: vmId, extended: true },
    {
      skip: !vmId,
      refetchOnMountOrArgChange: true,
    }
  )
  const vmData = extendedVmData ?? selectedVm
  const vmState = getVirtualMachineState(vmData)
  const vmIps = getIpAddresses(vmData)
  const vmLabelTags = useMemo(() => getLabelTags(vmData?.LABELS), [vmData])
  const clusterId = getVmClusterId(vmData)
  const clusterIdNumber = Number(clusterId)
  const hasClusterId = Number.isInteger(clusterIdNumber) && clusterIdNumber >= 0
  const vmBackupIds = useMemo(() => getBackupList(vmData), [vmData])
  const {
    data: backupPool = [],
    isFetching: isFetchingBackups,
    refetch: refreshBackups,
  } = ImageAPI.useGetBackupsQuery(undefined, { skip: !vmId })
  const backups = useMemo(
    () =>
      backupPool
        ?.filter(({ ID } = {}) => vmBackupIds?.includes(ID))
        ?.filter(Boolean) ?? [],
    [backupPool, vmBackupIds]
  )

  const { actions, isLoading: isPerformingAction } =
    VirtualMachine.Actions.useActions({
      context:
        (fn) =>
        (params = {}) =>
          fn?.({ id: vmId, ...params }),
    })

  const generalOptions = VirtualMachine.Actions.Utils.generateMenuOptions({
    keys: VirtualMachine.Actions.Groups.General,
    actions,
    vm: selectedVm,
    formContext: vmData,
    viewConfig,
    showModal,
  })

  const stateOptions = VirtualMachine.Actions.Utils.generateMenuOptions({
    keys: VirtualMachine.Actions.Groups.State,
    actions,
    vm: selectedVm,
    viewConfig,
    showModal,
  })

  const [saveAsTemplateAction, createAppAction] =
    VirtualMachine.Actions.Utils.generateMenuOptions({
      keys: [VM_ACTION_ENUM.SAVE_AS_TEMPLATE, VM_ACTION_ENUM.CREATE_APP_DIALOG],
      actions,
      vm: selectedVm,
      formContext: vmData,
      viewConfig,
      showModal,
    })

  const [
    { title: _unlockTitle, ...unlockAction },
    { title: _lockTitle, ...lockAction },
  ] = VirtualMachine.Actions.Utils.generateMenuOptions({
    keys: [VM_ACTION_ENUM.UNLOCK, VM_ACTION_ENUM.LOCK],
    actions,
    vm: selectedVm,
    viewConfig,
    showModal,
  })

  const terminateActions = VirtualMachine.Actions.Utils.generateMenuOptions({
    keys: [VM_ACTION_ENUM.TERMINATE, VM_ACTION_ENUM.TERMINATE_HARD],
    actions,
    vm: selectedVm,
    viewConfig,
    showModal: (modalProps) =>
      showModal({
        ...modalProps,
        onSubmit: async (...args) => {
          handleClose?.()
          await modalProps?.onSubmit?.(...args)
        },
      }),
  })

  const consoleOptions = useMemo(
    () =>
      VirtualMachine.Actions.Utils.generateConsoleOptions({
        vm: selectedVm,
        viewConfig,
        zone,
        defaultZone,
      }),
    [selectedVm, viewConfig, zone, defaultZone]
  )

  const {
    [VM_ACTION_ENUM.RESUME]: resumeAction,
    [VM_ACTION_ENUM.RENAME]: renameAction,
    [VM_ACTION_ENUM.UPDATE_USER_TEMPLATE]: updateUserTemplateAction,
    [VM_ACTION_ENUM.CHANGE_MODE]: changePermissionsAction,
    [VM_ACTION_ENUM.CHANGE_OWNER]: changeOwnerAction,
  } = actions

  const { data: clusterName } = ClusterAPI.useGetClusterQuery(
    { id: clusterId, extended: true },
    {
      skip: !vmId || !hasClusterId,
      refetchOnMountOrArgChange: true,
      selectFromResult: ({ data }) => ({ data: data?.NAME ?? '-' }),
    }
  )

  const handleRename = async (newName) => {
    await renameAction?.mutate({ name: newName })
  }

  const handleResume = async () => {
    await resumeAction?.mutate()
  }

  const handleCreateApp = () => {
    history.push(PATH.STORAGE.MARKETPLACE_APPS.CREATE, [
      RESOURCE_NAMES.VM,
      vmData,
    ])
  }

  const handleChangePermission = async (newPermission) => {
    await changePermissionsAction.mutate({ ...newPermission })
  }

  const handleChangeOwnership = async (newOwnership) => {
    await changeOwnerAction.mutate({ ...newOwnership })
  }

  const attributes = useMemo(
    () =>
      Object.entries(extendedVmData?.USER_TEMPLATE ?? {})?.map(
        ([key, value]) => ({
          key,
          value,
        })
      ),
    [extendedVmData]
  )

  const handleDeleteAttribute = async (index) => {
    const newAttributes = Object.fromEntries(
      attributes
        ?.filter((_, idx) => index !== idx)
        ?.map(({ key, value }) => [key, value])
    )

    await updateUserTemplateAction.mutate({
      replace: 0,
      template: jsonToXml(newAttributes),
    })
  }

  const handleAddAttribute = async (newEntry) => {
    const newAttributes = Object.fromEntries(
      [newEntry]?.concat(attributes)?.map(({ key, value }) => [key, value])
    )

    await updateUserTemplateAction.mutate({
      replace: 1,
      template: jsonToXml(newAttributes),
    })
  }

  const userTemplate =
    extendedVmData?.USER_TEMPLATE ?? selectedVm?.USER_TEMPLATE ?? {}
  const vmError = userTemplate?.ERROR

  const handleDismissVmError = async () => {
    if (!vmId || !vmError) return false

    const templateWithoutError = { ...userTemplate }
    delete templateWithoutError.ERROR

    const result = await updateUserTemplateAction.mutate({
      replace: 0,
      template: jsonToXml(templateWithoutError),
    })

    if (result?.error) return false

    await refreshVm()
  }

  const handleRefresh = async () => {
    await Promise.all([
      refreshVm(),
      vmId && refreshBackups ? refreshBackups() : undefined,
    ])
  }

  const vmIsLocked = Object.hasOwn(selectedVm, 'LOCK')

  const isActionsDisabled = isPerformingAction || isLoadingExtended

  return (
    <DetailsDrawer
      isOpen={isOpen}
      isLoading={isLoadingExtended}
      slots={[
        [
          InfoSlot,
          {
            isTitleEditable: true,
            onTitleChange: handleRename,
            isTitleEditDisabled: isPerformingAction,
            title: selectedVm?.NAME,
            id: vmId,
            labels: [
              [T.Owner, selectedVm?.UNAME],
              [T.Group, selectedVm?.GNAME],
              [T.Host, hostName],
            ],
            tags: vmLabelTags,
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                <SkeletonLoading
                  loading={isLoadingExtended}
                  width={112}
                  height={scale[700]}
                  borderRadius="xlg"
                >
                  {vmState?.name === 'RUNNING' ? (
                    <MenuButton
                      placeholder={T.Console}
                      options={[consoleOptions]}
                      compactable
                    />
                  ) : (
                    <Tooltip title={T.Resume}>
                      <span>
                        <Button
                          startIcon={<Play />}
                          title={T.Resume}
                          onClick={handleResume}
                          isDisabled={isActionsDisabled}
                          compactable
                        />
                      </span>
                    </Tooltip>
                  )}
                </SkeletonLoading>

                <MenuButton
                  placeholder={T.VMActions}
                  options={[generalOptions]}
                  compactable
                />

                <MenuButton placeholder={T.VMState} options={[stateOptions]} />

                <ButtonGroup
                  selected={[vmIsLocked ? 'lock' : 'unlock']}
                  buttons={[
                    {
                      value: 'lock',
                      startIcon: <Lock width="16px" height="16px" />,
                      isDisabled: isActionsDisabled,
                      ...lockAction,
                      tooltip: T.Lock,
                    },
                    {
                      value: 'unlock',
                      startIcon: <NoLock width="16px" height="16px" />,
                      isDisabled: isActionsDisabled,
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
                        startIcon: (
                          <SaveFloppyDisk width="16px" height="16px" />
                        ),
                        onClick: saveAsTemplateAction?.onClick,
                        value: 'save-as-template',
                        tooltip: T.SaveAsTemplate,
                        isDisabled:
                          isActionsDisabled || saveAsTemplateAction?.isDisabled,
                        compactable: true,
                      },
                      {
                        startIcon: <Cart width="16px" height="16px" />,
                        onClick: handleCreateApp,
                        value: 'create-app',
                        tooltip: T.CreateApp,
                        isDisabled:
                          isActionsDisabled || createAppAction?.isDisabled,
                        compactable: true,
                      },
                    ],
                    [
                      {
                        ...getLabelMenuButtonProps({
                          selectedRows: [selectedVm],
                          resourceType: RESOURCE_NAMES.VM,
                          isDisabled: !vmId || isActionsDisabled,
                        }),
                        compactable: true,
                      },
                      {
                        startIcon: <RefreshDouble width="16px" height="16px" />,
                        onClick: handleRefresh,
                        value: 'refresh',
                        tooltip: T.Refresh,
                        isDisabled: isActionsDisabled,
                        compactable: true,
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
                                vmIsLocked || isActionsDisabled
                                  ? palette.text.disabled
                                  : palette.icon.error,
                            }}
                          />
                        ),
                        options: [terminateActions],
                        placeholder: T.Delete,
                        isDisabled: vmIsLocked || isActionsDisabled,
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
              [
                <StatusTag
                  key="state"
                  statusColor={vmState?.color}
                  statusName={vmState?.name ?? T.Unknown}
                />,
                T.State,
              ],
              [
                vmIps.length ? (
                  <TagList
                    key="ips"
                    max={1}
                    tags={vmIps.map((ip) => ({
                      title: ip,
                      endIcon: isCopied(ip) ? <CopiedIcon /> : <CopyIcon />,
                      onClick: () => copy(ip),
                    }))}
                  />
                ) : (
                  '-'
                ),
                T.ip,
              ],
              [hostName ?? T.Unknown, T.Hostname],
              [
                `${selectedVm?.TEMPLATE?.CPU || '-'}/${
                  selectedVm?.TEMPLATE?.VCPU || selectedVm?.TEMPLATE?.CPU || '-'
                }`,
                `${T.CPU}/${T.VCPU}`,
              ],

              [
                prettyBytes(selectedVm?.TEMPLATE?.MEMORY ?? 0, UNITS.MB),
                T.Memory,
              ],

              [
                prettyBytes(
                  []
                    .concat(selectedVm?.TEMPLATE?.DISK)
                    ?.reduce((acc, { SIZE = 0 } = {}) => acc + SIZE, 0),
                  UNITS.MB
                ),
                `${T.Disk} ${T.Total}`,
              ],
            ]?.filter(([value]) => value != null),
          },
        ],
        ...(vmError
          ? [
              [
                VmErrorAlert,
                {
                  message: vmError,
                  isDismissible: !isActionsDisabled,
                  onDismiss: handleDismissVmError,
                },
                { overflowY: 'visible' },
              ],
            ]
          : []),
        [
          TabSlot,
          {
            tabs: VirtualMachine.Tabs,
            resourceId: VirtualMachine.RID,
            tabProps: {
              selectedVm,
              extendedVmData,
              clusterName,
              attributes,
              backups,
              isFetchingBackups,
              isLoadingExtended,
              handleChangeOwnership,
              handleChangePermission,
              handleDeleteAttribute,
              handleAddAttribute,
              vmIsLocked,
              isActionsDisabled,
            },
          },
          { flex: '1 1 0' },
        ],
      ]}
    />
  )
}

SingleView.displayName = 'SingleView'

SingleView.propTypes = {
  isOpen: PropTypes.bool,
  selectedVm: PropTypes.object,
  handleClose: PropTypes.func,
  actions: PropTypes.array,
  states: PropTypes.array,
  viewConfig: PropTypes.object,
}
