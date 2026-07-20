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
  Tag,
  ToggleGroup,
} from '@ComponentsV2Module'
import { Box, useTheme } from '@mui/material'
import { Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  Cancel,
  Edit,
  Lock,
  NoLock,
  Play,
  RefreshDouble,
  Trash,
} from 'iconoir-react'
import { PATH, RESOURCE_NAMES, T, VN_TEMPLATE_ACTIONS } from '@ConstantsModule'
import { VnTemplateAPI, useModalsApi, useViews } from '@FeaturesModule'
import { getLabelTags } from '@ModelsModule'
import {
  filterAttributes,
  getActionsAvailable,
  jsonToXml,
  timeFromMilliseconds,
} from '@UtilsModule'
import { VnTemplate as Resource } from '@ResourcesModule'
import { useHistory } from 'react-router'

const HIDDEN_ATTRIBUTES_REG = new RegExp(
  '^(AR|CLUSTER|CLUSTERS|CLUSTER_IDS|SECURITY_GROUPS|' +
    'VN_MAD|AUTOMATIC_VLAN_ID|VLAN_ID|' +
    'AUTOMATIC_OUTER_VLAN_ID|OUTER_VLAN_ID|' +
    'INBOUND_AVG_BW|INBOUND_PEAK_BW|INBOUND_PEAK_KB|' +
    'OUTBOUND_AVG_BW|OUTBOUND_PEAK_BW|OUTBOUND_PEAK_KB)$'
)

const getAddressRanges = (vnTemplate) =>
  [vnTemplate?.TEMPLATE?.AR ?? []].flat().filter(Boolean)

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object} root0.selectedVnTemplate - Selected VN template
 * @param {Function} root0.handleClose - Handle close
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Single view details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedVnTemplate = {},
  handleClose,
  actions = [],
}) => {
  const { palette } = useTheme()
  const { getResourceView } = useViews()
  const { showModal } = useModalsApi()
  const history = useHistory()

  // API
  const { data: fetchedVnTemplate = {}, isFetching: isLoadingVnTemplate } =
    VnTemplateAPI.useGetVNTemplateQuery(
      { id: selectedVnTemplate?.ID },
      {
        skip: !selectedVnTemplate?.ID,
        refetchOnMountOrArgChange: true,
      }
    )

  const [refreshVnTemplate, { isFetching: isRefreshingVnTemplate }] =
    VnTemplateAPI.useLazyGetVNTemplateQuery()
  const [rename, { isLoading: isRenaming }] =
    VnTemplateAPI.useRenameVNTemplateMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    VnTemplateAPI.useChangeVNTemplateOwnershipMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    VnTemplateAPI.useChangeVNTemplatePermissionsMutation()
  const [update, { isLoading: isUpdating }] =
    VnTemplateAPI.useUpdateVNTemplateMutation()
  const [remove, { isLoading: isRemoving }] =
    VnTemplateAPI.useRemoveVNTemplateMutation()
  const [lock, { isLoading: isLocking }] =
    VnTemplateAPI.useLockVNTemplateMutation()
  const [unlock, { isLoading: isUnlocking }] =
    VnTemplateAPI.useUnlockVNTemplateMutation()

  // State
  const vnTemplate =
    String(fetchedVnTemplate?.ID) === String(selectedVnTemplate?.ID)
      ? fetchedVnTemplate
      : selectedVnTemplate

  const infoActions = getResourceView(RESOURCE_NAMES.VN_TEMPLATE)?.['info-tabs']
    ?.info?.information_panel?.actions
  const canRename = getActionsAvailable(infoActions).includes(
    VN_TEMPLATE_ACTIONS.RENAME
  )

  const attributes = useMemo(() => {
    const { attributes: visibleAttributes = {} } = filterAttributes(
      vnTemplate?.TEMPLATE,
      { hidden: HIDDEN_ATTRIBUTES_REG }
    )

    return Object.entries(visibleAttributes).map(([key, value]) => ({
      key,
      rawValue: value,
      value: value && typeof value === 'object' ? JSON.stringify(value) : value,
    }))
  }, [vnTemplate?.TEMPLATE])

  const { addressRangeCount, addressRangeSize } = useMemo(() => {
    const addressRanges = getAddressRanges(vnTemplate)

    return {
      addressRangeCount: addressRanges.length,
      addressRangeSize: addressRanges.reduce(
        (total, addressRange) => total + Number(addressRange?.SIZE ?? 0),
        0
      ),
    }
  }, [vnTemplate])

  const isActionsDisabled =
    isLoadingVnTemplate ||
    isRefreshingVnTemplate ||
    isRenaming ||
    isChangingOwnership ||
    isChangingPermissions ||
    isUpdating ||
    isRemoving ||
    isLocking ||
    isUnlocking

  const isLocked = Object.hasOwn(vnTemplate, 'LOCK')
  const hasAction = (action) => !actions?.length || actions.includes(action)
  const canDelete = hasAction(VN_TEMPLATE_ACTIONS.DELETE)
  const canLock = hasAction(VN_TEMPLATE_ACTIONS.LOCK)
  const canUnlock = hasAction(VN_TEMPLATE_ACTIONS.UNLOCK)
  const canInstantiate = hasAction(VN_TEMPLATE_ACTIONS.INSTANTIATE_DIALOG)
  const canUpdate = hasAction(VN_TEMPLATE_ACTIONS.UPDATE_DIALOG)

  // Actions
  const handleRefresh = async () =>
    vnTemplate?.ID && (await refreshVnTemplate({ id: vnTemplate.ID }))

  const handleLock = async () => {
    await lock({ id: vnTemplate?.ID })
    await handleRefresh()
  }

  const handleUnlock = async () => {
    await unlock({ id: vnTemplate?.ID })
    await handleRefresh()
  }

  const handleRename = async (newName) => {
    await rename({ id: vnTemplate?.ID, name: newName })
    await handleRefresh()
  }

  const handleChangePermission = async (newPermission) => {
    await changePermissions({ id: vnTemplate?.ID, ...newPermission })
    await handleRefresh()
  }

  const handleChangeOwnership = async (newOwnership) => {
    await changeOwnership({ id: vnTemplate?.ID, ...newOwnership })
    await handleRefresh()
  }

  const handleDeleteAttribute = async (index) => {
    await updateTemplate(
      attributes.filter((_, attrIndex) => attrIndex !== index)
    )
  }

  const handleAddAttribute = async (newAttribute) => {
    await updateTemplate([newAttribute, ...attributes], 1)
  }

  // Modals
  const handleLockForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Lock} ${T.NetworkTemplate}`,
        dataCy: 'modal-lock',
        description: (
          <ResourceActionConfirmation
            description={T['resource.lock.confirmation']}
            resources={vnTemplate}
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
        title: `${T.Unlock} ${T.NetworkTemplate}`,
        dataCy: 'modal-unlock',
        description: (
          <ResourceActionConfirmation
            description={T['resource.unlock.confirmation']}
            resources={vnTemplate}
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
        title: `${T.Delete} ${T.NetworkTemplate}`,
        dataCy: 'modal-vnettemplate-delete',
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={vnTemplate}
            resourceType={T.NetworkTemplates}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await remove({ id: vnTemplate?.ID })
        handleClose()
      },
    })

  // Helpers
  const handleUpdate = () => {
    history.push(PATH.NETWORK.VN_TEMPLATES.CREATE, vnTemplate)
  }

  const handleInstantiate = () => {
    history.push(PATH.NETWORK.VN_TEMPLATES.INSTANTIATE, vnTemplate)
  }

  const updateTemplate = async (nextAttributes) => {
    const nextTemplate = { ...(vnTemplate?.TEMPLATE ?? {}) }
    attributes.forEach(({ key }) => {
      delete nextTemplate[key]
    })
    nextAttributes.forEach(({ key, rawValue, value }) => {
      nextTemplate[key] = rawValue ?? value
    })

    await update({
      id: vnTemplate?.ID,
      template: jsonToXml(nextTemplate),
      replace: 0,
    })
    await handleRefresh()
  }

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            dataCy: 'vnet-template',
            isTitleEditable: canRename,
            onTitleChange: handleRename,
            isTitleEditDisabled: isActionsDisabled,
            title: vnTemplate?.NAME,
            id: vnTemplate?.ID,
            tags: getLabelTags(vnTemplate?.LABELS),
            labels: [
              [T.Owner, vnTemplate?.UNAME],
              [T.Group, vnTemplate?.GNAME],
              [
                T.Registered,
                timeFromMilliseconds(+vnTemplate?.REGTIME).toRelative(),
              ],
            ],
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
                    selected={new Set([isLocked ? 'lock' : 'unlock'])}
                    buttons={[
                      canLock && {
                        startIcon: <Lock width="16px" height="16px" />,
                        onClick: handleLockForm,
                        value: 'lock',
                        dataCy: 'action-vnettemplate-lock',
                        tooltip: T.Lock,
                        isDisabled: isActionsDisabled,
                      },
                      canUnlock && {
                        startIcon: <NoLock width="16px" height="16px" />,
                        onClick: handleUnlockForm,
                        value: 'unlock',
                        dataCy: 'action-vnettemplate-unlock',
                        tooltip: T.Unlock,
                        isDisabled: isActionsDisabled,
                      },
                    ].filter(Boolean)}
                  />
                )}
                <ToggleGroup
                  size="medium"
                  options={[
                    [
                      canInstantiate && {
                        startIcon: <Play width="16px" height="16px" />,
                        onClick: handleInstantiate,
                        value: 'instantiate',
                        tooltip: T.Instantiate,
                        isDisabled: isActionsDisabled,
                      },
                    ].filter(Boolean),
                    [
                      {
                        ...getLabelMenuButtonProps({
                          selectedRows: [vnTemplate],
                          resourceType: RESOURCE_NAMES.VN_TEMPLATE,
                          isDisabled: isActionsDisabled,
                        }),
                      },
                      canUpdate && {
                        startIcon: <Edit width="16px" height="16px" />,
                        onClick: handleUpdate,
                        value: 'update',
                        'data-cy': 'action-vnettemplate-update_dialog',
                        tooltip: T.Update,
                        isDisabled: isLocked || isActionsDisabled,
                      },
                      {
                        startIcon: <RefreshDouble width="16px" height="16px" />,
                        onClick: handleRefresh,
                        value: 'refresh',
                        tooltip: T.Refresh,
                        isDisabled: isActionsDisabled,
                      },
                    ].filter(Boolean),
                    [
                      canDelete && {
                        startIcon: (
                          <Trash
                            width="16px"
                            height="16px"
                            style={{
                              color:
                                isLocked || isActionsDisabled
                                  ? palette.text.disabled
                                  : palette.icon.error,
                            }}
                          />
                        ),
                        onClick: handleDeleteForm,
                        value: 'delete',
                        'data-cy': 'action-vnettemplate-delete',
                        tooltip: T.Delete,
                        isDestructive: true,
                        isDisabled: isLocked || isActionsDisabled,
                      },
                      {
                        startIcon: <Cancel width="16px" height="16px" />,
                        onClick: handleClose,
                        value: 'close',
                        tooltip: T.Close,
                      },
                    ].filter(Boolean),
                  ]}
                />
              </Box>
            ),
          },
        ],
        [
          SummarySlot,
          {
            labels: [
              [
                vnTemplate?.TEMPLATE?.VN_MAD ? (
                  <Tag
                    key="driver"
                    title={vnTemplate.TEMPLATE.VN_MAD}
                    status="default"
                  />
                ) : (
                  '-'
                ),
                T.Driver,
              ],
              [addressRangeCount, T.AddressRange],
              [addressRangeSize, T.TotalIPs],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: Resource.Tabs.Single,
            resourceId: Resource.RID,
            tabProps: {
              vnTemplate,
              attributes,
              handleChangePermission,
              handleChangeOwnership,
              handleDeleteAttribute,
              handleAddAttribute,
              handleRefresh,
              actions,
              isLoadingVnTemplate,
              isActionsDisabled,
              isLocked,
            },
          },
          { flex: '1 1 0' },
        ],
      ]}
    />
  )
}

SingleView.displayName = 'SingleView'

SingleView.propTypes = {
  isOpen: PropTypes.bool,
  selectedVnTemplate: PropTypes.object,
  handleClose: PropTypes.func,
  actions: PropTypes.array,
}
