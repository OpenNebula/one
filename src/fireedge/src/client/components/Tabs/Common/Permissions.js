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

    String(response) === String(id) &&
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
          <ListItem key={category} className={classes.item} dense>
            {/* TITLE */}
            <Typography variant='body2' noWrap title={title}>
              {Tr(title)}
            </Typography>

            {/* PERMISSIONS */}
            {Object.entries(permissions)
              .filter(([key, _]) => key.toLowerCase().includes(category))
              .map(([key, permission]) => (
                <span key={key}>
                  <Action
                    cy={`permission-${key}`}
                    disabled={permission === undefined}
                    icon={
                      +permission ? <CheckIcon size={18} /> : <BlankSquareIcon size={18} />
                    }
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
