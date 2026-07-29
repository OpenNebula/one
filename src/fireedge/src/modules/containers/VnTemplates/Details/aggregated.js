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
  Button,
  ButtonGroup,
  DetailsDrawer,
  InfoSlot,
  LabelButton,
  ResourceActionConfirmation,
  SummarySlot,
  TabSlot,
} from '@ComponentsV2Module'
import { Box } from '@mui/material'
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Cancel as CloseIcon, Lock, NoLock, Trash } from 'iconoir-react'
import {
  RESOURCE_NAMES,
  STYLE_BUTTONS,
  T,
  VN_TEMPLATE_ACTIONS,
} from '@ConstantsModule'
import { VnTemplateAPI, useModalsApi } from '@FeaturesModule'
import { VnTemplate as Resource } from '@ResourcesModule'
import { aggregateLockState } from '@UtilsModule'

const getAddressRanges = (vnTemplate) =>
  [vnTemplate?.TEMPLATE?.AR ?? []].flat().filter(Boolean)

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object[]} root0.selectedVnTemplates - Selected VN templates
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Aggregated view details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedVnTemplates = [],
  handleClose,
  handleSelect,
  handleDeselect,
  actions = [],
}) => {
  const { showModal } = useModalsApi()

  // API
  const [refreshVnTemplate, { isFetching: isRefreshingVnTemplate }] =
    VnTemplateAPI.useLazyGetVNTemplateQuery()
  const [remove, { isLoading: isRemoving }] =
    VnTemplateAPI.useRemoveVNTemplateMutation()
  const [lock, { isLoading: isLocking }] =
    VnTemplateAPI.useLockVNTemplateMutation()
  const [unlock, { isLoading: isUnlocking }] =
    VnTemplateAPI.useUnlockVNTemplateMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    VnTemplateAPI.useChangeVNTemplatePermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    VnTemplateAPI.useChangeVNTemplateOwnershipMutation()

  // State
  const isMutating =
    isRefreshingVnTemplate ||
    isRemoving ||
    isLocking ||
    isUnlocking ||
    isChangingPermissions ||
    isChangingOwnership

  const hasAction = (action) => !actions?.length || actions.includes(action)
  const canDelete = hasAction(VN_TEMPLATE_ACTIONS.DELETE)
  const canLock = hasAction(VN_TEMPLATE_ACTIONS.LOCK)
  const canUnlock = hasAction(VN_TEMPLATE_ACTIONS.UNLOCK)

  const { allLocked, noneLocked } = aggregateLockState(selectedVnTemplates)

  const driverCount = useMemo(
    () =>
      new Set(
        selectedVnTemplates
          .map(({ TEMPLATE }) => TEMPLATE?.VN_MAD)
          .filter(Boolean)
      ).size,
    [selectedVnTemplates]
  )

  const { addressRangeCount, addressRangeSize } = useMemo(
    () =>
      selectedVnTemplates.reduce(
        (total, vnTemplate) => {
          const addressRanges = getAddressRanges(vnTemplate)

          return {
            addressRangeCount: total.addressRangeCount + addressRanges.length,
            addressRangeSize:
              total.addressRangeSize +
              addressRanges.reduce(
                (sum, addressRange) => sum + Number(addressRange?.SIZE ?? 0),
                0
              ),
          }
        },
        { addressRangeCount: 0, addressRangeSize: 0 }
      ),
    [selectedVnTemplates]
  )

  // Actions
  const handleRefresh = async () =>
    await Promise.all(
      selectedVnTemplates.map(({ ID }) => refreshVnTemplate({ id: ID }))
    )

  const handleLock = async () => {
    await Promise.all(selectedVnTemplates.map(({ ID }) => lock({ id: ID })))
    await handleRefresh()
  }

  const handleUnlock = async () => {
    await Promise.all(selectedVnTemplates.map(({ ID }) => unlock({ id: ID })))
    await handleRefresh()
  }

  const handleChangePermission = async (newPermission) => {
    await Promise.all(
      selectedVnTemplates.map(({ ID }) =>
        changePermissions({ id: ID, ...newPermission })
      )
    )

    await handleRefresh()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await Promise.all(
      selectedVnTemplates.map(({ ID }) =>
        changeOwnership({ id: ID, ...newOwnership })
      )
    )

    await handleRefresh()
  }

  // Modals
  const handleLockForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Lock} ${T.NetworkTemplates}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.lock.confirmation']}
            resources={selectedVnTemplates}
            resourceType={T.NetworkTemplates}
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
        title: `${T.Unlock} ${T.NetworkTemplates}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.unlock.confirmation']}
            resources={selectedVnTemplates}
            resourceType={T.NetworkTemplates}
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
        title: `${T.Delete} ${T.NetworkTemplates}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={selectedVnTemplates}
            resourceType={T.NetworkTemplates}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await Promise.all(
          selectedVnTemplates.map(({ ID }) => remove({ id: ID }))
        )
        handleClose()
      },
    })

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedVnTemplates?.length} ${T.NetworkTemplates} ${T.Selected}`,
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
                    selected={
                      new Set(
                        allLocked ? ['lock'] : noneLocked ? ['unlock'] : []
                      )
                    }
                    buttons={[
                      canLock && {
                        startIcon: <Lock width="16px" height="16px" />,
                        onClick: handleLockForm,
                        value: 'lock',
                        tooltip: T.Lock,
                        isDisabled: isMutating,
                      },
                      canUnlock && {
                        startIcon: <NoLock width="16px" height="16px" />,
                        onClick: handleUnlockForm,
                        value: 'unlock',
                        tooltip: T.Unlock,
                        isDisabled: isMutating,
                      },
                    ].filter(Boolean)}
                  />
                )}

                <LabelButton
                  selectedRows={selectedVnTemplates}
                  resourceType={RESOURCE_NAMES.VN_TEMPLATE}
                  isDisabled={isMutating}
                />
                {canDelete && (
                  <Button
                    type={STYLE_BUTTONS.TYPE.PRIMARY}
                    size="small"
                    startIcon={<Trash width={'16px'} height={'16px'} />}
                    onClick={handleDeleteForm}
                    isDestructive
                    isDisabled={!noneLocked || isMutating}
                  >
                    {T.DeleteSelected}
                  </Button>
                )}

                <Button
                  type={STYLE_BUTTONS.TYPE.TRANSPARENT}
                  size="small"
                  iconOnly={<CloseIcon width={'16px'} height={'16px'} />}
                  onClick={handleClose}
                />
              </Box>
            ),
          },
        ],
        [
          SummarySlot,
          {
            labels: [
              [selectedVnTemplates?.length, T.Selected],
              [driverCount || '-', T.Driver],
              [addressRangeCount, T.AddressRange],
              [addressRangeSize, T.TotalIPs],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: Resource.Tabs.Aggregated,
            resourceId: Resource.RID,
            tabProps: {
              selected: selectedVnTemplates,
              handleChangePermission,
              handleChangeOwnership,
              handleSelect,
              handleDeselect,
              isActionsDisabled: isMutating,
              isLocked: !noneLocked,
            },
          },
        ],
      ]}
    />
  )
}

AggregatedView.displayName = 'AggregatedView'

AggregatedView.propTypes = {
  isOpen: PropTypes.bool,
  selectedVnTemplates: PropTypes.array,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
  actions: PropTypes.array,
}
