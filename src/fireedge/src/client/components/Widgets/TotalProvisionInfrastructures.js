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
/* eslint-disable jsdoc/require-jsdoc */
import { useMemo } from 'react'

import {
  Server as ClusterIcon,
  HardDrive as HostIcon,
  Folder as DatastoreIcon,
  NetworkAlt as NetworkIcon,
} from 'iconoir-react'
import { Skeleton, Grid } from '@mui/material'

import { useProvision } from 'client/features/One'
import NumberEasing from 'client/components/NumberEasing'
import { WavesCard } from 'client/components/Cards'
import { get } from 'client/utils'
import { T } from 'client/constants'

const TOTAL_WIDGETS = 4
const breakpoints = { xs: 12, sm: 6, md: 3 }

const TotalProvisionInfrastructures = ({ isLoading }) => {
  const provisions = useProvision()

  const provisionsByProvider = useMemo(
    () =>
      provisions?.map((provision) => ({
        provider: get(provision, 'TEMPLATE.BODY.provider'),
        clusters: get(
          provision,
          'TEMPLATE.BODY.provision.infrastructure.clusters',
          []
        ).length,
        hosts: get(
          provision,
          'TEMPLATE.BODY.provision.infrastructure.hosts',
          []
        ).length,
        networks: get(
          provision,
          'TEMPLATE.BODY.provision.infrastructure.networks',
          []
        ).length,
        datastores: get(
          provision,
          'TEMPLATE.BODY.provision.infrastructure.datastores',
          []
        ).length,
      })),
    [provisions]
  )

  const totals = useMemo(
    () =>
      provisionsByProvider?.reduce(
        (total, { clusters, hosts, datastores, networks }) => ({
          clusters: clusters + total.clusters,
          hosts: hosts + total.hosts,
          datastores: datastores + total.datastores,
          networks: networks + total.networks,
        }),
        { clusters: 0, hosts: 0, datastores: 0, networks: 0 }
      ),
    [provisionsByProvider]
  )

  return useMemo(
    () => (
      <Grid
        data-cy="dashboard-widget-total-infrastructures"
        container
        spacing={3}
      >
        {!totals?.clusters?.length && isLoading ? (
          Array.from(Array(TOTAL_WIDGETS)).map((_, index) => (
            <Grid item {...breakpoints} key={index}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))
        ) : (
          <>
            <Grid item {...breakpoints}>
              <WavesCard
                text={T.Clusters}
                value={<NumberEasing value={`${totals.clusters}`} />}
                bgColor="#fa7892"
                icon={ClusterIcon}
              />
            </Grid>
            <Grid item {...breakpoints}>
              <WavesCard
                text={T.Hosts}
                value={<NumberEasing value={`${totals.hosts}`} />}
                bgColor="#b25aff"
                icon={HostIcon}
              />
            </Grid>
            <Grid item {...breakpoints}>
              <WavesCard
                text={T.Datastores}
                value={<NumberEasing value={`${totals.datastores}`} />}
                bgColor="#1fbbc6"
                icon={DatastoreIcon}
              />
            </Grid>
            <Grid item {...breakpoints}>
              <WavesCard
                text={T.Networks}
                value={<NumberEasing value={`${totals.networks}`} />}
                bgColor="#f09d42"
                icon={NetworkIcon}
              />
            </Grid>
          </>
        )}
      </Grid>
    ),
    [totals?.clusters, isLoading]
  )
}

TotalProvisionInfrastructures.displayName = 'TotalProvisionInfrastructures'

export default TotalProvisionInfrastructures
