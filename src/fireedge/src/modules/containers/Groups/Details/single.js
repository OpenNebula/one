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
  TabSlot,
  ToggleGroup,
} from '@ComponentsV2Module'

import { PATH, T } from '@ConstantsModule'
import { GroupAPI, useModalsApi } from '@FeaturesModule'
import { Group } from '@ResourcesModule'
import { getTotalOfResources } from '@UtilsModule'
import { Box, useTheme } from '@mui/material'
import { Cancel, Edit, RefreshDouble, Trash } from 'iconoir-react'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { useHistory } from 'react-router'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is open
 * @param {object} root0.selectedGroup - Selected Group
 * @param {Function} root0.handleClose - Handle close
 * @returns {Component} - Single view details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedGroup = {},
  handleClose,
}) => {
  const { palette } = useTheme()
  const history = useHistory()
  const { showModal } = useModalsApi()
  const [refreshGroup, { data: refreshedGroup = {}, isFetching }] =
    GroupAPI.useLazyGetGroupQuery()
  const [remove, { isLoading: isRemoving }] = GroupAPI.useRemoveGroupMutation()

  const group =
    String(refreshedGroup?.ID) === String(selectedGroup?.ID)
      ? refreshedGroup
      : selectedGroup
  const { ID, NAME, USERS } = group
  const groupId = String(ID)
  const totalUsers = getTotalOfResources(USERS)

  const handleRefresh = () => ID !== undefined && refreshGroup({ id: ID })

  const handleUpdate = () => {
    history.push(PATH.SYSTEM.GROUPS.CREATE, group)
  }

  const handleOpenDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: [T.Delete, T.Group].filter(Boolean).join(' '),
        dataCy: 'modal-delete-group',
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={group}
            resourceType={T.Groups}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await remove({ id: ID })
        handleClose()
      },
    })

  const isActionsDisabled = isFetching || isRemoving

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: NAME,
            id: ID,
            labels: [[T.Users, totalUsers]],
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: theme.scale[500] + 'px',
                })}
              >
                <ToggleGroup
                  size="medium"
                  options={[
                    [
                      {
                        startIcon: <Edit width="16px" height="16px" />,
                        onClick: handleUpdate,
                        value: 'update',
                        'data-cy': 'action-update_dialog',
                        isDisabled: isActionsDisabled,
                      },
                      {
                        startIcon: <RefreshDouble width="16px" height="16px" />,
                        onClick: handleRefresh,
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
                        'data-cy': 'action-group-delete',
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
          TabSlot,
          {
            tabs: Group.Tabs.Single,
            resourceId: Group.RID,
            tabProps: {
              groupId,
              selected: group,
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
  selectedGroup: PropTypes.object,
  handleClose: PropTypes.func,
}
