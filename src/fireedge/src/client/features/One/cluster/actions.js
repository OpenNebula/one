import { createAction } from 'client/features/One/utils'
import { clusterService } from 'client/features/One/cluster/services'

export const getCluster = createAction('cluster', clusterService.getCluster)

export const getClusters = createAction(
  'cluster/pool',
  clusterService.getClusters,
  response => ({ clusters: response })
)
