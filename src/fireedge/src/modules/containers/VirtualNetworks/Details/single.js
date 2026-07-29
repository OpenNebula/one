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
  ResourceActionConfirmation,
  SummarySlot,
  StatusTag,
  TabSlot,
  Tag,
  ToggleGroup,
} from '@ComponentsV2Module'
import { Box, useTheme } from '@mui/material'
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  AddSquare,
  Cancel,
  Edit,
  Lock,
  NoLock,
  RefreshDouble,
  Trash,
} from 'iconoir-react'
import { PATH, RESOURCE_NAMES, T, VN_ACTIONS } from '@ConstantsModule'
import { VnAPI, useModalsApi, useViews } from '@FeaturesModule'
import {
  getLabelTags,
  getLeasesInfo,
  getTotalSecurityGroups,
  getVirtualNetworkState,
  isVnAvailableAction,
} from '@ModelsModule'
import { getActionsAvailable, jsonToXml } from '@UtilsModule'
import { VirtualNetwork } from '@ResourcesModule'
import { useHistory } from 'react-router'

const HIDDEN_ATTRIBUTES_REG = new RegExp(
  '^(ERROR|SECURITY_GROUPS|CLUSTER|PARENT_NETWORK_ID|' +
    'VN_MAD|PHYDEV|BRIDGE|BRIDGE_TYPE|' +
    'VLAN_ID|VLAN_ID_AUTOMATIC|OUTER_VLAN_ID|OUTER_VLAN_ID_AUTOMATIC|' +
    'INBOUND_AVG_BW|INBOUND_PEAK_BW|INBOUND_PEAK_KB|' +
    'OUTBOUND_AVG_BW|OUTBOUND_PEAK_BW|OUTBOUND_PEAK_KB)$'
)

const templateToAttributes = (template = {}) =>
  Object.entries(template)
    .filter(([key]) => !key.match(HIDDEN_ATTRIBUTES_REG))
    .map(([key, value]) => ({
      key,
      rawValue: value,
      value: value && typeof value === 'object' ? JSON.stringify(value) : value,
    }))

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object} root0.selectedVNet - Selected Virtual Network
 * @param {Function} root0.handleClose - Handle close
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Single view details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedVNet = {},
  handleClose,
  actions = [],
}) => {
  const { palette } = useTheme()
  const { getResourceView } = useViews()
  const { showModal } = useModalsApi()
  const openReserveForm = VirtualNetwork.Forms.useReserveFormModal()
  const history = useHistory()

  // API
  const { data: fetchedVNet = {}, isFetching: isLoadingVNet } =
    VnAPI.useGetVNetworkQuery(
      { id: selectedVNet?.ID },
      {
        skip: !selectedVNet?.ID,
        refetchOnMountOrArgChange: true,
      }
    )

  const [refreshVNet, { isFetching: isRefreshingVNet }] =
    VnAPI.useLazyGetVNetworkQuery()
  const [rename, { isLoading: isRenaming }] = VnAPI.useRenameVNetMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    VnAPI.useChangeVNetOwnershipMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    VnAPI.useChangeVNetPermissionsMutation()
  const [update, { isLoading: isUpdating }] = VnAPI.useUpdateVNetMutation()
  const [remove, { isLoading: isRemoving }] = VnAPI.useRemoveVNetMutation()
  const [lock, { isLoading: isLocking }] = VnAPI.useLockVNetMutation()
  const [unlock, { isLoading: isUnlocking }] = VnAPI.useUnlockVNetMutation()
  const [reserve, { isLoading: isReserving }] =
    VnAPI.useReserveAddressMutation()

  // State
  const vnet =
    String(fetchedVNet?.ID) === String(selectedVNet?.ID)
      ? fetchedVNet
      : selectedVNet

  const infoActions = getResourceView(RESOURCE_NAMES.VNET)?.['info-tabs']?.info
    ?.information_panel?.actions
  const canRename = getActionsAvailable(infoActions).includes(VN_ACTIONS.RENAME)
  const hasAction = (action) => !actions?.length || actions.includes(action)
  const canDelete = hasAction(VN_ACTIONS.DELETE)
  const canLock = hasAction(VN_ACTIONS.LOCK)
  const canUnlock = hasAction(VN_ACTIONS.UNLOCK)
  const canUpdate = hasAction(VN_ACTIONS.UPDATE_DIALOG)
  const canReserve = hasAction(VN_ACTIONS.RESERVE_DIALOG)

  const attributes = useMemo(
    () => templateToAttributes(vnet?.TEMPLATE),
    [vnet?.TEMPLATE]
  )

  const isActionsDisabled =
    isLoadingVNet ||
    isRefreshingVNet ||
    isRenaming ||
    isChangingOwnership ||
    isChangingPermissions ||
    isUpdating ||
    isRemoving ||
    isLocking ||
    isUnlocking ||
    isReserving

  const isLocked = !!vnet?.LOCK
  const isDeleteDisabled =
    isActionsDisabled ||
    isLocked ||
    !isVnAvailableAction(VN_ACTIONS.DELETE, vnet) ||
    !canDelete

  const { color: stateColor, name: stateName } =
    getVirtualNetworkState(vnet) ?? {}
  const { percentLabel } = getLeasesInfo(vnet)
  const addressRanges = [vnet?.AR_POOL?.AR ?? []].flat().length || 0
  const securityGroups = getTotalSecurityGroups(vnet)

  // Actions
  const handleRefresh = async () =>
    vnet?.ID && (await refreshVNet({ id: vnet.ID }))

  const handleLock = async () => {
    await lock({ id: vnet?.ID })
    await handleRefresh()
  }

  const handleUnlock = async () => {
    await unlock({ id: vnet?.ID })
    await handleRefresh()
  }

  const handleRename = async (newName) => {
    await rename({ id: vnet?.ID, name: newName })
    await handleRefresh()
  }

  const handleChangePermission = async (newPermission) => {
    await changePermissions({ id: vnet?.ID, ...newPermission })
    await handleRefresh()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await changeOwnership({ id: vnet?.ID, ...newOwnership })
    await handleRefresh()
  }

  const handleDeleteAttribute = async (index) => {
    const nextTemplate = { ...(vnet?.TEMPLATE ?? {}) }
    const key = attributes[index]?.key

    key && delete nextTemplate[key]
    await updateTemplate(nextTemplate)
  }

  const handleAddAttribute = async ({ key, rawValue, value }) => {
    await updateTemplate({
      ...(vnet?.TEMPLATE ?? {}),
      [key]: rawValue ?? value,
    })
  }

  // Modals
  const handleReserveForm = () =>
    openReserveForm({
      title: T.ReservationFromVirtualNetwork,
      stepProps: { vnet },
      onSubmit: async (template) => {
        await reserve({ id: vnet?.ID, template })
        await handleRefresh()
      },
    })

  const handleLockForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        dataCy: 'modal-lock',
        title: `${T.Lock} ${T.VirtualNetwork}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.lock.confirmation']}
            resources={vnet}
            resourceType={T.VirtualNetworks}
          />
        ),
        confirmLabel: T.Lock,
      },
      onSubmit: handleLock,
    })

  const handleUnlockForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        dataCy: 'modal-unlock',
        title: `${T.Unlock} ${T.VirtualNetwork}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.unlock.confirmation']}
            resources={vnet}
            resourceType={T.VirtualNetworks}
          />
        ),
        confirmLabel: T.Unlock,
      },
      onSubmit: handleUnlock,
    })

  const handleDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        dataCy: 'modal-vnet-delete',
        title: `${T.Delete} ${T.VirtualNetwork}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={vnet}
            resourceType={T.VirtualNetworks}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await remove({ id: vnet?.ID })
        handleClose()
      },
    })

  // Helpers
  const handleUpdate = () => {
    history.push(PATH.NETWORK.VNETS.UPDATE, vnet)
  }

  const updateTemplate = async (nextTemplate) => {
    await update({
      id: vnet?.ID,
      template: jsonToXml(nextTemplate),
      replace: 0,
    })
    await handleRefresh()
  }

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            isTitleEditable: canRename,
            onTitleChange: handleRename,
            isTitleEditDisabled: isActionsDisabled,
            title: vnet?.NAME,
            id: vnet?.ID,
            tags: getLabelTags(vnet?.LABELS),
            dataCy: 'vnet-info',
            labels: [
              [T.Owner, vnet?.UNAME],
              [T.Group, vnet?.GNAME],
            ],
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                {(canLock || canUnlock) && (
                  <ButtonGroup
                    selected={isLocked ? ['lock'] : ['unlock']}
                    buttons={[
                      canLock && {
                        startIcon: <Lock width="16px" height="16px" />,
                        onClick: handleLockForm,
                        value: 'lock',
                        dataCy: 'action-vnet-lock',
                        tooltip: T.Lock,
                        isDisabled: isActionsDisabled,
                      },
                      canUnlock && {
                        startIcon: <NoLock width="16px" height="16px" />,
                        onClick: handleUnlockForm,
                        value: 'unlock',
                        dataCy: 'action-vnet-unlock',
                        tooltip: T.Unlock,
                        isDisabled: isActionsDisabled,
                      },
                    ].filter(Boolean)}
                  />
                )}
                <ToggleGroup
                  size="medium"
                  options={[
                    [
                      canReserve && {
                        startIcon: <AddSquare width="16px" height="16px" />,
                        onClick: handleReserveForm,
                        value: 'reserve',
                        'data-cy': 'action-vnet-reserve_dialog',
                        tooltip: T.Reserve,
                        isDisabled: isActionsDisabled || isLocked,
                      },
                    ].filter(Boolean),
                    [
                      {
                        ...getLabelMenuButtonProps({
                          selectedRows: [vnet],
                          resourceType: RESOURCE_NAMES.VNET,
                          isDisabled: isActionsDisabled,
                        }),
                      },
                      canUpdate && {
                        startIcon: <Edit width="16px" height="16px" />,
                        onClick: handleUpdate,
                        value: 'update',
                        'data-cy': 'action-vnet-update_dialog',
                        tooltip: T.Update,
                        isDisabled: isActionsDisabled || isLocked,
                      },
                      {
                        startIcon: <RefreshDouble width="16px" height="16px" />,
                        onClick: handleRefresh,
                        value: 'refresh',
                        'data-cy': 'action-vnet-refresh',
                        tooltip: T.Refresh,
                        isDisabled: isActionsDisabled,
                      },
                    ].filter(Boolean),
                    [
                      canDelete && {
                        startIcon: (
                          <Trash
                            width="16px"
                            height="16px"
                            style={{
                              color: isDeleteDisabled
                                ? palette.text.disabled
                                : palette.icon.error,
                            }}
                          />
                        ),
                        onClick: handleDeleteForm,
                        value: 'delete',
                        'data-cy': 'action-vnet-delete',
                        tooltip: T.Delete,
                        isDestructive: true,
                        isDisabled: isDeleteDisabled,
                      },
                      {
                        startIcon: <Cancel width="16px" height="16px" />,
                        onClick: handleClose,
                        value: 'close',
                        'data-cy': 'action-vnet-close',
                        tooltip: T.Close,
                      },
                    ].filter(Boolean),
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
                  statusColor={stateColor}
                  statusName={stateName}
                />,
                T.State,
              ],
              [
                vnet?.VN_MAD ? (
                  <Tag key="driver" title={vnet.VN_MAD} status="default" />
                ) : (
                  '-'
                ),
                T.Driver,
              ],
              [addressRanges, T.AddressRanges],
              [percentLabel, T.Leases],
              [securityGroups, T.SecurityGroups],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: VirtualNetwork.Tabs.Single,
            resourceId: VirtualNetwork.RID,
            tabProps: {
              vnet,
              attributes,
              handleChangePermission,
              handleChangeOwnership,
              handleDeleteAttribute,
              handleAddAttribute,
              handleRefresh,
              actions,
              isLoadingVNet,
              isActionsDisabled,
              isLocked,
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
  selectedVNet: PropTypes.object,
  handleClose: PropTypes.func,
  actions: PropTypes.array,
}
