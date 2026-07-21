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

import { Component, useMemo } from 'react'

import { T, PATH, RESOURCE_NAMES } from '@ConstantsModule'

import { Box, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import {
  RefreshDouble,
  Edit,
  KeyframesCouple as CloneIcon,
  GitCommit as CommitIcon,
  Cancel,
  Trash,
} from 'iconoir-react'
import { useHistory } from 'react-router'
import { SecurityGroupAPI, useModalsApi } from '@FeaturesModule'
import { SecurityGroup } from '@ResourcesModule'
import {
  getLabelTags,
  getSecurityGroupResourceCount,
  getSecurityGroupRulesCount,
} from '@ModelsModule'
import { cloneObject, filterAttributes, jsonToXml } from '@UtilsModule'

const HIDDEN_ATTRIBUTES = /^(RULE)$/

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object} root0.selectedSecurityGroup - Selected Security Group
 * @param {Function} root0.handleClose - Handle close
 * @param {Array} root0.actions - Available actions
 * @returns {Component} - Single view details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedSecurityGroup = {},
  handleClose,
  actions,
}) => {
  const { palette } = useTheme()
  const history = useHistory()
  const { showModal } = useModalsApi()
  const [refreshSecGroup, { isFetching: isRefreshingSecGroup }] =
    SecurityGroupAPI.useLazyGetSecGroupQuery()

  const [rename, { isLoading: isRenaming }] =
    SecurityGroupAPI.useRenameSecGroupMutation()
  const [remove, { isLoading: isRemoving }] =
    SecurityGroupAPI.useRemoveSecGroupMutation()
  const [clone, { isLoading: isCloning }] =
    SecurityGroupAPI.useCloneSegGroupMutation()
  const [commit, { isLoading: isCommiting }] =
    SecurityGroupAPI.useCommitSegGroupMutation()

  const [updateSecGroup, { isLoading: isUpdatingSecGroup }] =
    SecurityGroupAPI.useUpdateSecGroupMutation()
  const [changePermissions, { isLoading: isChangingPermissions }] =
    SecurityGroupAPI.useChangeSecGroupPermissionsMutation()
  const [changeOwnership, { isLoading: isChangingOwnership }] =
    SecurityGroupAPI.useChangeSecGroupOwnershipMutation()
  const { isLoading: isLoadingExtended } = SecurityGroupAPI.useGetSecGroupQuery(
    { id: selectedSecurityGroup?.ID, extended: true },
    {
      skip: !selectedSecurityGroup?.ID,
      refetchOnMountOrArgChange: true,
    }
  )

  const { attributes } = filterAttributes(
    selectedSecurityGroup?.TEMPLATE ?? {},
    {
      hidden: HIDDEN_ATTRIBUTES,
    }
  )

  const secGroupAttributes = useMemo(
    () =>
      Object.entries(attributes ?? {})?.map(([key, value]) => ({
        key,
        value,
      })),
    [attributes]
  )

  const buildTemplateWithAttributes = (nextAttributes) => {
    const nextTemplate = cloneObject(selectedSecurityGroup?.TEMPLATE)

    Object.keys(attributes ?? {}).forEach((key) => {
      delete nextTemplate[key]
    })

    Object.assign(nextTemplate, nextAttributes)

    return nextTemplate
  }

  const handleDeleteAttribute = async (index) => {
    const newSecGroupAttributes = Object.fromEntries(
      secGroupAttributes
        ?.filter((_, idx) => index !== idx)
        ?.map(({ key, value }) => [key, value])
    )

    await updateSecGroup({
      id: selectedSecurityGroup?.ID,
      replace: 0,
      template: jsonToXml(buildTemplateWithAttributes(newSecGroupAttributes)),
    })
  }

  const handleAddAttribute = async (newEntry) => {
    if (String(newEntry?.key ?? '').match(HIDDEN_ATTRIBUTES)) return

    const newSecGroupAttributes = Object.fromEntries(
      [newEntry]
        ?.concat(secGroupAttributes)
        ?.map(({ key, value }) => [key, value])
    )

    await updateSecGroup({
      id: selectedSecurityGroup?.ID,
      replace: 0,
      template: jsonToXml(buildTemplateWithAttributes(newSecGroupAttributes)),
    })
  }

  const handleOpenCloneForm = () =>
    showModal({
      name: T.Clone,

      dialogProps: {
        title: T.Clone,
        dataCy: 'modal-clone',
      },

      onSubmit: async (cloneData) =>
        await clone({ id: selectedSecurityGroup?.ID, ...cloneData }),
      form: SecurityGroup.Forms.CloneForm({
        stepProps: { isMultiple: false },
        initialValues: { name: `Copy of ${selectedSecurityGroup?.NAME}` },
      }),
    })

  const handleOpenCommitForm = () =>
    showModal({
      name: T.Commit,

      dialogProps: {
        title: T.Confirm,
        dataCy: 'modal-commit',
      },

      form: SecurityGroup.Forms.CommitForm(),

      onSubmit: async (formData = {}) => {
        const { recover } = formData
        await commit({ id: selectedSecurityGroup?.ID, recover })
      },
    })

  const handleOpenDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: `${T.Delete} ${T.SecurityGroups}`,
        dataCy: 'modal-delete',
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={selectedSecurityGroup}
            resourceType={T.SecurityGroups}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await remove({ id: selectedSecurityGroup?.ID })
        handleClose()
      },
    })

  const handleEdit = () => {
    history.push(PATH.NETWORK.SEC_GROUPS.CREATE, selectedSecurityGroup)
  }

  const handleRename = async (newName) => {
    await rename({ id: selectedSecurityGroup?.ID, name: newName })
  }

  const handleChangePermission = async (newPermission) => {
    await changePermissions({ id: selectedSecurityGroup?.ID, ...newPermission })
    await refreshSecGroup({ id: selectedSecurityGroup?.ID })
  }

  const handleChangeOwnership = async (newOwnership) => {
    await changeOwnership({ id: selectedSecurityGroup?.ID, ...newOwnership })
    await refreshSecGroup({ id: selectedSecurityGroup?.ID })
  }

  const isActionsDisabled =
    isRenaming ||
    isRemoving ||
    isCloning ||
    isUpdatingSecGroup ||
    isRefreshingSecGroup ||
    isChangingOwnership ||
    isChangingPermissions ||
    isCommiting

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
            title: selectedSecurityGroup?.NAME,
            id: selectedSecurityGroup?.ID,
            tags: getLabelTags(selectedSecurityGroup?.LABELS),
            dataCy: 'security-group',
            labels: [
              [T.Owner, selectedSecurityGroup?.UNAME],
              [T.Group, selectedSecurityGroup?.GNAME],
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
                        startIcon: <RefreshDouble width="16px" height="16px" />,
                        onClick: () =>
                          refreshSecGroup({ id: selectedSecurityGroup?.ID }),
                        value: 'refresh',
                        tooltip: T.Refresh,
                        isDisabled: isActionsDisabled,
                      },
                    ],

                    [
                      {
                        startIcon: <Edit width="16px" height="16px" />,
                        onClick: handleEdit,
                        value: 'edit',
                        'data-cy': 'action-update_dialog',
                        tooltip: T.Edit,
                        isDisabled: isActionsDisabled,
                      },
                      {
                        startIcon: <CloneIcon width="16px" height="16px" />,
                        onClick: handleOpenCloneForm,
                        value: 'clone',
                        'data-cy': 'action-clone',
                        tooltip: T.Clone,
                        isDisabled: isActionsDisabled,
                      },
                      {
                        startIcon: <CommitIcon width="16px" height="16px" />,
                        onClick: handleOpenCommitForm,
                        value: 'commit',
                        'data-cy': 'action-commit',
                        tooltip: T.Commit,
                        isDisabled: isActionsDisabled,
                      },
                    ],
                    [
                      {
                        ...getLabelMenuButtonProps({
                          selectedRows: [selectedSecurityGroup],
                          resourceType: RESOURCE_NAMES.SEC_GROUP,
                          isDisabled: isActionsDisabled,
                        }),
                      },
                      {
                        startIcon: <Edit width="16px" height="16px" />,
                        onClick: handleEdit,
                        value: 'edit',
                        tooltip: T.Edit,
                        isDisabled: isActionsDisabled,
                      },
                      {
                        startIcon: <RefreshDouble width="16px" height="16px" />,
                        onClick: () =>
                          refreshSecGroup({ id: selectedSecurityGroup?.ID }),
                        value: 'refresh',
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
                              color: isActionsDisabled
                                ? palette.text.disabled
                                : palette.icon.error,
                            }}
                          />
                        ),
                        onClick: handleOpenDeleteForm,
                        value: 'delete',
                        'data-cy': 'action-secGroups_delete',
                        tooltip: T.Delete,
                        isDestructive: true,
                        isDisabled: isActionsDisabled,
                      },
                      {
                        startIcon: <Cancel width="16px" height="16px" />,
                        onClick: handleClose,
                        value: 'close',
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
                String(getSecurityGroupRulesCount(selectedSecurityGroup)),
                T.Rules,
              ],
              [
                String(
                  getSecurityGroupResourceCount(
                    selectedSecurityGroup?.UPDATED_VMS
                  )
                ),
                T.UpdatedVms,
              ],
              [
                String(
                  getSecurityGroupResourceCount(
                    selectedSecurityGroup?.OUTDATED_VMS
                  )
                ),
                T.OutdatedVms,
              ],
              [
                String(
                  getSecurityGroupResourceCount(
                    selectedSecurityGroup?.ERROR_VMS
                  )
                ),
                T.ErrorVms,
              ],
            ]?.filter(([value]) => value !== undefined),
          },
        ],
        [
          TabSlot,
          {
            tabs: SecurityGroup.Tabs.Single,
            resourceId: SecurityGroup.RID,
            tabProps: {
              selected: selectedSecurityGroup,
              secGroupAttributes,
              isLoadingExtended,
              handleChangeOwnership,
              handleChangePermission,
              handleDeleteAttribute,
              handleAddAttribute,
              isActionsDisabled,
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
  selectedSecurityGroup: PropTypes.object,
  handleClose: PropTypes.func,
  actions: PropTypes.array,
}
