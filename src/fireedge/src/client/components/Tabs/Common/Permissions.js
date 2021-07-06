import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, List, ListItem, Typography, Paper } from '@material-ui/core'
import { Check as CheckIcon, Square as BlankSquareIcon } from 'iconoir-react'

import { useVmApi } from 'client/features/One'
import { Action } from 'client/components/Cards/SelectCard'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

import * as Helper from 'client/models/Helper'

const CATEGORIES = [
  { title: T.Owner, category: 'owner' },
  { title: T.Group, category: 'group' },
  { title: T.Other, category: 'other' }
]

const useStyles = makeStyles(theme => ({
  list: {
    ...theme.typography.body2,
    '& > * > *': {
      width: '25%'
    }
  },
  title: {
    fontWeight: theme.typography.fontWeightBold,
    borderBottom: `1px solid ${theme.palette.divider}`
  }
}))

const Permissions = React.memo(({
  id,
  OWNER_U, OWNER_M, OWNER_A,
  GROUP_U, GROUP_M, GROUP_A,
  OTHER_U, OTHER_M, OTHER_A
}) => {
  const classes = useStyles()
  const { changePermissions } = useVmApi()

  const [permissions, setPermissions] = React.useState(() => ({
    ownerUse: OWNER_U,
    ownerManage: OWNER_M,
    ownerAdmin: OWNER_A,
    groupUse: GROUP_U,
    groupManage: GROUP_M,
    groupAdmin: GROUP_A,
    otherUse: OTHER_U,
    otherManage: OTHER_M,
    otherAdmin: OTHER_A
  }))

  const handleChange = async (name, value) => {
    const newPermission = { [name]: Helper.stringToBoolean(value) ? '0' : '1' }
    const response = await changePermissions(id, newPermission)

    String(response?.data) === String(id) &&
      setPermissions(prev => ({ ...prev, ...newPermission }))
  }

  return (
    <Paper variant='outlined'>
      <List className={classes.list}>
        <ListItem className={classes.title}>
          <Typography noWrap>{Tr(T.Permissions)}</Typography>
          <Typography noWrap>{Tr(T.Use)}</Typography>
          <Typography noWrap>{Tr(T.Manage)}</Typography>
          <Typography noWrap>{Tr(T.Admin)}</Typography>
        </ListItem>
        {CATEGORIES.map(({ title, category }) => (
          <ListItem key={category}>
            {/* TITLE */}
            <Typography noWrap>{Tr(title)}</Typography>

            {/* PERMISSIONS */}
            {Object.entries(permissions)
              .filter(([key, _]) => key.toLowerCase().includes(category))
              .map(([key, permission]) => (
                <span key={key}>
                  <Action
                    cy={`permission-${key}`}
                    disabled={permission === undefined}
                    icon={+permission ? <CheckIcon /> : <BlankSquareIcon />}
                    handleClick={() => handleChange(key, permission)}
                  />
                </span>
              ))
            }
          </ListItem>
        ))}
      </List>
    </Paper>
  )
})

Permissions.propTypes = {
  id: PropTypes.string.isRequired,
  OWNER_U: PropTypes.string.isRequired,
  OWNER_M: PropTypes.string.isRequired,
  OWNER_A: PropTypes.string.isRequired,
  GROUP_U: PropTypes.string.isRequired,
  GROUP_M: PropTypes.string.isRequired,
  GROUP_A: PropTypes.string.isRequired,
  OTHER_U: PropTypes.string.isRequired,
  OTHER_M: PropTypes.string.isRequired,
  OTHER_A: PropTypes.string.isRequired
}

Permissions.displayName = 'Permissions'

export default Permissions
