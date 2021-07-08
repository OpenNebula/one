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

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const useStyles = makeStyles(theme => ({
  list: {
    '& p': {
      ...theme.typography.body2,
      width: '50%'
    }
  },
  title: {
    fontWeight: theme.typography.fontWeightBold
  }
}))

const Ownership = React.memo(({ userName, groupName }) => {
  const classes = useStyles()

  return (
    <Paper variant='outlined'>
      <List className={classes.list}>
        <ListItem className={classes.title}>
          <Typography noWrap>{Tr(T.Ownership)}</Typography>
        </ListItem>
        <Divider />
        <ListItem>
          <Typography noWrap>{Tr(T.Owner)}</Typography>
          <Typography noWrap>{userName}</Typography>
        </ListItem>
        <ListItem>
          <Typography>{Tr(T.Group)}</Typography>
          <Typography>{groupName}</Typography>
        </ListItem>
      </List>
    </Paper>
  )
})

Ownership.propTypes = {
  userName: PropTypes.string.isRequired,
  groupName: PropTypes.string.isRequired
}

Ownership.displayName = 'Ownership'

export default Ownership
