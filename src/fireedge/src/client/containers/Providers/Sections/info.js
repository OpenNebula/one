import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { List, ListItem, Typography, Grid, Paper, Divider } from '@material-ui/core'
import { CheckBox, CheckBoxOutlineBlank } from '@material-ui/icons'
import clsx from 'clsx'

import useStyles from 'client/containers/Providers/Sections/styles'
import { Tr } from 'client/components/HOC'
import {
  Information,
  Name,
  ProviderLabel,
  RegistrationTime,
  Permissions,
  Use,
  Manage,
  Admin,
  Ownership,
  Owner,
  Group,
  Other
} from 'client/constants/translates'

const Info = memo(({ data }) => {
  const classes = useStyles()
  const { ID, NAME, GNAME, UNAME, PERMISSIONS, TEMPLATE } = data
  const {
    connection,
    provider: providerName,
    registration_time: time
  } = TEMPLATE?.PROVISION_BODY

  const isChecked = checked =>
    checked === '1' ? <CheckBox /> : <CheckBoxOutlineBlank />

  return (
    <Grid container spacing={1}>
      <Grid item xs={12} md={6}>
        <Paper variant="outlined">
          <List className={clsx(classes.list, 'w-50')}>
            <ListItem className={classes.title}>
              <Typography>{Tr(Information)}</Typography>
            </ListItem>
            <Divider />
            <ListItem>
              <Typography>{'ID'}</Typography>
              <Typography>{ID}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(Name)}</Typography>
              <Typography>{NAME}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(ProviderLabel)}</Typography>
              <Typography>{providerName}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(RegistrationTime)}</Typography>
              <Typography>
                {new Date(time * 1000).toLocaleString()}
              </Typography>
            </ListItem>
            {Object.entries(connection)?.map(([key, value]) =>
              typeof value === 'string' && (
                <ListItem key={key}>
                  <Typography>{key}</Typography>
                  <Typography>{value}</Typography>
                </ListItem>
              ))}
          </List>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" className={classes.permissions}>
          <List className={clsx(classes.list, 'w-25')}>
            <ListItem className={classes.title}>
              <Typography>{Tr(Permissions)}</Typography>
              <Typography>{Tr(Use)}</Typography>
              <Typography>{Tr(Manage)}</Typography>
              <Typography>{Tr(Admin)}</Typography>
            </ListItem>
            <Divider />
            <ListItem>
              <Typography>{Tr(Owner)}</Typography>
              <Typography>{isChecked(PERMISSIONS.OWNER_U)}</Typography>
              <Typography>{isChecked(PERMISSIONS.OWNER_M)}</Typography>
              <Typography>{isChecked(PERMISSIONS.OWNER_A)}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(Group)}</Typography>
              <Typography>{isChecked(PERMISSIONS.GROUP_U)}</Typography>
              <Typography>{isChecked(PERMISSIONS.GROUP_M)}</Typography>
              <Typography>{isChecked(PERMISSIONS.GROUP_A)}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(Other)}</Typography>
              <Typography>{isChecked(PERMISSIONS.OTHER_U)}</Typography>
              <Typography>{isChecked(PERMISSIONS.OTHER_M)}</Typography>
              <Typography>{isChecked(PERMISSIONS.OTHER_A)}</Typography>
            </ListItem>
          </List>
        </Paper>
        <Paper variant="outlined">
          <List className={clsx(classes.list, 'w-50')}>
            <ListItem className={classes.title}>
              <Typography>{Tr(Ownership)}</Typography>
            </ListItem>
            <Divider />
            <ListItem>
              <Typography>{Tr(Owner)}</Typography>
              <Typography>{UNAME}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(Group)}</Typography>
              <Typography>{GNAME}</Typography>
            </ListItem>
          </List>
        </Paper>
      </Grid>
    </Grid>
  )
})

Info.propTypes = {
  data: PropTypes.object.isRequired
}

Info.defaultProps = {
  data: {}
}

Info.displayName = 'Info'

export default Info
