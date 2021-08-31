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
import { useMemo } from 'react'

import {
  Server as ClusterIcon,
  HardDrive as HostIcon,
  Folder as DatastoreIcon,
  NetworkAlt as NetworkIcon
} from 'iconoir-react'
import { makeStyles } from '@material-ui/core'

import { useProvision } from 'client/features/One'
import NumberEasing from 'client/components/NumberEasing'
import { WavesCard } from 'client/components/Cards'
import { get } from 'client/utils'
import { T } from 'client/constants'

const useStyles = makeStyles(({ breakpoints }) => ({
  root: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gridGap: '2em'
  }
}))

const TotalProvisionInfrastructures = () => {
  const classes = useStyles()
  const provisions = useProvision()

  const provisionsByProvider = useMemo(() =>
    provisions
      ?.map(provision => ({
        provider: get(provision, 'TEMPLATE.BODY.provider'),
        clusters: get(provision, 'TEMPLATE.BODY.provision.infrastructure.clusters', []).length,
        hosts: get(provision, 'TEMPLATE.BODY.provision.infrastructure.hosts', []).length,
        networks: get(provision, 'TEMPLATE.BODY.provision.infrastructure.networks', []).length,
        datastores: get(provision, 'TEMPLATE.BODY.provision.infrastructure.datastores', []).length
      }))
  , [provisions])

  const totals = useMemo(() =>
    provisionsByProvider?.reduce((total, { clusters, hosts, datastores, networks }) => ({
      clusters: clusters + total.clusters,
      hosts: hosts + total.hosts,
      datastores: datastores + total.datastores,
      networks: networks + total.networks
    }), { clusters: 0, hosts: 0, datastores: 0, networks: 0 })
  , [provisionsByProvider])

  return useMemo(() => (
    <div
      data-cy='dashboard-widget-total-infrastructures'
      className={classes.root}
    >
      <WavesCard
        text={T.Clusters}
        value={<NumberEasing number={`${totals.clusters}`} />}
        bgColor='#fa7892'
        icon={ClusterIcon}
      />
      <WavesCard
        text={T.Hosts}
        value={<NumberEasing number={`${totals.hosts}`} />}
        bgColor='#b25aff'
        icon={HostIcon}
      />
      <WavesCard
        text={T.Datastores}
        value={<NumberEasing number={`${totals.datastores}`} />}
        bgColor='#1fbbc6'
        icon={DatastoreIcon}
      />
      <WavesCard
        text={T.Networks}
        value={<NumberEasing number={`${totals.networks}`} />}
        bgColor='#f09d42'
        icon={NetworkIcon}
      />
    </div>
  ), [totals])
}

TotalProvisionInfrastructures.displayName = 'TotalProvisionInfrastructures'

export default TotalProvisionInfrastructures
