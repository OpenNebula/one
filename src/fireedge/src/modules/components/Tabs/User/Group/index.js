/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import { ReactElement, useMemo } from 'react'
import { generatePath, useHistory } from 'react-router-dom'

import { PATH } from '@modules/components/path'

import { GroupAPI, UserAPI, useGeneralApi } from '@FeaturesModule'
import { getActionsAvailable } from '@ModelsModule'

import { Box, Divider, Stack } from '@mui/material'

import { AddToGroup, ChangePrimaryGroup, RemoveFromGroup } from './Action'

import { T, USER_ACTIONS } from '@ConstantsModule'
import { GroupCard } from '@modules/components/Cards'
import { Tr } from '@modules/components/HOC'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Datastore id
 * @param {string} props.tabProps - Tab properties
 * @param {string} props.tabProps.actions - Actions for tab
 * @returns {ReactElement} Information tab
 */
const GroupsInfoTab = ({ tabProps: { actions } = {}, id: userId }) => {
  const path = PATH.SYSTEM.GROUPS.DETAIL
  const history = useHistory()
  const { enqueueSuccess } = useGeneralApi()
  const { data: groups = [], refetch } = GroupAPI.useGetGroupsQuery()
  const { data: user } = UserAPI.useGetUserQuery({ id: userId })
  const [addUser] = UserAPI.useAddGroupMutation()
  const [removeUser] = UserAPI.useRemoveFromGroupMutation()
  const [changeGroup] = UserAPI.useChangeGroupMutation()

  const USER_GROUPS = [].concat(user.GROUPS.ID ?? [])

  const actionsAvailable = getActionsAvailable(actions)

  const handleRowClick = (rowId) => {
    history.push(generatePath(path, { id: String(rowId) }))
  }

  const primaryGroupId = user?.GID ?? USER_GROUPS?.[0]

  const primaryGroup = useMemo(
    () =>
      groups.find(
        (group) =>
          group.ID === primaryGroupId ||
          String(group.ID) === String(primaryGroupId)
      ),
    [groups]
  )

  const secondaryGroups = useMemo(
    () =>
      groups.filter(
        (group) =>
          group?.ID !== primaryGroupId && USER_GROUPS?.includes(group?.ID)
      ),
    [groups]
  )

  /* Filter groups showing only the ones the user is not linked into */
  const filterGroupsNotLinked = (data) =>
    data.filter(
      (group) => !USER_GROUPS.some((userGroup) => userGroup === group.ID)
    )

  /* Filter groups showing only the ones the user is linked into and it's not its primary group */
  const filterGroupsLinked = (data) =>
    data.filter(
      (group) =>
        USER_GROUPS.some((userGroup) => userGroup === group.ID) &&
        group.ID !== primaryGroupId
    )

  /* Filter groups showing only the ones the user has not as primary group */
  const filterByNotPrimaryGroup = (data) =>
    data.filter((group) => group.ID !== primaryGroupId)

  const submitAddToGroup = async (groupsToAdd) => {
    await Promise.all(
      groupsToAdd.map((groupId) => addUser({ id: userId, group: groupId }))
    )

    refetch()

    // Success message
    enqueueSuccess(T['user.actions.edit.group.success'])
  }

  const submitRemoveFromGroup = async (groupsToAdd) => {
    await Promise.all(
      groupsToAdd.map((groupId) => removeUser({ id: userId, group: groupId }))
    )

    refetch()

    // Success message
    enqueueSuccess(T['user.actions.edit.group.success'])
  }

  const changePrimaryGroup = async (group) => {
    if (!group) return

    await changeGroup({ id: userId, group: group })

    refetch()

    // Success message
    enqueueSuccess(T['user.actions.edit.group.success'])
  }

  return (
    <Stack direction="column">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="start"
        gap="1rem"
        marginBottom="1rem"
      >
        {actionsAvailable?.includes?.(USER_ACTIONS.ADD_TO_GROUP) && (
          <AddToGroup
            groups={groups}
            filterData={filterGroupsNotLinked}
            submit={submitAddToGroup}
          />
        )}

        {actionsAvailable?.includes?.(USER_ACTIONS.REMOVE_FROM_GROUP) && (
          <RemoveFromGroup
            groups={groups}
            filterData={filterGroupsLinked}
            submit={submitRemoveFromGroup}
          />
        )}

        {actionsAvailable?.includes?.(USER_ACTIONS.CHANGE_PRIMARY_GROUP) && (
          <ChangePrimaryGroup
            groups={groups}
            filterData={filterByNotPrimaryGroup}
            submit={changePrimaryGroup}
          />
        )}
      </Stack>

      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: '0.5em',
          p: 2,
          mb: 2,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            transform: 'translateX(-50%)',
            left: '50%',
            backgroundColor: (theme) => theme.palette.primary.main,
            color: 'white',
            padding: '4px 12px',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
        >
          {Tr(T.PrimaryGroup)}
        </Box>
        <Box
          data-cy={'primary-group'}
          onClick={() => handleRowClick(primaryGroup.ID)}
        >
          <GroupCard rootProps={{}} group={primaryGroup} />
        </Box>
      </Box>

      {secondaryGroups.length > 0 && (
        <>
          <Divider />
          <Box
            sx={{
              mt: 7,
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -8,
                transform: 'translateX(-50%)',
                left: '50%',
                backgroundColor: (theme) => theme.palette.secondary.main,
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              {Tr(T.SecondaryGroups)}
            </Box>
            {secondaryGroups.map((group, index) => (
              <Box
                key={index}
                sx={{
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  borderRadius: '0.5em',
                  mb: 2,
                  p: 2,
                }}
              >
                <Box onClick={() => handleRowClick(group.ID)}>
                  <GroupCard group={group} />
                </Box>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Stack>
  )
}

GroupsInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

GroupsInfoTab.displayName = 'GroupsInfoTab'

export default GroupsInfoTab
