import * as React from 'react'

import clsx from 'clsx'
import { Container, Box, Grid } from '@material-ui/core'

import { useAuth } from 'client/features/Auth'
import { useFetchAll } from 'client/hooks'
import { useUserApi, useImageApi, useVNetworkApi } from 'client/features/One'

import * as Widgets from 'client/components/Widgets'
import dashboardStyles from 'client/containers/Dashboard/Provision/styles'

function Dashboard () {
  const { status, fetchRequestAll, STATUS } = useFetchAll()
  const { INIT, PENDING } = STATUS

  const { getUsers } = useUserApi()
  const { getImages } = useImageApi()
  const { getVNetworks } = useVNetworkApi()

  const { settings: { disableanimations } = {} } = useAuth()
  const classes = dashboardStyles({ disableanimations })

  const withoutAnimations = String(disableanimations).toUpperCase() === 'YES'

  React.useEffect(() => {
    fetchRequestAll([
      getUsers(),
      getImages(),
      getVNetworks()
    ])
  }, [])

  return (
    <Container
      disableGutters
      className={clsx({ [classes.withoutAnimations]: withoutAnimations })}
    >
      <Box py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Widgets.TotalSunstoneResources
              isLoading={[INIT, PENDING].includes(status)}
            />
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}

export default Dashboard
