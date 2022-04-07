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
import { memo, ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Container, Box, Grid, CircularProgress } from '@mui/material'
import {
  Server as ClusterIcon,
  HardDrive as HostIcon,
  Folder as DatastoreIcon,
  NetworkAlt as NetworkIcon,
} from 'iconoir-react'

import { useAuth } from 'client/features/Auth'
import { useGetResourceQuery } from 'client/features/OneApi/provision'

import {
  TotalProviders,
  TotalProvisionsByState,
} from 'client/components/Widgets'
import NumberEasing from 'client/components/NumberEasing'
import WavesCard from 'client/components/Cards/WavesCard'
import { stringToBoolean } from 'client/models/Helper'
import { T } from 'client/constants'

/** @returns {ReactElement} Provision dashboard container */
function ProvisionDashboard() {
  const { settings: { DISABLE_ANIMATIONS } = {} } = useAuth()

  return (
    <Container
      disableGutters
      {...(stringToBoolean(DISABLE_ANIMATIONS) && {
        sx: {
          '& *, & *::before, & *::after': {
            animation: 'none !important',
          },
        },
      })}
    >
      <Box py={3}>
        <Grid container spacing={3}>
          <Grid item container spacing={3} xs={12}>
            <ResourceWidget
              resource="cluster"
              bgColor="#fa7892"
              text={T.Clusters}
              icon={ClusterIcon}
            />
            <ResourceWidget
              resource="host"
              bgColor="#b25aff"
              text={T.Hosts}
              icon={HostIcon}
            />
            <ResourceWidget
              resource="datastore"
              bgColor="#1fbbc6"
              text={T.Datastores}
              icon={DatastoreIcon}
            />
            <ResourceWidget
              resource="network"
              bgColor="#f09d42"
              text={T.Networks}
              icon={NetworkIcon}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TotalProviders />
          </Grid>
          <Grid item xs={12} md={6}>
            <TotalProvisionsByState />
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}

const ResourceWidget = memo(({ resource, ...props }) => {
  const { data, isLoading } = useGetResourceQuery({ resource })
  const total = `${data?.length ?? 0}`

  return (
    <Grid item xs={12} sm={6} md={3} data-cy={`widget-total-${resource}`}>
      <WavesCard
        value={
          isLoading ? (
            <CircularProgress size={20} />
          ) : (
            <NumberEasing value={total} />
          )
        }
        {...props}
      />
    </Grid>
  )
})

ResourceWidget.displayName = 'ResourceWidget'

ResourceWidget.propTypes = {
  resource: PropTypes.string,
  text: PropTypes.string,
  bgColor: PropTypes.string,
  icon: PropTypes.any,
}

export default ProvisionDashboard
