import * as React from 'react'

import { Container, Box, Grid } from '@material-ui/core'

import { useFetchAll, useProvision } from 'client/hooks'
import * as Widgets from 'client/components/Widgets'

function Dashboard () {
  const { getProviders, getProvisions } = useProvision()
  const { fetchRequestAll } = useFetchAll()

  React.useEffect(() => {
    fetchRequestAll([getProviders(), getProvisions()])
  }, [])

  return (
    <Container disableGutters>
      <Box py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Widgets.TotalProvisionInfrastructures />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Widgets.TotalProviders />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Widgets.TotalProvisionsByState />
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}

export default Dashboard
