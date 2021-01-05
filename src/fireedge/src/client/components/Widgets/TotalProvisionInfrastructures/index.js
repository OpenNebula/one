import * as React from 'react'

import {
  Storage as ClusterIcon,
  VideogameAsset as HostIcon,
  FolderOpen as DatastoreIcon,
  AccountTree as NetworkIcon
} from '@material-ui/icons'

import { useProvision } from 'client/hooks'
import { WavesCard } from 'client/components/Cards'
import { get } from 'client/utils'
import { T } from 'client/constants'

import useStyles from 'client/components/Widgets/TotalProvisionInfrastructures/styles'

const TotalProvisionInfrastructures = () => {
  const { provisions } = useProvision()
  const classes = useStyles()

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
      className={classes.root}
    >
      <WavesCard
        text={T.Clusters}
        value={totals.clusters}
        bgColor='#fa7892'
        icon={ClusterIcon}
      />
      <WavesCard
        text={T.Hosts}
        value={totals.hosts}
        bgColor='#b25aff'
        icon={HostIcon}
      />
      <WavesCard
        text={T.Datastores}
        value={totals.datastores}
        bgColor='#1fbbc6'
        icon={DatastoreIcon}
      />
      <WavesCard
        text={T.Networks}
        value={totals.networks}
        bgColor='#f09d42'
        icon={NetworkIcon}
      />
    </div>
  ), [totals])
}

TotalProvisionInfrastructures.displayName = 'TotalProvisionInfrastructures'

export default TotalProvisionInfrastructures
