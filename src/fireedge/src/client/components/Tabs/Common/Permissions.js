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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { List, ListItem, Typography, Paper } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { Check as CheckIcon, Square as BlankSquareIcon } from 'iconoir-react'

import { Action } from 'client/components/Cards/SelectCard'
import { Tr } from 'client/components/HOC'
import { T, ACTIONS } from 'client/constants'

import * as Helper from 'client/models/Helper'

const CATEGORIES = [
  { title: T.Owner, category: 'owner' },
  { title: T.Group, category: 'group' },
  { title: T.Other, category: 'other' },
]

const useStyles = makeStyles((theme) => ({
  list: {
    '& > * > *': {
      width: '25%',
    },
  },
  title: {
    fontWeight: theme.typography.fontWeightBold,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}))

const Permissions = memo(({ handleEdit, actions, ...permissions }) => {
  const classes = useStyles()

  const handleChange = async (name, value) => {
    const newPermission = {
      [name]: Helper.stringToBoolean(value) ? '0' : '1',
    }

    await handleEdit?.(newPermission)
  }

  const getIcon = (checked) => (+checked ? <CheckIcon /> : <BlankSquareIcon />)

  return (
    <Paper variant="outlined" sx={{ height: 'fit-content' }}>
      <List className={classes.list}>
        <ListItem className={classes.title}>
          <Typography noWrap>{Tr(T.Permissions)}</Typography>
          <Typography noWrap>{Tr(T.Use)}</Typography>
          <Typography noWrap>{Tr(T.Manage)}</Typography>
          <Typography noWrap>{Tr(T.Admin)}</Typography>
        </ListItem>
        {CATEGORIES.map(({ title, category }) => (
          <ListItem key={category} className={classes.item} dense>
            {/* TITLE */}
            <Typography variant="body2" noWrap title={title}>
              {Tr(title)}
            </Typography>

            {/* PERMISSIONS */}
            {Object.entries(permissions)
              .filter(([key, _]) => key.toLowerCase().startsWith(category))
              .map(([key, permission]) => (
                <span key={key}>
                  {actions?.includes?.(ACTIONS.CHANGE_MODE) ? (
                    <Action
                      cy={`permission-${key}`}
                      disabled={permission === undefined}
                      icon={getIcon(permission)}
                      value={permission}
                      handleClick={() => handleChange(key, permission)}
                    />
                  ) : (
                    getIcon(permission)
                  )}
                </span>
              ))}
          </ListItem>
        ))}
      </List>
    </Paper>
  )
})

Permissions.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  groupAdmin: PropTypes.string.isRequired,
  groupManage: PropTypes.string.isRequired,
  groupUse: PropTypes.string.isRequired,
  handleEdit: PropTypes.func,
  otherAdmin: PropTypes.string.isRequired,
  otherManage: PropTypes.string.isRequired,
  otherUse: PropTypes.string.isRequired,
  ownerAdmin: PropTypes.string.isRequired,
  ownerManage: PropTypes.string.isRequired,
  ownerUse: PropTypes.string.isRequired,
}

Permissions.displayName = 'Permissions'

export default Permissions
