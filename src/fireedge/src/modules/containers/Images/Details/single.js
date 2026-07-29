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
import { unset } from 'lodash'
import { getImageState, getLabelTags } from '@ModelsModule'

import { Box, useTheme } from '@mui/material'
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  Cancel as CloseIcon,
  RefreshDouble,
  Trash,
  OnTag,
  OffTag,
  Lock,
  NoLock,
  KeyframesCouple as CloneIcon,
  Infinite as PersistentIcon,
  Hourglass as NonPersistentIcon,
} from 'iconoir-react'
import { IMAGE_ACTIONS, RESOURCE_NAMES, T } from '@ConstantsModule'
import {
  cloneObject,
  createActions,
  getImageTypeLabel,
  jsonToXml,
  set,
} from '@UtilsModule'
import { ImageAPI, useModalsApi } from '@FeaturesModule'
import { Image as ImageResource } from '@ResourcesModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object} root0.selectedData - Selected image
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
    ImageAPI.useLazyGetImageQuery()

  const [clone, { isLoading: isCloning }] = ImageAPI.useCloneImageMutation()
  const [lock, { isLoading: isLocking }] = ImageAPI.useLockImageMutation()
  const [unlock, { isLoading: isUnlocking }] = ImageAPI.useUnlockImageMutation()
  const [enable, { isLoading: isEnabling }] = ImageAPI.useEnableImageMutation()
  const [disable, { isLoading: isDisabling }] =
    ImageAPI.useDisableImageMutation()
  const [persistent, { isLoading: isPersisting }] =
    ImageAPI.usePersistentImageMutation()
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

  const { color: stateColor, name: stateName } = useMemo(
    () => getImageState(data) ?? {},
    [data]
  )
  const type = useMemo(() => getImageTypeLabel(data), [data])
  const { DATASTORE, PERSISTENT, UNAME, GNAME } = data

  const imageIsLocked = data?.LOCK
  const imagePersistent = data?.PERSISTENT === '1'
  const imageDisabled = data?.STATE === '3'

  const isActionsDisabled =
    ID === undefined ||
    isFetching ||
    isCloning ||
    isLocking ||
    isUnlocking ||
    isEnabling ||
    isDisabling ||
    isPersisting ||
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
      resourceType={T.Images}
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

  const handleCloneImageForm = () =>
    showModal({
      isFormDialog: true,
      dialogProps: {
        title: T.Clone,
        dataCy: 'modal-clone-image',
        steps: ImageResource.Forms.CloneForm,
        stepProps: { isMultiple: false },
        initialValues: { name: `Copy of ${data?.NAME ?? ''}` },
      },
      onSubmit: async ({ prefix, name, datastore } = {}) => {
        await clone({
          id: ID,
          name: prefix ? `${prefix} ${data?.NAME}` : name,
          datastore,
        })
        await refreshCurrentData()
      },
    })

  const handleRename = async (newName) => {
    await rename({ id: ID, name: newName })
    await refreshCurrentData()
  }

  const handleEnable = () =>
    handleConfirmAction({
      title: `${T.Enable} ${T.Image}`,
      description: getResourceConfirmation(T['resource.enable.confirmation']),
      confirmLabel: T.Enable,
      onSubmit: async () => {
        await enable(ID)
        await refreshCurrentData()
      },
    })

  const handleDisable = () =>
    handleConfirmAction({
      title: `${T.Disable} ${T.Image}`,
      description: getResourceConfirmation(T['resource.disable.confirmation']),
      confirmLabel: T.Disable,
      onSubmit: async () => {
        await disable(ID)
        await refreshCurrentData()
      },
    })

  const handleLock = () =>
    handleConfirmAction({
      title: `${T.Lock} ${T.Image}`,
      description: getResourceConfirmation(T['resource.lock.confirmation']),
      confirmLabel: T.Lock,
      onSubmit: async () => {
        await lock({ id: ID })
        await refreshCurrentData()
      },
    })

  const handleUnlock = () =>
    handleConfirmAction({
      title: `${T.Unlock} ${T.Image}`,
      description: getResourceConfirmation(T['resource.unlock.confirmation']),
      confirmLabel: T.Unlock,
      onSubmit: async () => {
        await unlock({ id: ID })
        await refreshCurrentData()
      },
    })

  const handleDelete = () =>
    handleConfirmAction({
      title: `${T.Delete} ${T.Image}`,
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

  const handlePersistent = (isPersistent = true) =>
    handleConfirmAction({
      title: isPersistent ? T.Persistent : T.NonPersistent,
      description: getResourceConfirmation(
        isPersistent
          ? T['resource.persistent.confirmation']
          : T['resource.nonPersistent.confirmation']
      ),
      confirmLabel: isPersistent ? T.Persistent : T.NonPersistent,
      onSubmit: async () => {
        await persistent({ id: ID, persistent: isPersistent })
        await refreshCurrentData()
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
      Object.entries(data?.TEMPLATE ?? {})
        ?.filter(([key]) => key !== 'SERIAL')
        ?.map(([key, value]) => ({
          key,
          value,
        })),
    [data]
  )

  const handleDeleteAttribute = async (index, attribute) => {
    try {
      const newAttributes = cloneObject(TEMPLATE)
      const attributeKey = attribute?.path ?? attributes?.[index]?.key

      if (!attributeKey) return
      unset(newAttributes, attributeKey)

      await update({
        id: ID,
        replace: 0,
        template: jsonToXml(newAttributes),
      })
      await refreshCurrentData()
    } catch (error) {
      console.error('Error deleting attribute:', error)
    }
  }

  const getAttributePayload = (attribute, newValue) =>
    typeof attribute === 'string'
      ? { key: attribute, value: newValue }
      : attribute ?? {}

  const handleAttributeInXml = async (attribute, newValue) => {
    const { key, path, value } = getAttributePayload(attribute, newValue)
    const attributePath = path ?? key

    if (!attributePath) return

    const newAttributes = cloneObject(TEMPLATE)
    set(newAttributes, attributePath, value)

    await update({
      id: ID,
      replace: 1,
      template: jsonToXml(newAttributes),
    })
    await refreshCurrentData()
  }

  const statusButtons = createActions({
    filters: availableActions,
    actions: [
      {
        accessor: IMAGE_ACTIONS.ENABLE,
        startIcon: <OnTag width="16px" height="16px" />,
        onClick: handleEnable,
        value: IMAGE_ACTIONS.ENABLE,
        isDisabled: isActionsDisabled,
        tooltip: T.Enable,
      },
      {
        accessor: IMAGE_ACTIONS.DISABLE,
        startIcon: <OffTag width="16px" height="16px" />,
        onClick: handleDisable,
        value: IMAGE_ACTIONS.DISABLE,
        isDisabled: isActionsDisabled,
        tooltip: T.Disable,
      },
    ],
  })

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

  const persistentButtons = createActions({
    filters: availableActions,
    actions: [
      {
        accessor: IMAGE_ACTIONS.PERSISTENT,
        startIcon: <PersistentIcon width="16px" height="16px" />,
        value: IMAGE_ACTIONS.PERSISTENT,
        onClick: () => handlePersistent(true),
        tooltip: T.Persistent,
        isDisabled: isActionsDisabled,
      },
      {
        accessor: IMAGE_ACTIONS.NON_PERSISTENT,
        startIcon: <NonPersistentIcon width="16px" height="16px" />,
        value: IMAGE_ACTIONS.NON_PERSISTENT,
        onClick: () => handlePersistent(false),
        tooltip: T.NonPersistent,
        isDisabled: isActionsDisabled,
      },
    ],
  })

  const toggleOptions = [
    [
      ...createActions({
        filters: availableActions,
        actions: [
          {
            accessor: IMAGE_ACTIONS.CLONE,
            startIcon: <CloneIcon width="16px" height="16px" />,
            onClick: handleCloneImageForm,
            value: IMAGE_ACTIONS.CLONE,
            tooltip: T.Clone,
            isDisabled: isActionsDisabled,
          },
        ],
      }),
    ],
    [
      {
        ...getLabelMenuButtonProps({
          selectedRows: [data],
          resourceType: RESOURCE_NAMES.IMAGE,
          isDisabled: isActionsDisabled,
        }),
      },
      {
        startIcon: <RefreshDouble width="16px" height="16px" />,
        onClick: handleRefresh,
        value: 'refresh',
        title: T.Refresh,
        isDisabled: isActionsDisabled,
        tooltip: T.Refresh,
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
            tooltip: T.Delete,
            isDestructive: true,
            isDisabled: isActionsDisabled,
          },
        ],
      }),
      {
        startIcon: <CloseIcon width="16px" height="16px" />,
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
                {statusButtons.length > 0 && (
                  <ButtonGroup
                    selected={[
                      imageDisabled
                        ? IMAGE_ACTIONS.DISABLE
                        : IMAGE_ACTIONS.ENABLE,
                    ]}
                    buttons={statusButtons}
                  />
                )}
                {lockButtons.length > 0 && (
                  <ButtonGroup
                    selected={[
                      imageIsLocked ? IMAGE_ACTIONS.LOCK : IMAGE_ACTIONS.UNLOCK,
                    ]}
                    buttons={lockButtons}
                  />
                )}
                {persistentButtons.length > 0 && (
                  <ButtonGroup
                    selected={[
                      imagePersistent
                        ? IMAGE_ACTIONS.PERSISTENT
                        : IMAGE_ACTIONS.NON_PERSISTENT,
                    ]}
                    buttons={persistentButtons}
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
            tabs: ImageResource.Tabs.Single,
            resourceId: ImageResource.RID,
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
              isLocked: imageIsLocked,
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
