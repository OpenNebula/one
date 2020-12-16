import * as React from 'react'

import { Button } from '@material-ui/core'
import FilterIcon from '@material-ui/icons/FilterDrama'
import SelectedIcon from '@material-ui/icons/FilterVintage'

import { useAuth, useOpennebula } from 'client/hooks'
import Search from 'client/components/Search'

import { FILTER_POOL } from 'client/constants'
import HeaderPopover from 'client/components/Header/Popover'
import headerStyles from 'client/components/Header/styles'

const { ALL_RESOURCES, PRIMARY_GROUP_RESOURCES } = FILTER_POOL

const Group = () => {
  const classes = headerStyles()
  const { authUser, filterPool, setPrimaryGroup } = useAuth()
  const { groups } = useOpennebula()

  const handleChangeGroup = group => {
    group && setPrimaryGroup({ group })
  }

  const renderResult = ({ ID, NAME }, handleClose) => {
    const isSelected =
      (filterPool === ALL_RESOURCES && ALL_RESOURCES === ID) ||
      (filterPool === PRIMARY_GROUP_RESOURCES && authUser?.GID === ID)

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
        {isSelected && <SelectedIcon className={classes.groupSelectedIcon} />}
      </Button>
    )
  }

  const sortGroupAsMainFirst = (a, b) => {
    if (a.ID === authUser?.GUID) {
      return -1
    } else if (b.ID === authUser?.GUID) {
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
      icon={<FilterIcon />}
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
