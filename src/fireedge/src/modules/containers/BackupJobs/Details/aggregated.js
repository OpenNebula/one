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
  TabSlot,
} from '@ComponentsV2Module'
import { BackupJobAPI, useModalsApi } from '@FeaturesModule'
import { Component } from 'react'
import { aggregateLockState, createActions } from '@UtilsModule'
import {
  BACKUPJOB_ACTIONS,
  RESOURCE_NAMES,
  STYLE_BUTTONS,
  T,
} from '@ConstantsModule'
import { Box, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import {
  Cancel as CancelIcon,
  Cancel as CloseIcon,
  Lock,
  NoLock,
  Play,
  Trash,
} from 'iconoir-react'
import { BackupJobs as BackupJobsResource } from '@ResourcesModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object[]} root0.selectedData - Selected BackupJobs
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @param {object} root0.availableActions - Available actions
 * @returns {Component} - Aggregated view details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedData = [],
  handleClose,
  handleSelect,
  handleDeselect,
  availableActions = {},
}) => {
  const { showModal } = useModalsApi()
  const { palette } = useTheme()

  const [refresh, { isFetching }] = BackupJobAPI.useLazyGetBackupJobQuery()
  const [lock, { isLoading: isLocking }] =
    BackupJobAPI.useLockBackupJobMutation()
  const [unlock, { isLoading: isUnlocking }] =
    BackupJobAPI.useUnlockBackupJobMutation()
  const [start, { isLoading: isStarting }] =
    BackupJobAPI.useStartBackupJobMutation()
  const [cancel, { isLoading: isCancelling }] =
    BackupJobAPI.useCancelBackupJobMutation()
  const [remove, { isLoading: isRemoving }] =
    BackupJobAPI.useRemoveBackupJobMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    BackupJobAPI.useChangeBackupJobPermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    BackupJobAPI.useChangeBackupJobOwnershipMutation()

  const isMutating =
    isFetching ||
    isLocking ||
    isUnlocking ||
    isStarting ||
    isCancelling ||
    isRemoving ||
    isChangingPermissions ||
    isChangingOwnership

  const handleRefresh = async () =>
    await Promise.all(selectedData.map(({ ID }) => refresh({ id: ID })))

  const handleConfirmAction = ({ title, description, onSubmit }) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title,
        description: (
          <ResourceActionConfirmation
            description={description}
            resources={selectedData}
            resourceType={T.BackupJobs}
          />
        ),
        confirmLabel: `${title}`.startsWith(T.Delete) ? T.Delete : title,
        ...((`${title}`.startsWith(T.Delete) || title === T.Cancel) && {
          confirmButtonProps: {
            isDestructive: true,
          },
        }),
      },
      onSubmit,
    })

  const handleActionForSelected = async (action) => {
    await Promise.all(selectedData.map(({ ID }) => action(ID)))
    await handleRefresh()
  }

  const handleStart = () =>
    handleConfirmAction({
      title: T.Start,
      description: T['resource.start.confirmation'],
      onSubmit: () => handleActionForSelected((id) => start({ id })),
    })

  const handleCancel = () =>
    handleConfirmAction({
      title: T.Cancel,
      description: T['resource.cancel.confirmation'],
      onSubmit: () => handleActionForSelected((id) => cancel({ id })),
    })

  const handleLock = () =>
    handleConfirmAction({
      title: T.Lock,
      description: T['resource.lock.confirmation'],
      onSubmit: () => handleActionForSelected((id) => lock({ id })),
    })

  const handleUnlock = () =>
    handleConfirmAction({
      title: T.Unlock,
      description: T['resource.unlock.confirmation'],
      onSubmit: () => handleActionForSelected((id) => unlock({ id })),
    })

  const handleOpenDeleteForm = () =>
    handleConfirmAction({
      title: `${T.Delete} ${T.BackupJobs}`,
      description: T['resource.delete.confirmation'],
      onSubmit: async () => {
        await Promise.all(selectedData.map(({ ID }) => remove({ id: ID })))
        handleClose()
      },
    })

  const handleChangePermission = async (newPermission) => {
    await Promise.all(
      selectedData.map(({ ID }) =>
        changePermissions({ id: ID, ...newPermission })
      )
    )

    await handleRefresh()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await Promise.all(
      selectedData.map(({ ID }) => changeOwnership({ id: ID, ...newOwnership }))
    )

    await handleRefresh()
  }

  const statusButtons = createActions({
    filters: availableActions,
    actions: [
      {
        accessor: BACKUPJOB_ACTIONS.START,
        startIcon: <Play width="16px" height="16px" />,
        onClick: handleStart,
        value: BACKUPJOB_ACTIONS.START,
        isDisabled: isMutating,
        tooltip: T.Start,
      },
      {
        accessor: BACKUPJOB_ACTIONS.CANCEL,
        startIcon: (
          <CancelIcon
            width="16px"
            height="16px"
            style={{
              color: isMutating ? palette.text.disabled : palette.icon.error,
            }}
          />
        ),
        onClick: handleCancel,
        value: BACKUPJOB_ACTIONS.CANCEL,
        isDisabled: isMutating,
        tooltip: T.Cancel,
        isDestructive: true,
      },
    ],
  })

  const { allLocked, noneLocked } = aggregateLockState(selectedData)

  const lockButtons = createActions({
    filters: availableActions,
    actions: [
      {
        accessor: BACKUPJOB_ACTIONS.LOCK,
        startIcon: <Lock width="16px" height="16px" />,
        onClick: handleLock,
        value: BACKUPJOB_ACTIONS.LOCK,
        isDisabled: isMutating,
        tooltip: T.Lock,
      },
      {
        accessor: BACKUPJOB_ACTIONS.UNLOCK,
        startIcon: <NoLock width="16px" height="16px" />,
        onClick: handleUnlock,
        value: BACKUPJOB_ACTIONS.UNLOCK,
        isDisabled: isMutating,
        tooltip: T.Unlock,
      },
    ],
  })

  const deleteButtons = createActions({
    filters: availableActions,
    actions: [
      {
        accessor: BACKUPJOB_ACTIONS.DELETE,
      },
    ],
  })

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedData?.length} ${T.BackupJobs} ${T.Selected}`,
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                {statusButtons.length > 0 && (
                  <ButtonGroup buttons={statusButtons} />
                )}
                {lockButtons.length > 0 && (
                  <ButtonGroup
                    selected={
                      allLocked
                        ? [BACKUPJOB_ACTIONS.LOCK]
                        : noneLocked
                        ? [BACKUPJOB_ACTIONS.UNLOCK]
                        : []
                    }
                    buttons={lockButtons}
                  />
                )}
                <LabelButton
                  selectedRows={selectedData}
                  resourceType={RESOURCE_NAMES.BACKUPJOBS}
                  isDisabled={isMutating}
                />
                {deleteButtons.length > 0 && (
                  <Button
                    type={STYLE_BUTTONS.TYPE.PRIMARY}
                    size="small"
                    startIcon={<Trash width={'16px'} height={'16px'} />}
                    onClick={handleOpenDeleteForm}
                    isDestructive
                    isDisabled={isMutating}
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
          TabSlot,
          {
            tabs: BackupJobsResource.Tabs.Aggregated,
            resourceId: BackupJobsResource.RID,
            tabProps: {
              selected: selectedData,
              handleChangeOwnership,
              handleChangePermission,
              handleSelect,
              handleDeselect,
              isActionsDisabled: isMutating,
              isLocked: !noneLocked,
              isMutating,
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
  selectedData: PropTypes.array,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
  availableActions: PropTypes.object,
}
