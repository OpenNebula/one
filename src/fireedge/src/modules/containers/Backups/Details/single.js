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
  InfoSlot,
  ResourceActionConfirmation,
  SummarySlot,
  StatusTag,
  TabSlot,
  Tag,
  ToggleGroup,
} from '@ComponentsV2Module'
import { unset } from 'lodash'

import { Box, useTheme } from '@mui/material'
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  RefreshCircular,
  RefreshDouble,
  Trash,
  Cancel,
  Lock,
  NoLock,
} from 'iconoir-react'
import { IMAGE_ACTIONS, T } from '@ConstantsModule'
import { cloneObject, createActions, jsonToXml, set } from '@UtilsModule'
import { ImageAPI, useModalsApi } from '@FeaturesModule'
import { Backups as BackupsResource } from '@ResourcesModule'
import {
  getBackupDiskIds,
  getBackupIncrements,
  getBackupRestoreOptions,
  getBackupVmIds,
  getImageState,
  getImageTypeLabel,
  getLabelTags,
} from '@ModelsModule'

const getRestoreFormConfig = (backup = {}) => {
  const increments = getBackupIncrements(backup)
  const backupDiskIds = getBackupDiskIds(backup)
  const vmsId = getBackupVmIds(backup)

  return {
    steps: BackupsResource.Forms.RestoreForm,
    stepProps: {
      increments,
      backupDiskIds,
      vmsId,
      disableImageSelection: true,
    },
    initialValues: {
      increments,
      backupDiskIds,
    },
  }
}

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object} root0.selectedData - Selected backup
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

  const [lock, { isLoading: isLocking }] = ImageAPI.useLockImageMutation()
  const [unlock, { isLoading: isUnlocking }] = ImageAPI.useUnlockImageMutation()
  const [refresh, { data: refreshedData = {}, isFetching }] =
    ImageAPI.useLazyGetImageQuery()
  const [restore, { isLoading: isRestoring }] =
    ImageAPI.useRestoreBackupMutation()
  const [deleteImage, { isLoading: isDeleting }] =
    ImageAPI.useRemoveImageMutation()
  const [rename, { isLoading: isRenaming }] = ImageAPI.useRenameImageMutation()
  const [update, { isLoading: isUpdatingImage }] =
    ImageAPI.useUpdateImageMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    ImageAPI.useChangeImagePermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    ImageAPI.useChangeImageOwnershipMutation()

  const data =
    String(refreshedData?.ID) === String(selectedData?.ID)
      ? refreshedData
      : selectedData
  const { ID, TEMPLATE } = data

  const type = useMemo(() => getImageTypeLabel(data), [data])
  const { color: stateColor, name: stateName } = useMemo(
    () => getImageState(data) ?? {},
    [data]
  )
  const { DATASTORE, PERSISTENT, UNAME, GNAME } = data

  const backupIsLocked = data?.LOCK != null

  const isActionsDisabled =
    ID === undefined ||
    isFetching ||
    isLocking ||
    isUnlocking ||
    isRestoring ||
    isDeleting ||
    isRenaming ||
    isUpdatingImage ||
    isChangingPermissions ||
    isChangingOwnership

  const handleRefresh = () => ID !== undefined && refresh({ id: ID })

  const refreshCurrentData = async () =>
    ID !== undefined && (await refresh({ id: ID }))

  const getResourceConfirmation = (description) => (
    <ResourceActionConfirmation
      description={description}
      resources={data}
      resourceType={T.Backups}
    />
  )

  const handleConfirmAction = ({
    title,
    description,
    confirmLabel,
    confirmButtonProps,
    onSubmit,
  }) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title,
        description,
        confirmLabel,
        confirmButtonProps,
      },
      onSubmit,
    })

  const handleRename = async (newName) => {
    await rename({ id: ID, name: newName })
    await refreshCurrentData()
  }

  const handleRestore = () =>
    showModal({
      isFormDialog: true,
      name: T.Restore,
      dialogProps: {
        title: T.RestoreBackup,
        dataCy: 'modal-restore-backup',
        ...getRestoreFormConfig(data),
      },
      onSubmit: async (formData) => {
        await restore({
          id: ID,
          datastore: formData.datastore,
          options: getBackupRestoreOptions(formData),
        })
        await refreshCurrentData()
      },
    })

  const handleLock = () =>
    handleConfirmAction({
      title: `${T.Lock} ${T.Backup}`,
      description: getResourceConfirmation(T['resource.lock.confirmation']),
      confirmLabel: T.Lock,
      onSubmit: async () => {
        await lock({ id: ID })
        await refreshCurrentData()
      },
    })

  const handleUnlock = () =>
    handleConfirmAction({
      title: `${T.Unlock} ${T.Backup}`,
      description: getResourceConfirmation(T['resource.unlock.confirmation']),
      confirmLabel: T.Unlock,
      onSubmit: async () => {
        await unlock({ id: ID })
        await refreshCurrentData()
      },
    })

  const handleDelete = () =>
    handleConfirmAction({
      title: `${T.Delete} ${T.Backup}`,
      description: getResourceConfirmation(T['resource.delete.confirmation']),
      confirmLabel: T.Delete,
      confirmButtonProps: {
        isDestructive: true,
      },
      onSubmit: async () => {
        await deleteImage({ id: ID })
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
    () =>
      Object.entries(data?.TEMPLATE ?? {})?.map(([key, value]) => ({
        key,
        value,
      })),
    [data]
  )

  const handleDeleteAttribute = async (index, attribute) => {
    const attributeKey = attribute?.path ?? attributes?.[index]?.key

    if (!attributeKey) return

    const newAttributes = cloneObject(TEMPLATE)
    unset(newAttributes, attributeKey)

    await update({
      id: ID,
      replace: 0,
      template: jsonToXml(newAttributes),
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
      template: jsonToXml(newTemplate),
      replace: 1,
    })
    await refreshCurrentData()
  }

  const lockButtons = createActions({
    filters: availableActions,
    actions: [
      {
        accessor: IMAGE_ACTIONS.LOCK,
        startIcon: <Lock width="16px" height="16px" />,
        onClick: handleLock,
        value: IMAGE_ACTIONS.LOCK,
        isDisabled: isActionsDisabled,
        tooltip: T.Lock,
      },
      {
        accessor: IMAGE_ACTIONS.UNLOCK,
        startIcon: <NoLock width="16px" height="16px" />,
        onClick: handleUnlock,
        value: IMAGE_ACTIONS.UNLOCK,
        isDisabled: isActionsDisabled,
        tooltip: T.Unlock,
      },
    ],
  })

  const toggleOptions = [
    [
      ...createActions({
        filters: availableActions,
        actions: [
          {
            accessor: IMAGE_ACTIONS.RESTORE,
            startIcon: <RefreshCircular width="16px" height="16px" />,
            onClick: handleRestore,
            value: IMAGE_ACTIONS.RESTORE,
            tooltip: T.Restore,
            isDisabled: isActionsDisabled,
          },
        ],
      }),
    ],
    [
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
            accessor: IMAGE_ACTIONS.DELETE,
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
            value: IMAGE_ACTIONS.DELETE,
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
              [T.Owner, UNAME],
              [T.Group, GNAME],
              [T.Datastore, DATASTORE],
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
                {lockButtons.length > 0 && (
                  <ButtonGroup
                    selected={[
                      backupIsLocked
                        ? IMAGE_ACTIONS.LOCK
                        : IMAGE_ACTIONS.UNLOCK,
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
              [
                <StatusTag
                  key="state"
                  statusColor={stateColor}
                  statusName={stateName ?? '-'}
                />,
                T.State,
              ],
              [
                type ? <Tag key="type" title={type} status="default" /> : '-',
                T.Type,
              ],
              [DATASTORE ?? '-', T.Datastore],
              [+PERSISTENT ? T.Yes : T.No, T.Persistent],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: BackupsResource.Tabs.Single,
            resourceId: BackupsResource.RID,
            tabProps: {
              attributes,
              selected: data,
              isLoadingData: isFetching || isUpdatingImage,
              handleChangeOwnership,
              handleChangePermission,
              handleDeleteAttribute,
              handleAddAttribute: handleAttributeInXml,
              handleEditAttribute: handleAttributeInXml,
              isActionsDisabled,
              isLocked: backupIsLocked,
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
