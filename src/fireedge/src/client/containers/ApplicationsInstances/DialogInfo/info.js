import React from 'react'
import PropTypes from 'prop-types'

import { List, ListItem, Typography, Chip, Grid, Paper, Divider } from '@material-ui/core'
import { CheckBox, CheckBoxOutlineBlank } from '@material-ui/icons'
import clsx from 'clsx'

import useStyles from 'client/containers/ApplicationsInstances/DialogInfo/styles'
import { APPLICATION_STATES } from 'client/constants/states'
import { Tr } from 'client/components/HOC'

const InfoTab = React.memo(({ info }) => {
  const classes = useStyles()
  const { ID, TEMPLATE, UNAME, GNAME, PERMISSIONS } = info
  const {
    name,
    deployment,
    state,
    ready_status_gate: gate,
    shutdown_action: shutdown
  } = TEMPLATE?.BODY

  const isChecked = checked =>
    checked === '1' ? <CheckBox /> : <CheckBoxOutlineBlank />

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Paper variant="outlined">
          <List className={clsx(classes.list, 'w-50')}>
            <ListItem className={classes.title}>
              <Typography>{Tr('Information')}</Typography>
            </ListItem>
            <Divider />
            <ListItem>
              <Typography>{Tr('ID')}</Typography>
              <Typography>{ID}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr('Name')}</Typography>
              <Typography>{name}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr('Strategy')}</Typography>
              <Typography>{deployment}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr('Shutdown action')}</Typography>
              <Typography>{shutdown ?? '-'}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr('State')}</Typography>
              <Chip
                size="small"
                label={APPLICATION_STATES[state + 1]?.name}
              />
            </ListItem>
            <ListItem>
              <Typography>{Tr('Ready status gate')}</Typography>
              <Typography>{gate ? 'yes' : 'no'}</Typography>
            </ListItem>
          </List>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" className={classes.permissions}>
          <List className={clsx(classes.list, 'w-25')}>
            <ListItem className={classes.title}>
              <Typography>{Tr('Permissions')}</Typography>
              <Typography>{Tr('Use')}</Typography>
              <Typography>{Tr('Manage')}</Typography>
              <Typography>{Tr('Admin')}</Typography>
            </ListItem>
            <Divider />
            <ListItem>
              <Typography>{Tr('Owner')}</Typography>
              <Typography>{isChecked(PERMISSIONS.OWNER_U)}</Typography>
              <Typography>{isChecked(PERMISSIONS.OWNER_M)}</Typography>
              <Typography>{isChecked(PERMISSIONS.OWNER_A)}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr('Group')}</Typography>
              <Typography>{isChecked(PERMISSIONS.GROUP_U)}</Typography>
              <Typography>{isChecked(PERMISSIONS.GROUP_M)}</Typography>
              <Typography>{isChecked(PERMISSIONS.GROUP_A)}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr('Other')}</Typography>
              <Typography>{isChecked(PERMISSIONS.OTHER_U)}</Typography>
              <Typography>{isChecked(PERMISSIONS.OTHER_M)}</Typography>
              <Typography>{isChecked(PERMISSIONS.OTHER_A)}</Typography>
            </ListItem>
          </List>
        </Paper>
        <Paper variant="outlined">
          <List className={clsx(classes.list, 'w-50')}>
            <ListItem className={classes.title}>
              <Typography>{Tr('Ownership')}</Typography>
            </ListItem>
            <Divider />
            <ListItem>
              <Typography>{Tr('Owner')}</Typography>
              <Typography>{UNAME}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr('Group')}</Typography>
              <Typography>{GNAME}</Typography>
            </ListItem>
          </List>
        </Paper>
      </Grid>
    </Grid>
  )
})

InfoTab.propTypes = {
  info: PropTypes.object.isRequired
}

InfoTab.defaultProps = {
  info: {}
}

InfoTab.displayName = 'InfoTab'

export default InfoTab
