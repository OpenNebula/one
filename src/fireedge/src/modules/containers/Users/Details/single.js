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
  ToggleGroup,
  TabSlot,
  ButtonGroup,
} from '@ComponentsV2Module'

import { T, USER_ACTIONS } from '@ConstantsModule'
import { UserAPI, useModalsApi } from '@FeaturesModule'
import { getUserState } from '@ModelsModule'
import { User } from '@ResourcesModule'
import { Box, useTheme } from '@mui/material'
import { Cancel, RefreshDouble, OffTag, OnTag, Trash } from 'iconoir-react'
import PropTypes from 'prop-types'
import { Component } from 'react'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {object} root0.selectedUser - Selected User
 * @param {Function} root0.handleClose - Handle close
 * @returns {Component} - Single view details drawer
 */
export const SingleView = ({
  isOpen = false,
  selectedUser = {},
  handleClose,
}) => {
  const { palette } = useTheme()
  const { showModal } = useModalsApi()
  const [refreshUser, { data: refreshedUser = {}, isFetching }] =
    UserAPI.useLazyGetUserQuery()
  const [enable, { isLoading: isEnabling }] = UserAPI.useEnableUserMutation()
  const [disable, { isLoading: isDisabling }] = UserAPI.useDisableUserMutation()
  const [remove, { isLoading: isRemoving }] = UserAPI.useRemoveUserMutation()

  const user =
    String(refreshedUser?.ID) === String(selectedUser?.ID)
      ? refreshedUser
      : selectedUser
  const { ID, NAME, GNAME, AUTH_DRIVER } = user
  const userId = String(ID)
  const userIsEnabled = getUserState(user)?.shortName === 'on'

  const handleRefresh = () => ID !== undefined && refreshUser({ id: ID })

  const handleConfirmAction = ({ title, description, onSubmit, dataCy }) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title,
        dataCy,
        description: (
          <ResourceActionConfirmation
            description={description}
            resources={user}
            resourceType={T.Users}
          />
        ),
        confirmLabel: title,
      },
      onSubmit,
    })

  const handleEnable = () =>
    handleConfirmAction({
      title: T.Enable,
      description: T['resource.enable.confirmation'],
      dataCy: `modal-user_${USER_ACTIONS.ENABLE}`,
      onSubmit: async () => {
        await enable(ID)
        await handleRefresh()
      },
    })

  const handleDisable = () =>
    handleConfirmAction({
      title: T.Disable,
      description: T['resource.disable.confirmation'],
      dataCy: `modal-user_${USER_ACTIONS.DISABLE}`,
      onSubmit: async () => {
        await disable(ID)
        await handleRefresh()
      },
    })

  const handleOpenDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T?.['user.delete'],
        dataCy: 'modal-delete',
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={user}
            resourceType={T.Users}
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

  const isActionsDisabled =
    isFetching || isEnabling || isDisabling || isRemoving

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: NAME,
            id: ID,
            labels: [
              [T.Group, GNAME],
              [T.AuthDriver, AUTH_DRIVER],
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
                  selected={[userIsEnabled ? 'enable' : 'disable']}
                  buttons={[
                    {
                      startIcon: <OnTag width="16px" height="16px" />,
                      onClick: handleEnable,
                      value: 'enable',
                      dataCy: `action-user_${USER_ACTIONS.ENABLE}`,
                      isDisabled: isActionsDisabled,
                    },
                    {
                      startIcon: <OffTag width="16px" height="16px" />,
                      onClick: handleDisable,
                      value: 'disable',
                      dataCy: `action-user_${USER_ACTIONS.DISABLE}`,
                      isDisabled: isActionsDisabled,
                    },
                  ]}
                />
                <ToggleGroup
                  size="medium"
                  options={[
                    [
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
                        'data-cy': `action-user_${USER_ACTIONS.DELETE}`,
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
            tabs: User.Tabs.Single,
            resourceId: User.RID,
            tabProps: {
              userId,
              selected: user,
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
  selectedUser: PropTypes.object,
  handleClose: PropTypes.func,
}
