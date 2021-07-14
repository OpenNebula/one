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

import { makeStyles, List, ListItem, Typography, Paper, Divider } from '@material-ui/core'

import { useUserApi, useGroupApi, RESOURCES } from 'client/features/One'
import Attribute from 'client/components/Tabs/Common/Attribute'
import { Tr } from 'client/components/HOC'
import { T, SERVERADMIN_ID } from 'client/constants'

const useStyles = makeStyles(theme => ({
  item: {
    '& > *': {
      width: '50%'
    }
  },
  title: {
    fontWeight: theme.typography.fontWeightBold
  }
}))

const Ownership = React.memo(({
  userId,
  userName,
  groupId,
  groupName,
  handleEdit
}) => {
  const classes = useStyles()
  const { getUsers } = useUserApi()
  const { getGroups } = useGroupApi()

  const getUserOptions = async () => {
    const response = await getUsers()

    return response
      ?.[RESOURCES.user]
      ?.filter?.(({ ID } = {}) => ID !== SERVERADMIN_ID)
      ?.map?.(({ ID, NAME } = {}) => ({ text: NAME, value: ID })
      )
  }

  const getGroupOptions = async () => {
    const response = await getGroups()

    return response
      ?.[RESOURCES.group]
      ?.map?.(({ ID, NAME } = {}) => ({ text: NAME, value: ID })
      )
  }

  return (
    <Paper variant='outlined'>
      <List>
        <ListItem className={classes.title}>
          <Typography noWrap>{Tr(T.Ownership)}</Typography>
        </ListItem>
        <Divider />
        <ListItem className={classes.item}>
          <Attribute
            canEdit
            name={T.Owner}
            value={userName}
            valueInOptionList={userId}
            handleGetOptionList={getUserOptions}
            handleEdit={user => handleEdit?.({ user })}
          />
        </ListItem>
        <ListItem className={classes.item}>
          <Attribute
            canEdit
            name={T.Group}
            value={groupName}
            valueInOptionList={groupId}
            handleGetOptionList={getGroupOptions}
            handleEdit={group => handleEdit?.({ group })}
          />
        </ListItem>
      </List>
    </Paper>
  )
})

Ownership.propTypes = {
  userId: PropTypes.string.isRequired,
  userName: PropTypes.string.isRequired,
  groupId: PropTypes.string.isRequired,
  groupName: PropTypes.string.isRequired,
  handleEdit: PropTypes.func
}

Ownership.displayName = 'Ownership'

export default Ownership
