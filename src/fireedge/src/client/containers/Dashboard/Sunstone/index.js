import * as React from 'react'

import clsx from 'clsx'
import { Container, Box, Grid } from '@material-ui/core'

import { useAuth } from 'client/features/Auth'
import { useUserApi, useGroupApi, useImageApi, useVNetworkApi } from 'client/features/One'
import * as Widgets from 'client/components/Widgets'
import dashboardStyles from 'client/containers/Dashboard/Provision/styles'

function Dashboard () {
  const { getUsers } = useUserApi()
  const { getGroups } = useGroupApi()
  const { getImages } = useImageApi()
  const { getVNetworks } = useVNetworkApi()

  const { settings: { disableanimations } = {} } = useAuth()
  const classes = dashboardStyles({ disableanimations })

  React.useEffect(() => {
    getUsers()
    getGroups()
    getImages()
    getVNetworks()
  }, [])

  const withoutAnimations = String(disableanimations).toUpperCase() === 'YES'

  return (
    <Container
      disableGutters
      className={clsx({ [classes.withoutAnimations]: withoutAnimations })}
    >
      <Box py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Widgets.TotalSunstoneResources />
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}

export default Dashboard
