/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useHistory, generatePath } from 'react-router-dom'

import { PATH } from '@modules/components/path'

import { UserAPI, GroupAPI } from '@FeaturesModule'

import { Box, Divider } from '@mui/material'

import { T } from '@ConstantsModule'
import { Tr } from '@modules/components/HOC'
import { GroupCard } from '@modules/components/Cards'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Datastore id
 * @returns {ReactElement} Information tab
 */
const GroupsInfoTab = ({ id }) => {
  const path = PATH.SYSTEM.GROUPS.DETAIL
  const history = useHistory()
  const { data = [] } = GroupAPI.useGetGroupsQuery()
  const { data: user } = UserAPI.useGetUserQuery({ id })

  const USER_GROUPS = [].concat(user.GROUPS.ID ?? [])

  const handleRowClick = (rowId) => {
    history.push(generatePath(path, { id: String(rowId) }))
  }

  const primaryGroupId = user?.GID ?? USER_GROUPS?.[0]

  const primaryGroup = useMemo(
    () =>
      data.find(
        (group) =>
          group.ID === primaryGroupId ||
          String(group.ID) === String(primaryGroupId)
      ),
    [data]
  )

  const secondaryGroups = useMemo(
    () =>
      data.filter(
        (group) =>
          group?.ID !== primaryGroupId && USER_GROUPS?.includes(group?.ID)
      ),
    [data]
  )

  return (
    <div>
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
        <Box onClick={() => handleRowClick(primaryGroup.ID)}>
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
    </div>
  )
}

GroupsInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

GroupsInfoTab.displayName = 'GroupsInfoTab'

export default GroupsInfoTab
