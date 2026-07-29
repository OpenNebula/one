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
  ResourceActionConfirmation,
} from '@ComponentsV2Module'

import { Component, useEffect, useMemo } from 'react'
import { timeFromMilliseconds } from '@UtilsModule'
import { ServiceTemplate } from '@ResourcesModule'
import { getLabelTags } from '@ModelsModule'
import { T, PATH, RESOURCE_NAMES } from '@ConstantsModule'
import { Box, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import {
  RefreshDouble,
  Edit,
  KeyframesCouple as CloneIcon,
  Cancel,
  Trash,
  Play,
} from 'iconoir-react'
import { useHistory } from 'react-router'
import {
  VmTemplateAPI,
  ServiceTemplateAPI,
  useModalsApi,
} from '@FeaturesModule'

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
  const history = useHistory()
  const { palette } = useTheme()
  const { showModal } = useModalsApi()

  useEffect(() => {
    import('@modules/containers/VmTemplates/Details')
  }, [])

  const { data: vmTemplates = [], isFetching: isLoadingVMTemplates } =
    VmTemplateAPI.useGetTemplatesQuery()

  const [refreshTemplate, { isFetching: isRefreshingTemplate }] =
    ServiceTemplateAPI.useLazyGetServiceTemplateQuery()
  const [rename, { isLoading: isRenaming }] =
    ServiceTemplateAPI.useRenameServiceTemplateMutation()
  const [remove, { isLoading: isRemoving }] =
    ServiceTemplateAPI.useRemoveServiceTemplateMutation()
  const [clone, { isLoading: isCloning }] =
    ServiceTemplateAPI.useCloneServiceTemplateMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    ServiceTemplateAPI.useChangeServiceTemplatePermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    ServiceTemplateAPI.useChangeServiceTemplateOwnershipMutation()

  const handleOpenCloneForm = () =>
    showModal({
      name: T.Clone,
      dialogProps: {
        title: T.Clone,
        dataCy: 'modal-clone',
      },
      onSubmit: async (cloneData) =>
        await clone({ id: selectedTemplate?.ID, ...cloneData }),
      form: ServiceTemplate.Forms.CloneForm({
        stepProps: {},
        initialValues: {
          name: `Copy of ${selectedTemplate?.NAME}`,
        },
      }),
    })

  const handleOpenDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Delete} ${T.ServiceTemplate}`,
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={selectedTemplate}
            resourceType={T.ServiceTemplates}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await remove({ id: selectedTemplate?.ID })
        handleClose()
      },
    })

  const handleInstantiate = () =>
    history.push(PATH.TEMPLATE.SERVICES.INSTANTIATE, selectedTemplate)

  const handleEdit = () => {
    history.push(PATH.TEMPLATE.SERVICES.CREATE, selectedTemplate)
  }

  const handleRename = async (newName) => {
    await rename({ id: selectedTemplate?.ID, name: newName })
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
    isLoadingVMTemplates ||
    isCloning ||
    isRenaming ||
    isRemoving ||
    isRefreshingTemplate ||
    isChangingOwnership ||
    isChangingPermissions

  const vmTemplateIdMap = useMemo(
    () => Object.fromEntries(vmTemplates.map((t) => [String(t.ID), t])),
    [vmTemplates]
  )

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
            title: selectedTemplate?.NAME,
            id: selectedTemplate?.ID,
            tags: getLabelTags(selectedTemplate?.LABELS),
            labels: [
              [T.Owner, selectedTemplate?.UNAME],
              [T.Group, selectedTemplate?.GNAME],
              [
                `${T.Registered} ${timeFromMilliseconds(
                  +selectedTemplate?.TEMPLATE?.BODY?.registration_time
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
                <ToggleGroup
                  size="medium"
                  options={[
                    [
                      {
                        startIcon: <Play width="16px" height="16px" />,
                        onClick: handleInstantiate,
                        value: 'instantiate',
                        isDisabled: isActionsDisabled,
                      },
                      {
                        startIcon: <CloneIcon width="16px" height="16px" />,
                        onClick: handleOpenCloneForm,
                        value: 'clone',
                        isDisabled: isActionsDisabled,
                      },
                    ],
                    [
                      {
                        ...getLabelMenuButtonProps({
                          selectedRows: [selectedTemplate],
                          resourceType: RESOURCE_NAMES.SERVICE_TEMPLATE,
                          isDisabled: isActionsDisabled,
                        }),
                      },
                      {
                        startIcon: <Edit width="16px" height="16px" />,
                        onClick: handleEdit,
                        value: 'edit',
                        isDisabled: isActionsDisabled,
                      },
                      {
                        startIcon: <RefreshDouble width="16px" height="16px" />,
                        onClick: () =>
                          refreshTemplate({ id: selectedTemplate?.ID }),
                        value: 'refresh',
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
                              color: isActionsDisabled
                                ? palette.text.disabled
                                : palette.icon.error,
                            }}
                          />
                        ),
                        onClick: handleOpenDeleteForm,
                        value: 'delete',
                        isDisabled: isActionsDisabled,
                      },
                      {
                        startIcon: <Cancel width="16px" height="16px" />,
                        onClick: handleClose,
                        value: 'close',
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
                [].concat(selectedTemplate?.TEMPLATE?.BODY?.roles)?.length ?? 0,
                T.Roles,
              ],

              [
                Object?.keys(selectedTemplate?.TEMPLATE?.BODY?.networks ?? {})
                  ?.length ?? 0,
                T.Networks,
              ],
            ]?.filter(([value]) => value !== undefined),
          },
        ],
        [
          TabSlot,
          {
            tabs: ServiceTemplate.Tabs.Single,
            resourceId: ServiceTemplate.RID,
            tabProps: {
              selected: selectedTemplate,
              handleChangeOwnership,
              handleChangePermission,
              vmTemplateIdMap,
              isActionsDisabled,
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
