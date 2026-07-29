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
  SummarySlot,
  TabSlot,
  ButtonGroup,
  Button,
  ResourceActionConfirmation,
} from '@ComponentsV2Module'
import { T, STYLE_BUTTONS, USER_ACTIONS } from '@ConstantsModule'
import { UserAPI, useModalsApi } from '@FeaturesModule'
import { getUserState } from '@ModelsModule'
import { User } from '@ResourcesModule'
import { Box } from '@mui/material'
import { Cancel, OffTag, OnTag, Trash } from 'iconoir-react'
import PropTypes from 'prop-types'
import { Component, useMemo } from 'react'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isOpen - Is isOpen
 * @param {Array} root0.selectedUsers - Selected users
 * @param {Function} root0.handleClose - Handle close
 * @param {Function} root0.handleSelect - Handle select
 * @param {Function} root0.handleDeselect - Handle deselect
 * @returns {Component} - Aggregated view details drawer
 */
export const AggregatedView = ({
  isOpen = false,
  selectedUsers = [],
  handleClose,
  handleSelect,
  handleDeselect,
}) => {
  const { showModal } = useModalsApi()
  const [refreshUser, { isFetching }] = UserAPI.useLazyGetUserQuery()
  const [enable, { isLoading: isEnabling }] = UserAPI.useEnableUserMutation()
  const [disable, { isLoading: isDisabling }] = UserAPI.useDisableUserMutation()
  const [remove, { isLoading: isRemoving }] = UserAPI.useRemoveUserMutation()

  const handleRefresh = async () =>
    await Promise.all(selectedUsers.map(({ ID }) => refreshUser({ id: ID })))

  const handleConfirmAction = ({ title, description, onSubmit, dataCy }) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title,
        dataCy,
        description: (
          <ResourceActionConfirmation
            description={description}
            resources={selectedUsers}
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
        await Promise.all(selectedUsers.map(({ ID }) => enable(ID)))
        await handleRefresh()
      },
    })

  const handleDisable = () =>
    handleConfirmAction({
      title: T.Disable,
      description: T['resource.disable.confirmation'],
      dataCy: `modal-user_${USER_ACTIONS.DISABLE}`,
      onSubmit: async () => {
        await Promise.all(selectedUsers.map(({ ID }) => disable(ID)))
        await handleRefresh()
      },
    })

  const handleOpenDeleteForm = () =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        title: T?.['user.delete'],
        description: (
          <ResourceActionConfirmation
            description={T['resource.delete.confirmation']}
            resources={selectedUsers}
            resourceType={T.Users}
          />
        ),
        confirmLabel: T.Delete,
        confirmButtonProps: {
          isDestructive: true,
        },
      },
      onSubmit: async () => {
        await Promise.all(selectedUsers.map(({ ID }) => remove({ id: ID })))
        handleClose()
      },
    })

  const { enabledCount, disabledCount, groupCount, authDriverCount } =
    useMemo(() => {
      const groups = new Set()
      const authDrivers = new Set()

      return selectedUsers.reduce(
        (acc, user) => {
          const state = getUserState(user)

          user?.GNAME && groups.add(user.GNAME)
          user?.AUTH_DRIVER && authDrivers.add(user.AUTH_DRIVER)

          if (state?.shortName === 'on') {
            acc.enabledCount += 1
          } else {
            acc.disabledCount += 1
          }

          acc.groupCount = groups.size
          acc.authDriverCount = authDrivers.size

          return acc
        },
        {
          enabledCount: 0,
          disabledCount: 0,
          groupCount: 0,
          authDriverCount: 0,
        }
      )
    }, [selectedUsers])

  const isMutating = isFetching || isEnabling || isDisabling || isRemoving
  const allEnabled =
    selectedUsers?.length > 0 && enabledCount === selectedUsers.length
  const noneEnabled = selectedUsers?.length > 0 && enabledCount === 0

  return (
    <DetailsDrawer
      isOpen={isOpen}
      slots={[
        [
          InfoSlot,
          {
            title: `${selectedUsers?.length} ${T.Users} ${T.Selected}`,
            Toolbar: () => (
              <Box
                sx={(theme) => ({
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${theme.scale[500]}px`,
                })}
              >
                <ButtonGroup
                  selected={
                    allEnabled ? ['enable'] : noneEnabled ? ['disable'] : []
                  }
                  buttons={[
                    {
                      startIcon: <OnTag width="16px" height="16px" />,
                      onClick: handleEnable,
                      value: 'enable',
                      dataCy: `action-user_${USER_ACTIONS.ENABLE}`,
                      isDisabled: isMutating,
                    },
                    {
                      startIcon: <OffTag width="16px" height="16px" />,
                      onClick: handleDisable,
                      value: 'disable',
                      dataCy: `action-user_${USER_ACTIONS.DISABLE}`,
                      isDisabled: isMutating,
                    },
                  ]}
                />

                <Button
                  type={STYLE_BUTTONS.TYPE.PRIMARY}
                  size="small"
                  startIcon={<Trash width={'16px'} height={'16px'} />}
                  onClick={handleOpenDeleteForm}
                  isDestructive
                  isDisabled={isMutating}
                  data-cy={`action-user_${USER_ACTIONS.DELETE}`}
                >
                  {T.DeleteSelected}
                </Button>
                <Button
                  type={STYLE_BUTTONS.TYPE.TRANSPARENT}
                  size="small"
                  iconOnly={<Cancel width="16px" height="16px" />}
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
              [enabledCount, T.Enabled],
              [disabledCount, T.Disabled],
              [groupCount, T.Groups],
              [authDriverCount, T.AuthDriver],
            ],
          },
        ],
        [
          TabSlot,
          {
            tabs: User.Tabs.Aggregated,
            resourceId: User.RID,
            tabProps: {
              selected: selectedUsers,
              handleSelect,
              handleDeselect,
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
  selectedUsers: PropTypes.array,
  handleClose: PropTypes.func,
  handleSelect: PropTypes.func,
  handleDeselect: PropTypes.func,
}
