import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { List, ListItem, Typography, Grid, Paper, Divider, Chip } from '@material-ui/core'
import { CheckBox, CheckBoxOutlineBlank } from '@material-ui/icons'
import clsx from 'clsx'

import useStyles from 'client/containers/Provisions/DialogInfo/styles'
import { Tr } from 'client/components/HOC'
import { T, PROVISIONS_STATES } from 'client/constants'

const Info = memo(({ data }) => {
  const classes = useStyles()
  const { ID, GNAME, UNAME, PERMISSIONS, TEMPLATE } = data
  const {
    state,
    description,
    name,
    provider: providerName,
    start_time: time,
    provision: { infrastructure = {} }
  } = TEMPLATE?.PROVISION_BODY

  const { id: clusterId = '', name: clusterName = '' } = infrastructure?.clusters?.[0] ?? {}
  const stateInfo = PROVISIONS_STATES[state]

  const isChecked = checked =>
    checked === '1' ? <CheckBox /> : <CheckBoxOutlineBlank />

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
              <Typography>{Tr(T.Description)}</Typography>
              <Typography>{description}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.ProviderLabel)}</Typography>
              <Typography>{providerName}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.ClustersLabel)}</Typography>
              <Typography>{`${clusterId} - ${clusterName}`}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.StartTime)}</Typography>
              <Typography>
                {new Date(time * 1000).toLocaleString()}
              </Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.State)}</Typography>
              <Chip
                size="small"
                label={stateInfo?.name}
                style={{ backgroundColor: stateInfo?.color }}
              />
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

Info.propTypes = {
  data: PropTypes.object.isRequired
}

Info.defaultProps = {
  data: {}
}

Info.displayName = 'Info'

export default Info
