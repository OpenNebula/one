/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import { Button } from '@mui/material'
import { Group as GroupIcon, VerifiedBadge as SelectIcon } from 'iconoir-react'

import { useAuth, useAuthApi } from 'client/features/Auth'
import Search from 'client/components/Search'
import HeaderPopover from 'client/components/Header/Popover'
import { Translate } from 'client/components/HOC'
import { T, FILTER_POOL } from 'client/constants'

const { ALL_RESOURCES, PRIMARY_GROUP_RESOURCES } = FILTER_POOL

const Group = () => {
  const { user, groups, filterPool } = useAuth()
  const { changeGroup } = useAuthApi()

  const renderResult = ({ ID, NAME }, handleClose) => {
    const isSelected =
      (filterPool === ALL_RESOURCES && ALL_RESOURCES === ID) ||
      (filterPool === PRIMARY_GROUP_RESOURCES && user?.GID === ID)

    return (
      <Button
        key={`switcher-group-${ID}`}
        fullWidth
        tooltip={<Translate Word={T.Group} />}
        onClick={() => {
          ID && changeGroup({ id: user.ID, group: ID })
          handleClose()
        }}
        sx={{
          color: theme => theme.palette.text.primary,
          justifyContent: 'start',
          '& svg:first-of-type': { my: 0, mx: 2 }
        }}
      >
        {NAME}
        {isSelected && <SelectIcon />}
      </Button>
    )
  }

  const sortGroupAsMainFirst = (a, b) => {
    if (a.ID === user?.GUID) {
      return -1
    } else if (b.ID === user?.GUID) {
      return 1
    }
    return 0
  }

  const sortMainGroupFirst = groups
    ?.concat({ ID: ALL_RESOURCES, NAME: 'Show All' })
    ?.sort(sortGroupAsMainFirst)

  return (
    <HeaderPopover
      id='group-list'
      icon={<GroupIcon />}
      tooltip={<Translate word={T.SwitchGroup} />}
      buttonProps={{ 'data-cy': 'header-group-button' }}
      headerTitle={<Translate word={T.SwitchGroup} />}
    >
      {({ handleClose }) => (
        <Search
          list={sortMainGroupFirst}
          listOptions={{
            shouldSort: true,
            sortFn: sortGroupAsMainFirst,
            keys: ['NAME']
          }}
          maxResults={5}
          renderResult={group => renderResult(group, handleClose)}
        />
      )}
    </HeaderPopover>
  )
}

export default Group
