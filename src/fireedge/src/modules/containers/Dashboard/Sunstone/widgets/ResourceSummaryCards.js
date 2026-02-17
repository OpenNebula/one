/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { CircularProgress, Grid } from '@mui/material'
import {
  Database as DatastoreIcon,
  NetworkAlt as NetworkIcon,
  Server as HostIcon,
  ModernTv as VmsIcons,
} from 'iconoir-react'
import PropTypes from 'prop-types'
import { ReactElement, memo, useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import {
  DatastoreAPI,
  HostAPI,
  VmAPI,
  VnAPI,
  useViews,
} from '@FeaturesModule'

import { NumberEasing, PATH, Tr, WavesCard } from '@ComponentsModule'
import { RESOURCE_NAMES, T, VM_POOL_PAGINATION_SIZE } from '@ConstantsModule'
import { prettyBytes } from '@UtilsModule'
import { stringToBoolean } from '@ModelsModule'

const { VM, HOST, DATASTORE, VNET } = RESOURCE_NAMES

/**
 * Resource summary cards showing counts with live subtitles.
 *
 * @param {object} props - Props
 * @param {string} props.disableAnimations - Whether to disable animations
 * @param {string} props.view - Current view name
 * @returns {ReactElement} Grid of resource summary WavesCards
 */
const ResourceSummaryCards = memo(({ disableAnimations, view }) => {
  const { hasAccessToResource } = useViews()
  const { push: goTo } = useHistory()

  const vmAccess = useMemo(() => hasAccessToResource(VM), [view])
  const hostAccess = useMemo(() => hasAccessToResource(HOST), [view])
  const datastoreAccess = useMemo(() => hasAccessToResource(DATASTORE), [view])
  const vnetAccess = useMemo(() => hasAccessToResource(VNET), [view])

  const { data: vms = [], isFetching: isFetchingVms } =
    VmAPI.useGetVmsPaginatedQuery({
      extended: 0,
      pageSize: VM_POOL_PAGINATION_SIZE,
    })

  const { data: hosts = [], isFetching: isFetchingHosts } =
    HostAPI.useGetHostsQuery()

  const { data: datastores = [], isFetching: isFetchingDatastores } =
    DatastoreAPI.useGetDatastoresQuery()

  const { data: vnets = [], isFetching: isFetchingVnets } =
    VnAPI.useGetVNetworksQuery()

  const noAnimation = stringToBoolean(disableAnimations)

  // VM subtitle: count running VMs (STATE === '3' && LCM_STATE === '3')
  const runningCount = useMemo(
    () =>
      isFetchingVms
        ? null
        : vms.filter((vm) => vm?.STATE === '3' && vm?.LCM_STATE === '3')
            .length,
    [vms, isFetchingVms]
  )
  const vmSubtitle =
    runningCount != null ? Tr([T.NRunning, [runningCount]]) : null

  // Host subtitle: count monitored hosts (STATE === '2')
  const monitoredCount = useMemo(
    () =>
      isFetchingHosts
        ? null
        : hosts.filter((host) => host?.STATE === '2').length,
    [hosts, isFetchingHosts]
  )
  const hostSubtitle =
    monitoredCount != null ? Tr([T.NMonitored, [monitoredCount]]) : null

  // Datastore subtitle: total used / total capacity
  const datastoreSubtitle = useMemo(() => {
    if (isFetchingDatastores || !datastores?.length) return null

    let totalMB = 0
    let usedMB = 0

    datastores.forEach((ds) => {
      totalMB += parseInt(ds?.TOTAL_MB || '0', 10)
      usedMB += parseInt(ds?.USED_MB || '0', 10)
    })

    return `${prettyBytes(usedMB, 'MB', 1)} / ${prettyBytes(totalMB, 'MB', 1)}`
  }, [datastores, isFetchingDatastores])

  /**
   * Renders the count value with optional animation.
   *
   * @param {number} count - The count to display
   * @param {boolean} isFetching - Whether data is still loading
   * @returns {ReactElement|number} Animated or static count
   */
  const renderCount = (count, isFetching) => {
    if (isFetching) return <CircularProgress size={20} />

    if (noAnimation) return count

    return <NumberEasing value={count} />
  }

  return (
    <Grid
      container
      data-cy="dashboard-widget-total-sunstone-resources"
      spacing={3}
    >
      {vmAccess && (
        <Grid item xs={12} sm={6} md={3}>
          <WavesCard
            bgColor="#fa7892"
            icon={VmsIcons}
            text={T.VMs}
            value={renderCount(vms?.length, isFetchingVms)}
            subtitle={vmSubtitle}
            onClick={() => goTo(PATH.INSTANCE.VMS.LIST)}
          />
        </Grid>
      )}
      {hostAccess && (
        <Grid item xs={12} sm={6} md={3}>
          <WavesCard
            bgColor="#b25aff"
            icon={HostIcon}
            text={T.Hosts}
            value={renderCount(hosts?.length, isFetchingHosts)}
            subtitle={hostSubtitle}
            onClick={() => goTo(PATH.INFRASTRUCTURE.HOSTS.LIST)}
          />
        </Grid>
      )}
      {datastoreAccess && (
        <Grid item xs={12} sm={6} md={3}>
          <WavesCard
            bgColor="#1fbbc6"
            icon={DatastoreIcon}
            text={T.Datastores}
            value={renderCount(datastores?.length, isFetchingDatastores)}
            subtitle={datastoreSubtitle}
            onClick={() => goTo(PATH.STORAGE.DATASTORES.LIST)}
          />
        </Grid>
      )}
      {vnetAccess && (
        <Grid item xs={12} sm={6} md={3}>
          <WavesCard
            bgColor="#f09d42"
            icon={NetworkIcon}
            text={T.VirtualNetworks}
            value={renderCount(vnets?.length, isFetchingVnets)}
            onClick={() => goTo(PATH.NETWORK.VNETS.LIST)}
          />
        </Grid>
      )}
    </Grid>
  )
})

ResourceSummaryCards.displayName = 'ResourceSummaryCards'

ResourceSummaryCards.propTypes = {
  disableAnimations: PropTypes.string,
  view: PropTypes.string,
}

export { ResourceSummaryCards }
export default ResourceSummaryCards
