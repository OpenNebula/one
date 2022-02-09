/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { useEffect, JSXElementConstructor } from 'react'
import { Container, Box, Grid } from '@mui/material'

import { useAuth } from 'client/features/Auth'
import { useFetchAll } from 'client/hooks'
import { useProvisionApi, useProviderApi } from 'client/features/One'
import * as Widgets from 'client/components/Widgets'
import { stringToBoolean } from 'client/models/Helper'

/** @returns {JSXElementConstructor} Provision dashboard container */
function ProvisionDashboard() {
  const { status, fetchRequestAll, STATUS } = useFetchAll()
  const { INIT, PENDING } = STATUS

  const { getProvisions } = useProvisionApi()
  const { getProviders } = useProviderApi()

  const { settings: { disableanimations } = {} } = useAuth()

  useEffect(() => {
    fetchRequestAll([getProviders(), getProvisions()])
  }, [])

  return (
    <Container
      disableGutters
      {...(stringToBoolean(disableanimations) && {
        sx: {
          '& *, & *::before, & *::after': {
            animation: 'none !important',
          },
        },
      })}
    >
      <Box py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Widgets.TotalProvisionInfrastructures
              isLoading={[INIT, PENDING].includes(status)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Widgets.TotalProviders
              isLoading={[INIT, PENDING].includes(status)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Widgets.TotalProvisionsByState
              isLoading={[INIT, PENDING].includes(status)}
            />
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}

export default ProvisionDashboard
