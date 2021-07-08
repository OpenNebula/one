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
import * as React from 'react'

import { Button } from '@material-ui/core'
import { Group as GroupIcon, VerifiedBadge as SelectIcon } from 'iconoir-react'

import { useAuth, useAuthApi } from 'client/features/Auth'
import Search from 'client/components/Search'

import { FILTER_POOL } from 'client/constants'
import HeaderPopover from 'client/components/Header/Popover'
import headerStyles from 'client/components/Header/styles'

const { ALL_RESOURCES, PRIMARY_GROUP_RESOURCES } = FILTER_POOL

/**
 *
 */
const Group = () => {
  const classes = headerStyles()
  const { user, groups, filterPool } = useAuth()
  const { changeGroup } = useAuthApi()

  const handleChangeGroup = group => {
    group && changeGroup({ id: user.ID, group })
  }

  const renderResult = ({ ID, NAME }, handleClose) => {
    const isSelected =
      (filterPool === ALL_RESOURCES && ALL_RESOURCES === ID) ||
      (filterPool === PRIMARY_GROUP_RESOURCES && user?.GID === ID)

    return (
      <Button
        key={`term-${ID}`}
        fullWidth
        className={classes.groupButton}
        onClick={() => {
          handleChangeGroup(ID)
          handleClose()
        }}
      >
        {NAME}
        {isSelected && <SelectIcon size='1em' />}
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
      id="group-list"
      icon={<GroupIcon />}
      buttonProps={{ 'data-cy': 'header-group-button', variant: 'outlined' }}
      headerTitle="Switch group"
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
