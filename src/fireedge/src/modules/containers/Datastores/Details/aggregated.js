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
  LabelButton,
  ResourceActionConfirmation,
  SummarySlot,
  TabSlot,
  ButtonGroup,
  Button,
} from '@ComponentsV2Module'

import { useModalsApi, DatastoreAPI } from '@FeaturesModule'
import { Component, useMemo } from 'react'
import { createActions } from '@UtilsModule'
import {
  T,
  STYLE_BUTTONS,
  DATASTORE_ACTIONS,
  RESOURCE_NAMES,
} from '@ConstantsModule'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Trash, OnTag, OffTag, Cancel as CloseIcon } from 'iconoir-react'
import {
  aggregateDatastoreEnabledState,
  getDatastoreCapacityInfo,
} from '@ModelsModule'
import { Datastore } from '@ResourcesModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object[]} root0.selectedData - Selected datastores
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @param {object} root0.availableActions - Available actions
 * @returns {Component} - Aggregated datastores details drawer
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

  const [refresh, { isFetching }] = DatastoreAPI.useLazyGetDatastoreQuery()
  const [remove, { isLoading: isRemoving }] =
    DatastoreAPI.useRemoveDatastoreMutation()
  const [enable, { isLoading: isEnabling }] =
    DatastoreAPI.useEnableDatastoreMutation()
  const [disable, { isLoading: isDisabling }] =
    DatastoreAPI.useDisableDatastoreMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    DatastoreAPI.useChangeDatastorePermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    DatastoreAPI.useChangeDatastoreOwnershipMutation()

  const handleRefresh = async () =>
    await Promise.all(selectedData.map(({ ID }) => refresh({ id: ID })))

  const handleEnable = async () => {
    await Promise.all(selectedData.map(({ ID }) => enable(ID)))
    await handleRefresh()
  }

  const handleDisable = async () => {
    await Promise.all(selectedData.map(({ ID }) => disable(ID)))
    await handleRefresh()
  }

  const handleOpenDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Delete} ${T.Datastores}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={selectedData}
            resourceType={T.Datastores}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
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

  const isMutating =
    isFetching ||
    isRemoving ||
    isEnabling ||
    isDisabling ||
    isChangingPermissions ||
    isChangingOwnership

  const statusButtons = createActions({
    filters: availableActions,
    actions: [
      {
        accessor: DATASTORE_ACTIONS.ENABLE,
        startIcon: <OnTag width="16px" height="16px" />,
        onClick: handleEnable,
        value: DATASTORE_ACTIONS.ENABLE,
        isDisabled: isMutating,
        tooltip: T.Enable,
      },
      {
        accessor: DATASTORE_ACTIONS.DISABLE,
        startIcon: <OffTag width="16px" height="16px" />,
        onClick: handleDisable,
        value: DATASTORE_ACTIONS.DISABLE,
        isDisabled: isMutating,
        tooltip: T.Disable,
      },
    ],
  })

  const { allEnabled, allDisabled } =
    aggregateDatastoreEnabledState(selectedData)
  const deleteButtons = createActions({
    filters: availableActions,
    actions: [
      {
        accessor: DATASTORE_ACTIONS.DELETE,
      },
    ],
  })

  const aggregatedCapacity = useMemo(
    () =>
      selectedData.reduce(
        (summary, { TOTAL_MB, USED_MB }) => ({
          TOTAL_MB: summary.TOTAL_MB + Number(TOTAL_MB ?? 0),
          USED_MB: summary.USED_MB + Number(USED_MB ?? 0),
        }),
        { TOTAL_MB: 0, USED_MB: 0 }
      ),
    [selectedData]
  )

  const capacity = useMemo(
    () => getDatastoreCapacityInfo(aggregatedCapacity),
    [aggregatedCapacity]
  )

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedData?.length} ${T.Datastores} ${T.Selected}`,
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
                        ? [DATASTORE_ACTIONS.ENABLE]
                        : allDisabled
                        ? [DATASTORE_ACTIONS.DISABLE]
                        : []
                    }
                    buttons={statusButtons}
                  />
                )}

                <LabelButton
                  selectedRows={selectedData}
                  resourceType={RESOURCE_NAMES.DATASTORE}
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
          SummarySlot,
          {
            labels: [[capacity.percentLabel, T.Capacity]],
          },
        ],
        [
          TabSlot,
          {
            tabs: Datastore.Tabs.Aggregated,
            resourceId: Datastore.RID,
            tabProps: {
              selected: selectedData,
              handleChangeOwnership,
              handleChangePermission,
              handleSelect,
              handleDeselect,
              isActionsDisabled: isMutating,
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
