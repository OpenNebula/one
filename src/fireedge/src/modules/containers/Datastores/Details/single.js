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

import {
  getDatastoreType,
  getDatastoreState,
  getLabelTags,
} from '@ModelsModule'

import { Box, useTheme } from '@mui/material'
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  Network,
  RefreshDouble,
  Trash,
  OnTag,
  OffTag,
  Edit,
  Cancel,
} from 'iconoir-react'
import { DATASTORE_ACTIONS, T, PATH, RESOURCE_NAMES } from '@ConstantsModule'
import { createActions, jsonToXml, cloneObject, set } from '@UtilsModule'
import { ClusterAPI, DatastoreAPI, useModalsApi } from '@FeaturesModule'
import { Cluster, Datastore } from '@ResourcesModule'
import { useHistory } from 'react-router'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object} root0.selectedData - Selected Datastore
 * @param {Function} root0.handleClose - Handle close
 * @param {object} root0.availableActions - Available actions
 * @returns {Component} - Single view details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedData = {},
  handleClose,
  availableActions = {},
}) => {
  // Get hooks
  const { palette } = useTheme()
  const { showModal } = useModalsApi()
  const history = useHistory()

  const [refresh, { data: refreshedData = {}, isFetching }] =
    DatastoreAPI.useLazyGetDatastoreQuery()
  const [enable, { isLoading: isEnabling }] =
    DatastoreAPI.useEnableDatastoreMutation()
  const [disable, { isLoading: isDisabling }] =
    DatastoreAPI.useDisableDatastoreMutation()
  const [remove, { isLoading: isRemoving }] =
    DatastoreAPI.useRemoveDatastoreMutation()
  const [addCluster, { isLoading: isAddingCluster }] =
    ClusterAPI.useAddDatastoreToClusterMutation()
  const [removeCluster, { isLoading: isRemovingCluster }] =
    ClusterAPI.useRemoveDatastoreFromClusterMutation()
  const [rename, { isLoading: isRenaming }] =
    DatastoreAPI.useRenameDatastoreMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    DatastoreAPI.useChangeDatastorePermissionsMutation()
  const [update, { isLoading: isUpdatingDatastore }] =
    DatastoreAPI.useUpdateDatastoreMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    DatastoreAPI.useChangeDatastoreOwnershipMutation()

  const data =
    String(refreshedData?.ID) === String(selectedData?.ID)
      ? refreshedData
      : selectedData
  const { ID, TEMPLATE } = data

  const dsStatus = data?.STATE === '0'

  const { color: stateColor, name: stateName } = useMemo(
    () => getDatastoreState(data),
    [data]
  )
  const type = useMemo(() => getDatastoreType(data), [data])

  const isActionsDisabled =
    ID === undefined ||
    isFetching ||
    isEnabling ||
    isDisabling ||
    isRemoving ||
    isAddingCluster ||
    isRemovingCluster ||
    isRenaming ||
    isUpdatingDatastore ||
    isChangingPermissions ||
    isChangingOwnership

  const handleRefresh = () => ID !== undefined && refresh({ id: ID })

  const refreshCurrentData = async () =>
    ID !== undefined && (await refresh({ id: ID }))

  const handleConfirmAction = ({
    title,
    description = T['resource.action.confirmation'],
    confirmLabel,
    confirmButtonProps,
    onSubmit,
  }) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title,
        description: (
          <ResourceActionConfirmation
            description={description}
            resources={selectedData}
            resourceType={T.Datastores}
          />
        ),
        confirmLabel,
        confirmButtonProps,
      },
      onSubmit,
    })

  const handleEdit = () => {
    history.push(PATH.STORAGE.DATASTORES.UPDATE, selectedData)
  }

  const groupDialogSizeProps = {
    dialogWidth: { xs: 'calc(100vw - 32px)', md: '900px', lg: '1040px' },
    dialogMaxWidth: 'calc(100vw - 32px)',
    dialogMaxHeight: 'calc(100vh - 64px)',
    dialogPaperOverflow: 'visible',
    dialogContentMaxHeight: '50vh',
    dialogContentOverflowY: 'auto',
  }

  const handleChangeClusterForm = () =>
    showModal({
      name: T.SelectCluster,
      dialogProps: {
        title: T.SelectCluster,
        dataCy: 'modal-select-cluster',
        ...groupDialogSizeProps,
        validateOn: 'onSubmit',
      },
      form: Cluster.Forms.ChangeClusterForm({
        initialValues: data?.CLUSTERS?.ID,
        stepProps: {
          singleSelect: false,
        },
      }),
      onSubmit: async (formData) => {
        const oldClusters = []
          .concat(data?.CLUSTERS?.ID ?? [])
          .filter((clusterId) => clusterId !== undefined && clusterId !== null)
          .map(String)
        const selectedClusters = []
          .concat(formData?.cluster ?? [])
          .filter((clusterId) => clusterId !== undefined && clusterId !== null)
          .map(String)

        const newClusters = selectedClusters.filter(
          (clusterId) => !oldClusters.includes(String(clusterId))
        )
        const removedClusters = oldClusters.filter(
          (clusterId) => !selectedClusters.includes(String(clusterId))
        )

        await Promise.all(
          newClusters.map((clusterId) =>
            addCluster({ id: clusterId, datastore: ID })
          )
        )

        await Promise.all(
          removedClusters.map((clusterId) =>
            removeCluster({ id: clusterId, datastore: ID })
          )
        )

        await refreshCurrentData()
      },
    })

  const handleRename = async (newName) => {
    await rename({ id: ID, name: newName })
    await refreshCurrentData()
  }

  const handleChangePermission = async (newPermission) => {
    await changePermissions({ id: ID, ...newPermission })
    await refreshCurrentData()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await changeOwnership({ id: ID, ...newOwnership })
    await refreshCurrentData()
  }

  const handleEnable = () =>
    handleConfirmAction({
      title: T.Enable,
      description: T['resource.enable.confirmation'],
      confirmLabel: T.Enable,
      onSubmit: async () => {
        await enable(ID)
        await refreshCurrentData()
      },
    })

  const handleDisable = () =>
    handleConfirmAction({
      title: T.Disable,
      description: T['resource.disable.confirmation'],
      confirmLabel: T.Disable,
      onSubmit: async () => {
        await disable(ID)
        await refreshCurrentData()
      },
    })

  const handleDelete = () =>
    handleConfirmAction({
      title: T.Delete,
      description: T['resource.delete.confirmation'],
      confirmLabel: T.Delete,
      confirmButtonProps: {
        isDestructive: true,
      },
      onSubmit: async () => {
        await remove({ id: ID })
        handleClose()
      },
    })

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

  // Enable and disable
  const statusButtons = createActions({
    filters: availableActions,
    actions: [
      {
        accessor: DATASTORE_ACTIONS.ENABLE,
        startIcon: <OnTag width="16px" height="16px" />,
        onClick: handleEnable,
        value: DATASTORE_ACTIONS.ENABLE,
        isDisabled: isActionsDisabled,
        tooltip: T.Enable,
      },
      {
        accessor: DATASTORE_ACTIONS.DISABLE,
        startIcon: <OffTag width="16px" height="16px" />,
        onClick: handleDisable,
        value: DATASTORE_ACTIONS.DISABLE,
        isDisabled: isActionsDisabled,
        tooltip: T.Disable,
      },
    ],
  })

  const [editAction, changeClusterAction] = createActions({
    filters: availableActions,
    actions: [
      {
        accessor: DATASTORE_ACTIONS.UPDATE_DIALOG,
        startIcon: <Edit width="16px" height="16px" />,
        onClick: handleEdit,
        value: DATASTORE_ACTIONS.UPDATE_DIALOG,
        tooltip: T.Edit,
        dataCy: `datastore_${DATASTORE_ACTIONS.UPDATE_DIALOG}`,
        isDisabled: isActionsDisabled,
      },
      {
        accessor: DATASTORE_ACTIONS.CHANGE_CLUSTER,
        startIcon: <Network width="16px" height="16px" />,
        onClick: handleChangeClusterForm,
        value: DATASTORE_ACTIONS.CHANGE_CLUSTER,
        tooltip: T.SelectCluster,
        isDisabled: isActionsDisabled,
      },
    ],
  })

  const toggleOptions = [
    [changeClusterAction].filter(Boolean),
    [
      {
        ...getLabelMenuButtonProps({
          selectedRows: [data],
          resourceType: RESOURCE_NAMES.DATASTORE,
          isDisabled: isActionsDisabled,
        }),
      },
      editAction,
      {
        startIcon: <RefreshDouble width="16px" height="16px" />,
        onClick: handleRefresh,
        value: 'refresh',
        tooltip: T.Refresh,
        isDisabled: isActionsDisabled,
      },
    ].filter(Boolean),
    [
      ...createActions({
        filters: availableActions,
        actions: [
          {
            accessor: DATASTORE_ACTIONS.DELETE,
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
            value: DATASTORE_ACTIONS.DELETE,
            tooltip: T.Delete,
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
              [T.Cluster, [data?.CLUSTERS?.ID ?? []].flat().join(', ')],
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
                      dsStatus
                        ? DATASTORE_ACTIONS.ENABLE
                        : DATASTORE_ACTIONS.DISABLE,
                    ]}
                    buttons={statusButtons}
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
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: Datastore.Tabs.Single,
            resourceId: Datastore.RID,
            tabProps: {
              attributes,
              selected: data,
              handleChangeOwnership,
              handleChangePermission,
              handleDeleteAttribute,
              handleAddAttribute: handleAttributeInXml,
              handleEditAttribute: handleAttributeInXml,
              isActionsDisabled,
              isLoadingData: isFetching || isUpdatingDatastore,
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
  handleClose: PropTypes.func,
  availableActions: PropTypes.object,
}
