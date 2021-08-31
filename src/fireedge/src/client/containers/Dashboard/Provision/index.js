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
/* eslint-disable jsdoc/require-jsdoc */
import { useEffect } from 'react'

import clsx from 'clsx'
import { Container, Box, Grid } from '@material-ui/core'

import { useAuth } from 'client/features/Auth'
import { useProvisionApi, useProviderApi } from 'client/features/One'
import * as Widgets from 'client/components/Widgets'
import dashboardStyles from 'client/containers/Dashboard/Provision/styles'

function Dashboard () {
  const { settings: { disableanimations } = {} } = useAuth()
  const { getProvisions } = useProvisionApi()
  const { getProviders } = useProviderApi()

  const classes = dashboardStyles({ disableanimations })

  useEffect(() => {
    getProviders()
    getProvisions()
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
