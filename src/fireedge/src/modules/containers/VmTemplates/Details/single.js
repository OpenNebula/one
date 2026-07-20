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
  SummarySlot,
  TabSlot,
  ToggleGroup,
  ButtonGroup,
  ResourceActionConfirmation,
} from '@ComponentsV2Module'

import { Component } from 'react'
import { prettyBytes, timeFromMilliseconds } from '@UtilsModule'
import { VmTemplate } from '@ResourcesModule'
import { getLabelTags } from '@ModelsModule'
import {
  T,
  RESOURCE_NAMES,
  UNITS,
  STATIC_FILES_URL,
  DEFAULT_TEMPLATE_LOGO,
  PATH,
} from '@ConstantsModule'
import { Box, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import {
  RefreshDouble,
  Edit,
  KeyframesCouple as CloneIcon,
  GridAdd,
  Cancel,
  Trash,
  Lock,
  NoLock,
  Play,
} from 'iconoir-react'
import { useHistory } from 'react-router'
import { VmTemplateAPI, useModalsApi } from '@FeaturesModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object} root0.selectedTemplate - Selected VM template
 * @param {Function} root0.handleClose - Handle close
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Single view details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedTemplate = {},
  handleClose,
  actions,
}) => {
  const { palette } = useTheme()
  const history = useHistory()
  const { showModal } = useModalsApi()
  const [refreshTemplate, { isFetching: isRefreshingTemplate }] =
    VmTemplateAPI.useLazyGetTemplateQuery()

  const [rename, { isLoading: isRenaming }] =
    VmTemplateAPI.useRenameTemplateMutation()
  const [remove, { isLoading: isRemoving }] =
    VmTemplateAPI.useRemoveTemplateMutation()
  const [clone, { isLoading: isCloning }] =
    VmTemplateAPI.useCloneTemplateMutation()
  const [lock, { isLoading: isLocking }] =
    VmTemplateAPI.useLockTemplateMutation()
  const [unlock, { isLoading: isUnlocking }] =
    VmTemplateAPI.useUnlockTemplateMutation()

  const [changePermissions, { isLoading: isChangingPermissions }] =
    VmTemplateAPI.useChangeTemplatePermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    VmTemplateAPI.useChangeTemplateOwnershipMutation()

  const handleOpenCloneForm = () =>
    showModal({
      name: T.Clone,

      dialogProps: {
        title: T.CloneTemplate,
        dataCy: 'modal-clone',
        description: (
          <ResourceActionConfirmation
            description={T['resource.clone.confirmation']}
            resources={selectedTemplate}
            resourceType={T.VMTemplates}
          />
        ),
        confirmLabel: T.Clone,
      },

      onSubmit: async (cloneData) =>
        await clone({ id: selectedTemplate?.ID, ...cloneData }),
      form: VmTemplate.Forms.CloneForm({
        stepProps: { isMultiple: false },
        initialValues: { name: `Copy of ${selectedTemplate?.NAME}` },
      }),
    })

  const handleOpenDeleteForm = () =>
    showModal({
      dialogProps: {
        title: `${T.Delete} ${T.VMTemplate}`,
        dataCy: 'modal-delete',
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={selectedTemplate}
            resourceType={T.VMTemplates}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      form: VmTemplate.Forms.DeleteForm(),
      onSubmit: async ({ image } = {}) => {
        await remove({ id: selectedTemplate?.ID, image })
        handleClose()
      },
    })

  const handleInstantiate = () =>
    history.push(PATH.TEMPLATE.VMS.INSTANTIATE, selectedTemplate)

  const handleRename = async (newName) => {
    await rename({ id: selectedTemplate?.ID, name: newName })
  }

  const handleLock = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.Lock,
        dataCy: 'modal-lock',
        description: (
          <ResourceActionConfirmation
            description={T['resource.lock.confirmation']}
            resources={selectedTemplate}
            resourceType={T.VMTemplates}
          />
        ),
        confirmLabel: T.Lock,
      },
      onSubmit: async () => {
        await lock({ id: selectedTemplate?.ID })
        await refreshTemplate({ id: selectedTemplate?.ID })
      },
    })

  const handleUnlock = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T.Unlock,
        dataCy: 'modal-unlock',
        description: (
          <ResourceActionConfirmation
            description={T['resource.unlock.confirmation']}
            resources={selectedTemplate}
            resourceType={T.VMTemplates}
          />
        ),
        confirmLabel: T.Unlock,
      },
      onSubmit: async () => {
        await unlock({ id: selectedTemplate?.ID })
        await refreshTemplate({ id: selectedTemplate?.ID })
      },
    })

  const handleEdit = () => {
    history.push(PATH.TEMPLATE.VMS.UPDATE, selectedTemplate)
  }

  const handleExport = () => {
    history.push(PATH.STORAGE.MARKETPLACE_APPS.CREATE, [
      RESOURCE_NAMES.VM_TEMPLATE,
      selectedTemplate,
    ])
  }

  const handleChangePermission = async (newPermission) => {
    await changePermissions({ id: selectedTemplate?.ID, ...newPermission })
    await refreshTemplate({ id: selectedTemplate?.ID })
  }

  const handleChangeOwnership = async (newOwnership) => {
    await changeOwnership({ id: selectedTemplate?.ID, ...newOwnership })
    await refreshTemplate({ id: selectedTemplate?.ID })
  }

  const isActionsDisabled =
    isLocking ||
    isUnlocking ||
    isCloning ||
    isRenaming ||
    isRemoving ||
    isRefreshingTemplate ||
    isChangingOwnership ||
    isChangingPermissions

  const templateIsLocked = Object.hasOwn(selectedTemplate, 'LOCK')

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
            dataCy: 'vm-template',

            icon: `${STATIC_FILES_URL}/${
              selectedTemplate?.TEMPLATE?.LOGO ?? DEFAULT_TEMPLATE_LOGO
            }`,
            title: selectedTemplate?.NAME,
            id: selectedTemplate?.ID,
            tags: getLabelTags(selectedTemplate?.LABELS),
            labels: [
              [T.Owner, selectedTemplate?.UNAME],
              [T.Group, selectedTemplate?.GNAME],
              [
                `${T.Registered} ${timeFromMilliseconds(
                  +selectedTemplate?.REGTIME
                ).toRelative()}`,
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
                <ButtonGroup
                  selected={[templateIsLocked ? 'lock' : 'unlock']}
                  buttons={[
                    {
                      startIcon: <Lock width="16px" height="16px" />,
                      onClick: handleLock,
                      value: 'lock',
                      dataCy: 'action-template-lock',
                      tooltip: T.Lock,
                      isDisabled: isActionsDisabled,
                    },
                    {
                      startIcon: <NoLock width="16px" height="16px" />,
                      onClick: handleUnlock,
                      value: 'unlock',
                      dataCy: 'action-template-unlock',
                      tooltip: T.Unlock,
                      isDisabled: isActionsDisabled,
                    },
                  ]}
                />
                <ToggleGroup
                  size="medium"
                  options={[
                    [
                      {
                        startIcon: <Play width="16px" height="16px" />,
                        onClick: handleInstantiate,
                        value: 'instantiate',
                        'data-cy': 'action-instantiate_dialog',
                        tooltip: T.Instantiate,
                        isDisabled: isActionsDisabled,
                      },
                      {
                        startIcon: <GridAdd width="16px" height="16px" />,
                        onClick: handleExport,
                        value: 'export',
                        'data-cy': 'action-create_app_dialog',
                        tooltip: T.Export,
                        isDisabled: templateIsLocked || isActionsDisabled,
                      },
                      {
                        startIcon: <CloneIcon width="16px" height="16px" />,
                        onClick: handleOpenCloneForm,
                        value: 'clone',
                        'data-cy': 'action-clone',
                        tooltip: T.Clone,
                        isDisabled: templateIsLocked || isActionsDisabled,
                      },
                    ],
                    [
                      {
                        ...getLabelMenuButtonProps({
                          selectedRows: [selectedTemplate],
                          resourceType: RESOURCE_NAMES.VM_TEMPLATE,
                          isDisabled: isActionsDisabled,
                        }),
                      },
                      {
                        startIcon: <Edit width="16px" height="16px" />,
                        onClick: handleEdit,
                        value: 'edit',
                        'data-cy': 'action-update_dialog',
                        tooltip: T.Update,
                        isDisabled: templateIsLocked || isActionsDisabled,
                      },
                      {
                        startIcon: <RefreshDouble width="16px" height="16px" />,
                        onClick: () =>
                          refreshTemplate({ id: selectedTemplate?.ID }),
                        value: 'refresh',
                        'data-cy': 'action-refresh',
                        tooltip: T.Refresh,
                        isDisabled: isActionsDisabled,
                      },
                    ],

                    [
                      {
                        startIcon: (
                          <Trash
                            width="16px"
                            height="16px"
                            style={{
                              color:
                                templateIsLocked || isActionsDisabled
                                  ? palette.text.disabled
                                  : palette.icon.error,
                            }}
                          />
                        ),
                        onClick: handleOpenDeleteForm,
                        value: 'delete',
                        'data-cy': 'action-delete',
                        tooltip: T.Delete,
                        isDestructive: true,
                        isDisabled: templateIsLocked || isActionsDisabled,
                      },
                      {
                        startIcon: <Cancel width="16px" height="16px" />,
                        onClick: handleClose,
                        value: 'close',
                        'data-cy': 'action-close',
                        tooltip: T.Close,
                      },
                    ],
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
                selectedTemplate?.TEMPLATE?.HYPERVISOR?.toUpperCase(),
                T.Hypervisor,
              ],

              [selectedTemplate?.TEMPLATE?.VCPU ?? '-', T.vcpu],
              [
                prettyBytes(selectedTemplate?.TEMPLATE?.MEMORY, UNITS.MB),
                T.Memory,
              ],
            ]?.filter(([value]) => value !== undefined),
          },
        ],
        [
          TabSlot,
          {
            tabs: VmTemplate.Tabs.Single,
            resourceId: VmTemplate.RID,
            tabProps: {
              selected: selectedTemplate,
              handleChangeOwnership,
              handleChangePermission,
              isLocked: templateIsLocked,
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
  selectedTemplate: PropTypes.object,
  handleClose: PropTypes.func,
  actions: PropTypes.array,
}
