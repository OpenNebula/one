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
  getLabelMenuButtonProps,
  ResourceActionConfirmation,
  SummarySlot,
  TabSlot,
  ButtonGroup,
  ToggleGroup,
} from '@ComponentsV2Module'

import { ImageAPI, useModalsApi } from '@FeaturesModule'
import { Component, useMemo } from 'react'
import { aggregateLockState, createActions, prettyBytes } from '@UtilsModule'
import {
  aggregateImageEnabledState,
  aggregateImagePersistenceState,
  getBackupRunningVms,
} from '@ModelsModule'
import { IMAGE_ACTIONS, RESOURCE_NAMES, T } from '@ConstantsModule'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import {
  Cancel as CloseIcon,
  Hourglass as NonPersistentIcon,
  Infinite as PersistentIcon,
  KeyframesCouple as CloneIcon,
  Lock,
  NoLock,
  OffTag,
  OnTag,
  Trash,
} from 'iconoir-react'
import { Image as ImageResource } from '@ResourcesModule'

const getValidNumber = (value) => {
  const number = Number(value)

  return Number.isFinite(number) && number > 0 ? number : 0
}

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object[]} root0.selectedData - Selected images
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

  const [refresh, { isFetching }] = ImageAPI.useLazyGetImageQuery()
  const [clone, { isLoading: isCloning }] = ImageAPI.useCloneImageMutation()
  const [lock, { isLoading: isLocking }] = ImageAPI.useLockImageMutation()
  const [unlock, { isLoading: isUnlocking }] = ImageAPI.useUnlockImageMutation()
  const [enable, { isLoading: isEnabling }] = ImageAPI.useEnableImageMutation()
  const [disable, { isLoading: isDisabling }] =
    ImageAPI.useDisableImageMutation()
  const [persistent, { isLoading: isPersisting }] =
    ImageAPI.usePersistentImageMutation()
  const [remove, { isLoading: isRemoving }] = ImageAPI.useRemoveImageMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    ImageAPI.useChangeImagePermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    ImageAPI.useChangeImageOwnershipMutation()

  const isMutating =
    isFetching ||
    isCloning ||
    isLocking ||
    isUnlocking ||
    isEnabling ||
    isDisabling ||
    isPersisting ||
    isRemoving ||
    isChangingPermissions ||
    isChangingOwnership

  const handleRefresh = async () =>
    await Promise.all(selectedData.map(({ ID }) => refresh({ id: ID })))

  const getResourceConfirmation = (description) => (
    <ResourceActionConfirmation
      description={description}
      resources={selectedData}
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

  const handleActionForSelected = async (action) => {
    await Promise.all(selectedData.map(({ ID }) => action(ID)))
    await handleRefresh()
  }

  const handleEnable = () =>
    handleConfirmAction({
      title: `${T.Enable} ${T.Images}`,
      description: getResourceConfirmation(T['resource.enable.confirmation']),
      confirmLabel: T.Enable,
      onSubmit: () => handleActionForSelected((id) => enable(id)),
    })

  const handleDisable = () =>
    handleConfirmAction({
      title: `${T.Disable} ${T.Images}`,
      description: getResourceConfirmation(T['resource.disable.confirmation']),
      confirmLabel: T.Disable,
      onSubmit: () => handleActionForSelected((id) => disable(id)),
    })

  const handleLock = () =>
    handleConfirmAction({
      title: `${T.Lock} ${T.Images}`,
      description: getResourceConfirmation(T['resource.lock.confirmation']),
      confirmLabel: T.Lock,
      onSubmit: () => handleActionForSelected((id) => lock({ id })),
    })

  const handleUnlock = () =>
    handleConfirmAction({
      title: `${T.Unlock} ${T.Images}`,
      description: getResourceConfirmation(T['resource.unlock.confirmation']),
      confirmLabel: T.Unlock,
      onSubmit: () => handleActionForSelected((id) => unlock({ id })),
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
      onSubmit: () =>
        handleActionForSelected((id) =>
          persistent({ id, persistent: isPersistent })
        ),
    })

  const handleCloneImageForm = () =>
    showModal({
      isFormDialog: true,
      dialogProps: {
        title: T.Clone,
        dataCy: 'modal-clone-image',
        steps: ImageResource.Forms.CloneForm,
        stepProps: { isMultiple: selectedData.length > 1 },
        initialValues: { name: `Copy of ${selectedData?.[0]?.NAME ?? ''}` },
      },
      onSubmit: async ({ prefix, name, datastore } = {}) => {
        const images = selectedData.map(({ ID, NAME }) => ({
          id: ID,
          name: prefix ? `${prefix} ${NAME}` : name,
          datastore,
        }))

        await Promise.all(images.map(clone))
        await handleRefresh()
      },
    })

  const handleOpenDeleteForm = () =>
    handleConfirmAction({
      title: `${T.Delete} ${T.Images}`,
      description: getResourceConfirmation(T['resource.delete.confirmation']),
      confirmLabel: T.Delete,
      confirmButtonProps: {
        isDestructive: true,
      },
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
        accessor: IMAGE_ACTIONS.ENABLE,
        startIcon: <OnTag width="16px" height="16px" />,
        onClick: handleEnable,
        value: IMAGE_ACTIONS.ENABLE,
        isDisabled: isMutating,
        tooltip: T.Enable,
      },
      {
        accessor: IMAGE_ACTIONS.DISABLE,
        startIcon: <OffTag width="16px" height="16px" />,
        onClick: handleDisable,
        value: IMAGE_ACTIONS.DISABLE,
        isDisabled: isMutating,
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
        isDisabled: isMutating,
        tooltip: T.Lock,
      },
      {
        accessor: IMAGE_ACTIONS.UNLOCK,
        startIcon: <NoLock width="16px" height="16px" />,
        onClick: handleUnlock,
        value: IMAGE_ACTIONS.UNLOCK,
        isDisabled: isMutating,
        tooltip: T.Unlock,
      },
    ],
  })

  const persistenceButtons = createActions({
    filters: availableActions,
    actions: [
      {
        accessor: IMAGE_ACTIONS.PERSISTENT,
        startIcon: <PersistentIcon width="16px" height="16px" />,
        onClick: () => handlePersistent(true),
        value: IMAGE_ACTIONS.PERSISTENT,
        isDisabled: isMutating,
        tooltip: T.Persistent,
      },
      {
        accessor: IMAGE_ACTIONS.NON_PERSISTENT,
        startIcon: <NonPersistentIcon width="16px" height="16px" />,
        onClick: () => handlePersistent(false),
        value: IMAGE_ACTIONS.NON_PERSISTENT,
        isDisabled: isMutating,
        tooltip: T.NonPersistent,
      },
    ],
  })

  const cloneButtons = createActions({
    filters: availableActions,
    actions: [
      {
        accessor: IMAGE_ACTIONS.CLONE,
        startIcon: <CloneIcon width="16px" height="16px" />,
        onClick: handleCloneImageForm,
        value: IMAGE_ACTIONS.CLONE,
        tooltip: T.Clone,
        isDisabled: isMutating,
      },
    ],
  })

  const deleteButtons = createActions({
    filters: availableActions,
    actions: [
      {
        accessor: IMAGE_ACTIONS.DELETE,
      },
    ],
  })

  const { allLocked, noneLocked } = aggregateLockState(selectedData)
  const { allEnabled, allDisabled } = aggregateImageEnabledState(selectedData)
  const { allPersistent, nonePersistent } =
    aggregateImagePersistenceState(selectedData)
  const totals = useMemo(
    () =>
      selectedData.reduce(
        (summary, image) => ({
          size: summary.size + getValidNumber(image?.SIZE),
          vms: summary.vms + getValidNumber(getBackupRunningVms(image)),
        }),
        { size: 0, vms: 0 }
      ),
    [selectedData]
  )

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedData?.length} ${T.Images} ${T.Selected}`,
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
                    selected={
                      allEnabled
                        ? [IMAGE_ACTIONS.ENABLE]
                        : allDisabled
                        ? [IMAGE_ACTIONS.DISABLE]
                        : []
                    }
                    buttons={statusButtons}
                  />
                )}

                {lockButtons.length > 0 && (
                  <ButtonGroup
                    selected={
                      allLocked
                        ? [IMAGE_ACTIONS.LOCK]
                        : noneLocked
                        ? [IMAGE_ACTIONS.UNLOCK]
                        : []
                    }
                    buttons={lockButtons}
                  />
                )}

                {persistenceButtons.length > 0 && (
                  <ButtonGroup
                    selected={
                      allPersistent
                        ? [IMAGE_ACTIONS.PERSISTENT]
                        : nonePersistent
                        ? [IMAGE_ACTIONS.NON_PERSISTENT]
                        : []
                    }
                    buttons={persistenceButtons}
                  />
                )}

                <ToggleGroup
                  size="medium"
                  options={[
                    cloneButtons,
                    [
                      {
                        ...getLabelMenuButtonProps({
                          selectedRows: selectedData,
                          resourceType: RESOURCE_NAMES.IMAGE,
                          isDisabled: isMutating,
                        }),
                      },
                    ],
                    [
                      deleteButtons.length > 0 && {
                        startIcon: <Trash width="16px" height="16px" />,
                        onClick: handleOpenDeleteForm,
                        value: IMAGE_ACTIONS.DELETE,
                        tooltip: T.Delete,
                        isDisabled: !noneLocked || isMutating,
                        sx: (theme) => ({
                          color:
                            !noneLocked || isMutating
                              ? theme.palette.text.disabled
                              : theme.palette.icon.error,
                        }),
                      },
                      {
                        startIcon: <CloseIcon width="16px" height="16px" />,
                        onClick: handleClose,
                        value: 'close',
                        tooltip: T.Close,
                      },
                    ].filter(Boolean),
                  ].filter(({ length }) => length > 0)}
                />
              </Box>
            ),
          },
        ],
        [
          SummarySlot,
          {
            labels: [
              [prettyBytes(totals.size, 'MB'), T.TotalSize],
              [totals.vms, T.VMs],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: ImageResource.Tabs.Aggregated,
            resourceId: ImageResource.RID,
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
