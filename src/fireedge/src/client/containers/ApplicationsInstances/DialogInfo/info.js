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

import clsx from 'clsx'
import { List, ListItem, Typography, Grid, Paper, Divider } from '@mui/material'
import { Check as CheckIcon, Square as BlankSquareIcon } from 'iconoir-react'

import useStyles from 'client/containers/ApplicationsInstances/DialogInfo/styles'
import { StatusChip } from 'client/components/Status'
import { APPLICATION_STATES } from 'client/constants/flow'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const InfoTab = memo(({ info }) => {
  const classes = useStyles()
  const { ID, TEMPLATE, UNAME, GNAME, PERMISSIONS } = info
  const {
    name,
    deployment,
    state,
    ready_status_gate: gate,
    shutdown_action: shutdown,
  } = TEMPLATE?.BODY

  const stateInfo = APPLICATION_STATES[state]

  const isChecked = (checked) =>
    checked === '1' ? <CheckIcon /> : <BlankSquareIcon />

  return (
    <Grid container spacing={1}>
      <Grid item xs={12} md={6}>
        <Paper variant="outlined">
          <List className={clsx(classes.list, 'w-50')}>
            <ListItem className={classes.title}>
              <Typography>{Tr(T.Information)}</Typography>
            </ListItem>
            <Divider />
            <ListItem>
              <Typography>{'ID'}</Typography>
              <Typography>{ID}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.Name)}</Typography>
              <Typography>{name}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.Strategy)}</Typography>
              <Typography>{deployment}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.ShutdownAction)}</Typography>
              <Typography>{shutdown ?? '-'}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.State)}</Typography>
              <StatusChip
                stateColor={stateInfo?.color}
                text={stateInfo?.name}
              />
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.ReadyStatusGate)}</Typography>
              <Typography>{gate ? 'yes' : 'no'}</Typography>
            </ListItem>
          </List>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" className={classes.permissions}>
          <List className={clsx(classes.list, 'w-25')}>
            <ListItem className={classes.title}>
              <Typography>{Tr(T.Permissions)}</Typography>
              <Typography>{Tr(T.Use)}</Typography>
              <Typography>{Tr(T.Manage)}</Typography>
              <Typography>{Tr(T.Admin)}</Typography>
            </ListItem>
            <Divider />
            <ListItem>
              <Typography>{Tr(T.Owner)}</Typography>
              <Typography>{isChecked(PERMISSIONS.OWNER_U)}</Typography>
              <Typography>{isChecked(PERMISSIONS.OWNER_M)}</Typography>
              <Typography>{isChecked(PERMISSIONS.OWNER_A)}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.Group)}</Typography>
              <Typography>{isChecked(PERMISSIONS.GROUP_U)}</Typography>
              <Typography>{isChecked(PERMISSIONS.GROUP_M)}</Typography>
              <Typography>{isChecked(PERMISSIONS.GROUP_A)}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.Other)}</Typography>
              <Typography>{isChecked(PERMISSIONS.OTHER_U)}</Typography>
              <Typography>{isChecked(PERMISSIONS.OTHER_M)}</Typography>
              <Typography>{isChecked(PERMISSIONS.OTHER_A)}</Typography>
            </ListItem>
          </List>
        </Paper>
        <Paper variant="outlined">
          <List className={clsx(classes.list, 'w-50')}>
            <ListItem className={classes.title}>
              <Typography>{Tr(T.Ownership)}</Typography>
            </ListItem>
            <Divider />
            <ListItem>
              <Typography>{Tr(T.Owner)}</Typography>
              <Typography>{UNAME}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.Group)}</Typography>
              <Typography>{GNAME}</Typography>
            </ListItem>
          </List>
        </Paper>
      </Grid>
    </Grid>
  )
})

InfoTab.propTypes = {
  info: PropTypes.object.isRequired,
}

InfoTab.defaultProps = {
  info: {},
}

InfoTab.displayName = 'InfoTab'

export default InfoTab
