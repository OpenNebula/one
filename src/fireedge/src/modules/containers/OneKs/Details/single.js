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
  getLabelMenuButtonProps,
  InfoSlot,
  ResourceActionConfirmation,
  SummarySlot,
  StatusTag,
  Tag,
  TabSlot,
  ToggleGroup,
} from '@ComponentsV2Module'
import { Box, useTheme } from '@mui/material'
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  RefreshCircular,
  RefreshDouble,
  ArrowUpCircle,
  Cancel,
  Trash,
} from 'iconoir-react'
import { ONEKS_ACTIONS, RESOURCE_NAMES, T } from '@ConstantsModule'
import { createActions, permissionsToOctal, toSnakeCase } from '@UtilsModule'
import { getLabelTags, getVirtualOneKsState } from '@ModelsModule'
import { OneKsAPI, useModalsApi } from '@FeaturesModule'
import { OneKs as OneKsResource } from '@ResourcesModule'

const getDocument = (data) => data?.DOCUMENT ?? data ?? {}

const isKubernetesVersionHigher = (candidate, current) => {
  const candidateParts = String(candidate ?? '')
    .match(/\d+/g)
    ?.map(Number)
  const currentParts = String(current ?? '')
    .match(/\d+/g)
    ?.map(Number)

  if (!candidateParts?.length || !currentParts?.length) return false

  for (
    let index = 0;
    index < Math.max(candidateParts.length, currentParts.length);
    index += 1
  ) {
    const candidatePart = candidateParts[index] ?? 0
    const currentPart = currentParts[index] ?? 0

    if (candidatePart !== currentPart) return candidatePart > currentPart
  }

  return false
}

const getPermissionOctet = (permissions = {}, newPermission = {}) => {
  const [key, value] = Object.entries(newPermission)[0] ?? []

  if (!key) return undefined

  const [member, permission] = toSnakeCase(key).toUpperCase().split('_')
  const fullPermissionName = `${member}_${permission?.[0]}`

  return permissionsToOctal({
    ...permissions,
    [fullPermissionName]: value,
  })
}

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object} root0.selectedData - Selected OneKs cluster
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
  const openUpgradeKsClusterForm =
    OneKsResource.Forms.useUpgradeKsClusterFormModal()
  const openDeleteKsClusterConfirmation =
    OneKsResource.Forms.useDeleteKsClusterConfirmation()
  const selectedDocument = getDocument(selectedData)
  const selectedId = selectedDocument?.ID
  const {
    data: refreshedData = {},
    isFetching,
    refetch,
  } = OneKsAPI.useGetOneKsClusterQuery(
    { id: selectedId, expand: true },
    { skip: !isOpen || selectedId === undefined }
  )
  const { data: families = [], isLoading: isLoadingFamilies } =
    OneKsAPI.useGetOneKsFamiliesQuery()
  const [recover, { isLoading: isRecovering }] =
    OneKsAPI.useRecoverOneKsClusterMutation()
  const [deleteOneKs, { isLoading: isDeleting }] =
    OneKsAPI.useDeleteOneKsClusterMutation()
  const [updateDocument, { isLoading: isUpdating }] =
    OneKsAPI.useUpdateOneKsDocumentMutation()
  const [upgradeKubernetesVersion, { isLoading: isUpgrading }] =
    OneKsAPI.useUpdateOneKsKubernetesVersionMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    OneKsAPI.useChangeOneKsClusterPermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    OneKsAPI.useChangeOneKsClusterOwnershipMutation()

  const refreshedDocument = getDocument(refreshedData)
  const data =
    String(refreshedDocument?.ID) === String(selectedId)
      ? refreshedDocument
      : selectedDocument

  const { ID, TEMPLATE = {}, PERMISSIONS = {} } = data || {}
  const { CLUSTER_BODY = {} } = TEMPLATE
  const [controlPlane = {}] = [].concat(CLUSTER_BODY?.control_plane ?? [])
  const { color: stateColor, name: stateName } = getVirtualOneKsState(data)

  const isActionsDisabled =
    ID === undefined ||
    isFetching ||
    isRecovering ||
    isDeleting ||
    isUpdating ||
    isUpgrading ||
    isChangingPermissions ||
    isChangingOwnership

  const refreshCurrentData = async () => ID !== undefined && (await refetch())

  const handleRename = async (newName) => {
    await updateDocument({ id: ID, template: { name: newName } })
    await refreshCurrentData()
  }

  const handleRecover = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.Recover,
        dataCy: 'modal-recover-oneks',
        description: (
          <ResourceActionConfirmation
            description={T['resource.recover.confirmation']}
            resources={data}
            resourceType={T.KubernetesClusters}
          />
        ),
        confirmLabel: T.Recover,
      },
      onSubmit: async () => {
        await recover({ id: ID })
        await refreshCurrentData()
      },
    })

  const { upgradeKubernetesVersions, highestSupportedKubernetesVersion } =
    useMemo(() => {
      const family = families.find(
        ({ family: familyName }) => familyName === controlPlane?.family
      )
      const supportedVersions = family?.supported_k8s_versions ?? []
      const highestSupportedVersion = supportedVersions.reduce(
        (highestVersion, version) =>
          !highestVersion || isKubernetesVersionHigher(version, highestVersion)
            ? version
            : highestVersion,
        undefined
      )

      return {
        upgradeKubernetesVersions: supportedVersions.filter((version) =>
          isKubernetesVersionHigher(version, CLUSTER_BODY?.kubernetes_version)
        ),
        highestSupportedKubernetesVersion:
          highestSupportedVersion ?? CLUSTER_BODY?.kubernetes_version,
      }
    }, [CLUSTER_BODY?.kubernetes_version, controlPlane?.family, families])

  const handleUpgradeKubernetesVersion = async (template) => {
    await upgradeKubernetesVersion({ id: ID, template }).unwrap()
    await refreshCurrentData()
  }

  const handleOpenUpgradeKsClusterForm = () =>
    openUpgradeKsClusterForm({
      versions: upgradeKubernetesVersions,
      highestSupportedVersion: highestSupportedKubernetesVersion,
      onSubmit: handleUpgradeKubernetesVersion,
    })

  const handleDelete = () =>
    openDeleteKsClusterConfirmation({
      title: T.Delete,
      resources: data,
      onSubmit: async (force) => {
        await deleteOneKs({
          id: ID,
          ...(force ? { force: true } : {}),
        })
        handleClose()
      },
    })

  const handleChangePermission = async (newPermission) => {
    const octet = getPermissionOctet(PERMISSIONS, newPermission)
    if (!octet) return

    await changePermissions({ id: ID, octet })
    await refreshCurrentData()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await changeOwnership({ id: ID, ...newOwnership })
    await refreshCurrentData()
  }

  const toggleOptions = [
    [
      ...createActions({
        filters: availableActions,
        actions: [
          {
            accessor: ONEKS_ACTIONS.RECOVER,
            startIcon: <RefreshCircular width="16px" height="16px" />,
            onClick: handleRecover,
            value: ONEKS_ACTIONS.RECOVER,
            tooltip: T.Recover,
            isDisabled: isActionsDisabled,
          },
          {
            accessor: ONEKS_ACTIONS.UPGRADE,
            startIcon: <ArrowUpCircle width="16px" height="16px" />,
            onClick: handleOpenUpgradeKsClusterForm,
            value: ONEKS_ACTIONS.UPGRADE,
            tooltip: T.Upgrade,
            isDisabled: isActionsDisabled || isLoadingFamilies,
          },
        ],
      }),
    ],
    [
      {
        ...getLabelMenuButtonProps({
          selectedRows: [data],
          resourceType: RESOURCE_NAMES.ONEKS,
          isDisabled: isActionsDisabled,
        }),
      },
      {
        startIcon: <RefreshDouble width="16px" height="16px" />,
        onClick: refreshCurrentData,
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
            accessor: ONEKS_ACTIONS.DELETE,
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
            value: ONEKS_ACTIONS.DELETE,
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
            isTitleEditDisabled: isActionsDisabled,
            title: data?.NAME,
            id: ID,
            tags: getLabelTags(data?.LABELS),
            labels: [
              [T.Owner, data?.UNAME],
              [T.Group, data?.GNAME],
            ],
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
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
                  key={'oneks-state'}
                  statusColor={stateColor}
                  statusName={stateName ?? '-'}
                />,
                T.State,
              ],
              [
                <Tag
                  key={'oneks-control-plane-flavour'}
                  title={controlPlane?.flavour ?? '-'}
                  status={'default'}
                />,
                T.ControlPlane,
              ],
              [
                String(
                  [].concat(CLUSTER_BODY?.node_groups ?? []).filter(Boolean)
                    .length
                ),
                T.NodeGroups,
              ],
              [
                <Tag
                  key={'oneks-kubernetes-version'}
                  title={CLUSTER_BODY?.kubernetes_version ?? '-'}
                  status={'default'}
                />,
                T.KubernetesVersion,
              ],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: OneKsResource.Tabs.Single,
            resourceId: OneKsResource.RID,
            tabProps: {
              selected: data,
              handleChangeOwnership,
              handleChangePermission,
              isLoading: isFetching,
              isActionsDisabled,
              isMutating: isActionsDisabled,
            },
          },
          { flex: '1 1 0', minHeight: 0 },
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
