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
  TabSlot,
  ToggleGroup,
} from '@ComponentsV2Module'
import { unset } from 'lodash'
import { Box, useTheme } from '@mui/material'
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  Cancel as CancelIcon,
  Lock,
  NoLock,
  Play,
  RefreshDouble,
  Trash,
  Cancel,
} from 'iconoir-react'
import { BACKUPJOB_ACTIONS, RESOURCE_NAMES, T } from '@ConstantsModule'
import { cloneObject, createActions, jsonToXml, set } from '@UtilsModule'
import { BackupJobAPI, useModalsApi } from '@FeaturesModule'
import { BackupJobs as BackupJobsResource } from '@ResourcesModule'
import {
  getBackupJobLastBackupTime,
  getBackupJobVisibleAttributes,
  getLabelTags,
} from '@ModelsModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object} root0.selectedData - Selected BackupJob
 * @param {object} root0.availableActions - Available actions
 * @param {Function} root0.handleClose - Handle close
 * @returns {Component} - Single view details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedData = {},
  handleClose,
  availableActions = {},
}) => {
  const { palette } = useTheme()
  const { showModal } = useModalsApi()

  const [refresh, { data: refreshedData = {}, isFetching }] =
    BackupJobAPI.useLazyGetBackupJobQuery()
  const [lock, { isLoading: isLocking }] =
    BackupJobAPI.useLockBackupJobMutation()
  const [unlock, { isLoading: isUnlocking }] =
    BackupJobAPI.useUnlockBackupJobMutation()
  const [start, { isLoading: isStarting }] =
    BackupJobAPI.useStartBackupJobMutation()
  const [cancel, { isLoading: isCancelling }] =
    BackupJobAPI.useCancelBackupJobMutation()
  const [deleteBackupJob, { isLoading: isDeleting }] =
    BackupJobAPI.useRemoveBackupJobMutation()
  const [rename, { isLoading: isRenaming }] =
    BackupJobAPI.useRenameBackupJobMutation()
  const [update, { isLoading: isUpdating }] =
    BackupJobAPI.useUpdateBackupJobMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    BackupJobAPI.useChangeBackupJobPermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    BackupJobAPI.useChangeBackupJobOwnershipMutation()

  const data =
    String(refreshedData?.ID) === String(selectedData?.ID)
      ? refreshedData
      : selectedData
  const { ID, LAST_BACKUP_TIME, PRIORITY, TEMPLATE } = data

  const backupJobIsLocked = data?.LOCK != null

  const isActionsDisabled =
    ID === undefined ||
    isFetching ||
    isLocking ||
    isUnlocking ||
    isStarting ||
    isCancelling ||
    isDeleting ||
    isRenaming ||
    isUpdating ||
    isChangingPermissions ||
    isChangingOwnership

  const handleRefresh = () => ID !== undefined && refresh({ id: ID })

  const refreshCurrentData = async () =>
    ID !== undefined && (await refresh({ id: ID }))

  const handleConfirmAction = ({ title, description, onSubmit }) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title,
        description: (
          <ResourceActionConfirmation
            description={description}
            resources={data}
            resourceType={T.BackupJobs}
          />
        ),
        confirmLabel: title,
        ...([T.Delete, T.Cancel].includes(title) && {
          confirmButtonProps: {
            isDestructive: true,
          },
        }),
      },
      onSubmit,
    })

  const handleRename = async (newName) => {
    await rename({ id: ID, name: newName })
    await refreshCurrentData()
  }

  const handleStart = () =>
    handleConfirmAction({
      title: T.Start,
      description: T['resource.start.confirmation'],
      onSubmit: async () => {
        await start({ id: ID })
        await refreshCurrentData()
      },
    })

  const handleCancel = () =>
    handleConfirmAction({
      title: T.Cancel,
      description: T['resource.cancel.confirmation'],
      onSubmit: async () => {
        await cancel({ id: ID })
        await refreshCurrentData()
      },
    })

  const handleLock = () =>
    handleConfirmAction({
      title: T.Lock,
      description: T['resource.lock.confirmation'],
      onSubmit: async () => {
        await lock({ id: ID })
        await refreshCurrentData()
      },
    })

  const handleUnlock = () =>
    handleConfirmAction({
      title: T.Unlock,
      description: T['resource.unlock.confirmation'],
      onSubmit: async () => {
        await unlock({ id: ID })
        await refreshCurrentData()
      },
    })

  const handleDelete = () =>
    handleConfirmAction({
      title: T.Delete,
      description: T['resource.delete.confirmation'],
      onSubmit: async () => {
        await deleteBackupJob({ id: ID })
        handleClose()
      },
    })

  const handleChangePermission = async (newPermission) => {
    await changePermissions({ id: ID, ...newPermission })
    await refreshCurrentData()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await changeOwnership({ id: ID, ...newOwnership })
    await refreshCurrentData()
  }

  const attributes = useMemo(
    () => getBackupJobVisibleAttributes(data?.TEMPLATE),
    [data]
  )

  const handleDeleteAttribute = async (index, attribute) => {
    const attributeKey = attribute?.path ?? attributes?.[index]?.key

    if (!attributeKey) return

    const newTemplate = cloneObject(TEMPLATE)
    unset(newTemplate, attributeKey)

    await update({
      id: ID,
      replace: 0,
      template: jsonToXml(newTemplate),
    })
    await refreshCurrentData()
  }

  const getAttributePayload = (attribute, newValue) =>
    typeof attribute === 'string'
      ? { key: attribute, value: newValue }
      : attribute ?? {}

  const handleAttributeInXml = async (attribute, newValue) => {
    const { key, path, value } = getAttributePayload(attribute, newValue)
    const attributePath = path ?? key

    if (!attributePath) return

    const newTemplate = cloneObject(TEMPLATE)
    set(newTemplate, attributePath, value)

    await update({
      id: ID,
      replace: 1,
      template: jsonToXml(newTemplate),
    })
    await refreshCurrentData()
  }

  const statusButtons = createActions({
    filters: availableActions,
    actions: [
      {
        accessor: BACKUPJOB_ACTIONS.START,
        startIcon: <Play width="16px" height="16px" />,
        onClick: handleStart,
        value: BACKUPJOB_ACTIONS.START,
        isDisabled: isActionsDisabled,
        tooltip: T.Start,
      },
      {
        accessor: BACKUPJOB_ACTIONS.CANCEL,
        startIcon: (
          <CancelIcon
            width="16px"
            height="16px"
            style={{
              color: isActionsDisabled
                ? palette.text.disabled
                : palette.icon.error,
            }}
          />
        ),
        onClick: handleCancel,
        value: BACKUPJOB_ACTIONS.CANCEL,
        isDisabled: isActionsDisabled,
        tooltip: T.Cancel,
        isDestructive: true,
      },
    ],
  })

  const lockButtons = createActions({
    filters: availableActions,
    actions: [
      {
        accessor: BACKUPJOB_ACTIONS.LOCK,
        startIcon: <Lock width="16px" height="16px" />,
        onClick: handleLock,
        value: BACKUPJOB_ACTIONS.LOCK,
        isDisabled: isActionsDisabled,
        tooltip: T.Lock,
      },
      {
        accessor: BACKUPJOB_ACTIONS.UNLOCK,
        startIcon: <NoLock width="16px" height="16px" />,
        onClick: handleUnlock,
        value: BACKUPJOB_ACTIONS.UNLOCK,
        isDisabled: isActionsDisabled,
        tooltip: T.Unlock,
      },
    ],
  })

  const toggleOptions = [
    [
      {
        ...getLabelMenuButtonProps({
          selectedRows: [data],
          resourceType: RESOURCE_NAMES.BACKUPJOBS,
          isDisabled: isActionsDisabled,
        }),
      },
      {
        startIcon: <RefreshDouble width="16px" height="16px" />,
        onClick: handleRefresh,
        value: 'refresh',
        tooltip: T.Refresh,
        isDisabled: isActionsDisabled,
      },
    ],
    [
      ...createActions({
        filters: availableActions,
        actions: [
          {
            accessor: BACKUPJOB_ACTIONS.DELETE,
            startIcon: (
              <Trash
                width="16px"
                height="16px"
                style={{
                  color: isActionsDisabled
                    ? palette.text.disabled
                    : palette.icon.error,
                }}
              />
            ),
            onClick: handleDelete,
            value: BACKUPJOB_ACTIONS.DELETE,
            title: T.Delete,
            isDestructive: true,
            isDisabled: isActionsDisabled,
          },
        ],
      }),
      {
        startIcon: <Cancel width="16px" height="16px" />,
        onClick: handleClose,
        value: 'close',
        tooltip: T.Close,
      },
    ],
  ].filter(({ length }) => length > 0)

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            isTitleEditable: true,
            onTitleChange: handleRename,
            isTitleEditDisabled: isRenaming,

            title: data?.NAME,
            id: ID,
            labels: [
              [T.Owner, data?.UNAME],
              [T.Group, data?.GNAME],
            ],
            tags: getLabelTags(data?.LABELS),
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
                    selected={[
                      backupJobIsLocked
                        ? BACKUPJOB_ACTIONS.LOCK
                        : BACKUPJOB_ACTIONS.UNLOCK,
                    ]}
                    buttons={lockButtons}
                  />
                )}
                <ToggleGroup size="medium" options={toggleOptions} />
              </Box>
            ),
          },
        ],
        [
          SummarySlot,
          {
            labels: [
              [PRIORITY ?? '-', T.Priority],
              [
                getBackupJobLastBackupTime(LAST_BACKUP_TIME),
                T.LastBackupTimeInfo,
              ],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: BackupJobsResource.Tabs.Single,
            resourceId: BackupJobsResource.RID,
            tabProps: {
              attributes,
              selected: data,
              isLoadingData: isFetching || isUpdating,
              handleChangeOwnership,
              handleChangePermission,
              handleDeleteAttribute,
              handleAddAttribute: handleAttributeInXml,
              handleEditAttribute: handleAttributeInXml,
              availableActions,
              isActionsDisabled,
              isLocked: backupJobIsLocked,
            },
          },
        ],
      ]}
    />
  )
}

SingleView.displayName = 'SingleView'

SingleView.propTypes = {
  isOpen: PropTypes.bool,
  selectedData: PropTypes.object,
  availableActions: PropTypes.object,
  handleClose: PropTypes.func,
}
