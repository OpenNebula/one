import * as React from 'react'

import {
  Server as ClusterIcon,
  HardDrive as HostIcon,
  Folder as DatastoreIcon,
  NetworkAlt as NetworkIcon
} from 'iconoir-react'

import { useOne } from 'client/features/One'
import Count from 'client/components/Count'
import { WavesCard } from 'client/components/Cards'
import { get } from 'client/utils'
import { T } from 'client/constants'

const TotalProvisionInfrastructures = () => {
  const { provisions } = useOne()

  const provisionsByProvider = React.useMemo(() =>
    provisions
      ?.map(provision => ({
        provider: get(provision, 'TEMPLATE.BODY.provider'),
        clusters: get(provision, 'TEMPLATE.BODY.provision.infrastructure.clusters', []).length,
        hosts: get(provision, 'TEMPLATE.BODY.provision.infrastructure.hosts', []).length,
        networks: get(provision, 'TEMPLATE.BODY.provision.infrastructure.networks', []).length,
        datastores: get(provision, 'TEMPLATE.BODY.provision.infrastructure.datastores', []).length
      }))
  , [provisions])

  const totals = React.useMemo(() =>
    provisionsByProvider?.reduce((total, { clusters, hosts, datastores, networks }) => ({
      clusters: clusters + total.clusters,
      hosts: hosts + total.hosts,
      datastores: datastores + total.datastores,
      networks: networks + total.networks
    }), { clusters: 0, hosts: 0, datastores: 0, networks: 0 })
  , [provisionsByProvider])

  return React.useMemo(() => (
    <div
      data-cy='dashboard-widget-total-infrastructures'
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gridGap: '2em'
      }}
    >
      <WavesCard
        text={T.Clusters}
        value={<Count number={`${totals.clusters}`} />}
        bgColor='#fa7892'
        icon={ClusterIcon}
      />
      <WavesCard
        text={T.Hosts}
        value={<Count number={`${totals.hosts}`} />}
        bgColor='#b25aff'
        icon={HostIcon}
      />
      <WavesCard
        text={T.Datastores}
        value={<Count number={`${totals.datastores}`} />}
        bgColor='#1fbbc6'
        icon={DatastoreIcon}
      />
      <WavesCard
        text={T.Networks}
        value={<Count number={`${totals.networks}`} />}
        bgColor='#f09d42'
        icon={NetworkIcon}
      />
    </div>
  ), [totals])
}

TotalProvisionInfrastructures.displayName = 'TotalProvisionInfrastructures'

export default TotalProvisionInfrastructures
