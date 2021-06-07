import React, { memo, useState } from 'react'
import PropTypes from 'prop-types'

import { List, ListItem, Typography, Grid, Paper, Divider } from '@material-ui/core'
import { CheckBox, CheckBoxOutlineBlank, Visibility } from '@material-ui/icons'
import clsx from 'clsx'

import { useProviderApi } from 'client/features/One'
import { Action } from 'client/components/Cards/SelectCard'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

import useStyles from 'client/containers/Providers/Sections/styles'

const Info = memo(({ data }) => {
  const classes = useStyles()
  const { getProviderConnection } = useProviderApi()

  const [showConnection, setShowConnection] = useState(undefined)

  const { ID, NAME, GNAME, UNAME, PERMISSIONS, TEMPLATE } = data
  const {
    connection,
    description,
    provider: providerName,
    registration_time: time
  } = TEMPLATE?.PROVISION_BODY

  const hasConnection = connection && Object.keys(connection).length > 0

  const isChecked = checked =>
    checked === '1' ? <CheckBox /> : <CheckBoxOutlineBlank />

  const ConnectionButton = () => (
    <Action
      icon={<Visibility />}
      cy='provider-connection'
      handleClick={() => getProviderConnection(ID).then(setShowConnection)}
    />
  )

  return (
    <Grid container spacing={1}>
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" className={classes.marginBottom}>
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
              <Typography data-cy="provider-name">{NAME}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.Description)}</Typography>
              <Typography data-cy="provider-description" noWrap>{description}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.Provider)}</Typography>
              <Typography data-cy="provider-type">{providerName}</Typography>
            </ListItem>
            <ListItem>
              <Typography>{Tr(T.RegistrationTime)}</Typography>
              <Typography>
                {new Date(time * 1000).toLocaleString()}
              </Typography>
            </ListItem>
          </List>
        </Paper>
        {hasConnection && (
          <Paper variant="outlined">
            <List className={clsx(classes.list, 'w-50')}>
              <ListItem className={classes.title}>
                <Typography>{Tr(T.Credentials)}</Typography>
                <span className={classes.alignToRight}>
                  {!showConnection && <ConnectionButton />}
                </span>
              </ListItem>
              <Divider />
              {Object.entries(connection)?.map(([key, value]) =>
                typeof value === 'string' && (
                  <ListItem key={key}>
                    <Typography>{key}</Typography>
                    <Typography data-cy={`provider-${key}`}>
                      {showConnection?.[key] ?? value}
                    </Typography>
                  </ListItem>
                ))}
            </List>
          </Paper>
        )}
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" className={classes.marginBottom}>
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
