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
  ResourceActionConfirmation,
  SummarySlot,
  TabSlot,
  ButtonGroup,
  Button,
} from '@ComponentsV2Module'

import { ImageAPI, useModalsApi } from '@FeaturesModule'
import { Component, useMemo } from 'react'

import { aggregateLockState, createActions, prettyBytes } from '@UtilsModule'
import { aggregateImageEnabledState, getBackupRunningVms } from '@ModelsModule'

import { IMAGE_ACTIONS, STYLE_BUTTONS, T } from '@ConstantsModule'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Cancel as CloseIcon, OffTag, OnTag, Trash } from 'iconoir-react'
import { Files as FilesResource } from '@ResourcesModule'

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
  const [enable, { isLoading: isEnabling }] = ImageAPI.useEnableImageMutation()
  const [disable, { isLoading: isDisabling }] =
    ImageAPI.useDisableImageMutation()
  const [remove, { isLoading: isRemoving }] = ImageAPI.useRemoveImageMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    ImageAPI.useChangeImagePermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    ImageAPI.useChangeImageOwnershipMutation()

  const isMutating =
    isFetching ||
    isEnabling ||
    isDisabling ||
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
            resourceType={T.Files}
          />
        ),
        confirmLabel: `${title}`.startsWith(T.Delete) ? T.Delete : title,
        ...(`${title}`.startsWith(T.Delete) && {
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

  const handleEnable = () =>
    handleConfirmAction({
      title: T.Enable,
      description: T['resource.enable.confirmation'],
      onSubmit: () => handleActionForSelected((id) => enable(id)),
    })

  const handleDisable = () =>
    handleConfirmAction({
      title: T.Disable,
      description: T['resource.disable.confirmation'],
      onSubmit: () => handleActionForSelected((id) => disable(id)),
    })

  const handleOpenDeleteForm = () =>
    handleConfirmAction({
      title: `${T.Delete} ${T.Files}`,
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

  const deleteButtons = createActions({
    filters: availableActions,
    actions: [
      {
        accessor: IMAGE_ACTIONS.DELETE,
      },
    ],
  })

  const { noneLocked } = aggregateLockState(selectedData)
  const { allEnabled, allDisabled } = aggregateImageEnabledState(selectedData)
  const totals = useMemo(
    () =>
      selectedData.reduce(
        (summary, file) => ({
          size: summary.size + getValidNumber(file?.SIZE),
          vms: summary.vms + getValidNumber(getBackupRunningVms(file)),
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
            title: `${selectedData?.length} ${T.Files} ${T.Selected}`,
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
            tabs: FilesResource.Tabs.Aggregated,
            resourceId: FilesResource.RID,
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
