/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { Box } from '@mui/material'
import {
  BoxIso as ImagesIcon,
  Group as GroupIcon,
  ModernTv as VmsIcon,
  NetworkAlt as VnetsIcon,
  Plus as AddIcon,
  Server as HostsIcon,
  User as UserIcon,
} from 'iconoir-react'
import { ReactElement, useCallback, useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import {
  Button,
  DashboardCapacityCard,
  DashboardChartCard,
  DashboardHeader,
  DashboardHostsCard,
  DashboardPanel,
  DashboardPanelItem,
  DashboardResourceCard,
  DashboardSystemCard,
  Tag,
  Text,
} from '@ComponentsV2Module'
import {
  DASHBOARD_CARD_IDS,
  getDashboardCards,
} from '@modules/containers/Dashboard/config'
import {
  PATH,
  RESOURCE_NAMES,
  STATES,
  T,
  TEXT_VARIANTS,
  TEXT_WEIGHTS,
  UNITS,
} from '@ConstantsModule'
import {
  ClusterAPI,
  GroupAPI,
  HostAPI,
  ImageAPI,
  UserAPI,
  VnAPI,
  VmAPI,
  ZoneAPI,
  useGeneral,
  useViews,
} from '@FeaturesModule'
import {
  getHostState,
  getTotalLeases,
  getVirtualMachineState,
} from '@ModelsModule'
import { useResourceSingleViewContext, useTranslation } from '@ProvidersModule'
import {
  interpolationBytes,
  interpolationValue,
  prettyBytes,
} from '@UtilsModule'

const {
  CLUSTER: CLUSTER_RESOURCE,
  DASHBOARD,
  GROUP,
  HOST,
  IMAGE,
  USER,
  VM,
  VNET,
  ZONE,
} = RESOURCE_NAMES
const numberFormatter = new Intl.NumberFormat()
const HOST_UNAVAILABLE_STATES = [STATES.ERROR, STATES.MONITORING_ERROR]
const HOST_STATE_LABELS = {
  [STATES.INIT]: T.INIT,
  [STATES.MONITORING_INIT]: T.Monitoring,
  [STATES.MONITORING_MONITORED]: T.Monitoring,
  [STATES.MONITORED]: T.Monitored,
  [STATES.ERROR]: T.FAILED,
  [STATES.MONITORING_ERROR]: T.FAILED,
  [STATES.DISABLED]: T.Disabled,
  [STATES.MONITORING_DISABLED]: T.Disabled,
  [STATES.OFFLINE]: T.Offline,
}

const getPercentage = (value, total) =>
  +total > 0 ? ((+value || 0) * 100) / +total : 0

const formatMemory = (value) =>
  `${+value < 0 ? '-' : ''}${prettyBytes(Math.abs(+value || 0), UNITS.KB, 1)}`
const getMonitoringTimestamp = ({ TIMESTAMP }) =>
  new Date(parseInt(TIMESTAMP, 10) * 1000).getTime()
const countUniqueResources = (resources, idKey, nameKey) =>
  new Set(
    resources.flatMap((resource) => {
      const value = resource?.[idKey] ?? resource?.[nameKey]

      return value === undefined || value === null || value === ''
        ? []
        : [String(value)]
    })
  ).size

/** @returns {ReactElement} General dashboard container */
export default function GeneralDashboard() {
  const history = useHistory()
  const { translate } = useTranslation()
  const { openResourceSingleView } = useResourceSingleViewContext()
  const { zone } = useGeneral()
  const { getResourceView, hasAccessToResource } = useViews()
  const dashboardCards = getDashboardCards(getResourceView(DASHBOARD)?.cards)
  const dashboardCardIds = new Set(dashboardCards.map(({ id }) => id))
  const hasVirtualMachinesCard = dashboardCardIds.has(
    DASHBOARD_CARD_IDS.VIRTUAL_MACHINES
  )
  const hasVirtualNetworksCard = dashboardCardIds.has(
    DASHBOARD_CARD_IDS.VIRTUAL_NETWORKS
  )
  const hasImagesCard = dashboardCardIds.has(DASHBOARD_CARD_IDS.IMAGES)
  const hasHostsCard = dashboardCardIds.has(DASHBOARD_CARD_IDS.HOSTS)
  const hasHostsSummaryCard = dashboardCardIds.has(
    DASHBOARD_CARD_IDS.HOSTS_SUMMARY
  )
  const hasClusterCapacityCard = dashboardCardIds.has(
    DASHBOARD_CARD_IDS.CLUSTER_CAPACITY
  )
  const hasSystemCard = dashboardCardIds.has(DASHBOARD_CARD_IDS.SYSTEM)
  const hasVmMonitoringCharts = [
    DASHBOARD_CARD_IDS.CPU_CHART,
    DASHBOARD_CARD_IDS.MEMORY_CHART,
  ].some((id) => dashboardCardIds.has(id))
  const hasHostMonitoringCharts = [
    DASHBOARD_CARD_IDS.HOST_CPU_CHART,
    DASHBOARD_CARD_IDS.HOST_MEMORY_CHART,
  ].some((id) => dashboardCardIds.has(id))
  const shouldFetchVms = hasVirtualMachinesCard && hasAccessToResource(VM)
  const shouldFetchVnets = hasVirtualNetworksCard && hasAccessToResource(VNET)
  const shouldFetchImages = hasImagesCard && hasAccessToResource(IMAGE)
  const shouldFetchHosts =
    (hasHostsCard || hasHostsSummaryCard || hasClusterCapacityCard) &&
    hasAccessToResource(HOST)
  const shouldFetchClusters =
    (hasHostsCard || hasClusterCapacityCard) &&
    hasAccessToResource(CLUSTER_RESOURCE)
  const shouldFetchZones =
    (shouldFetchHosts || shouldFetchClusters) && hasAccessToResource(ZONE)
  const shouldFetchUsers = hasSystemCard && hasAccessToResource(USER)
  const shouldFetchGroups = hasSystemCard && hasAccessToResource(GROUP)
  const canCreateVm = getResourceView(VM)?.actions?.create_dialog
  const canCreateHost = getResourceView(HOST)?.actions?.create_dialog
  const {
    data: zones = [],
    isLoading: isLoadingZones,
    isFetching: isFetchingZones,
    refetch: refetchZones,
  } = ZoneAPI.useGetZonesQuery(undefined, { skip: !shouldFetchZones })
  const {
    data: clusters = [],
    isLoading: isLoadingClusters,
    isFetching: isFetchingClusters,
    refetch: refetchClusters,
  } = ClusterAPI.useGetClustersQuery({ zone }, { skip: !shouldFetchClusters })
  const {
    data: hosts = [],
    isLoading: isLoadingHosts,
    isFetching: isFetchingHosts,
    refetch: refetchHosts,
  } = HostAPI.useGetHostsQuery({ zone }, { skip: !shouldFetchHosts })
  const {
    data: hostMonitoringData = {},
    isFetching: isFetchingHostMonitoring,
    refetch: refetchHostMonitoring,
  } = HostAPI.useGetHostMonitoringPoolQuery(
    { seconds: 3600 },
    { skip: !hasHostMonitoringCharts }
  )
  const {
    data: vms = [],
    isLoading: isLoadingVms,
    isFetching: isFetchingVms,
    refetch: refetchVms,
  } = VmAPI.useGetVmsQuery({ extended: false }, { skip: !shouldFetchVms })
  const {
    data: vmMonitoringData = {},
    isFetching: isFetchingVmMonitoring,
    refetch: refetchVmMonitoring,
  } = VmAPI.useGetMonitoringPoolQuery(
    { seconds: 3600 },
    { skip: !hasVmMonitoringCharts }
  )
  const {
    data: vnets = [],
    isLoading: isLoadingVnets,
    isFetching: isFetchingVnets,
    refetch: refetchVnets,
  } = VnAPI.useGetVNetworksQuery({ zone }, { skip: !shouldFetchVnets })
  const {
    data: images = [],
    isLoading: isLoadingImages,
    isFetching: isFetchingImages,
    refetch: refetchImages,
  } = ImageAPI.useGetImagesQuery(undefined, { skip: !shouldFetchImages })
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
    refetch: refetchUsers,
  } = UserAPI.useGetUsersQuery(undefined, { skip: !shouldFetchUsers })
  const {
    data: groups = [],
    isLoading: isLoadingGroups,
    isFetching: isFetchingGroups,
    refetch: refetchGroups,
  } = GroupAPI.useGetGroupsQuery(undefined, { skip: !shouldFetchGroups })
  const zoneName = zones.find(({ ID }) => String(ID) === String(zone))?.NAME
  const dashboardSubtitle = [
    shouldFetchZones && `${translate(T.Zone)} ${zoneName ?? '-'}`,
    shouldFetchClusters &&
      `${clusters.length} ${translate(
        clusters.length === 1 ? T.Cluster : T.Clusters
      )}`,
    shouldFetchHosts &&
      `${hosts.length} ${translate(hosts.length === 1 ? T.Host : T.Hosts)}`,
  ]
    .filter(Boolean)
    .join(' · ')
  const isSubtitleLoading =
    (shouldFetchZones && isLoadingZones) ||
    (shouldFetchClusters && isLoadingClusters) ||
    (shouldFetchHosts && isLoadingHosts)
  const isRefreshing =
    (shouldFetchZones && isFetchingZones) ||
    (shouldFetchClusters && isFetchingClusters) ||
    (shouldFetchHosts && isFetchingHosts) ||
    (shouldFetchVms && isFetchingVms) ||
    (shouldFetchVnets && isFetchingVnets) ||
    (shouldFetchImages && isFetchingImages) ||
    (shouldFetchUsers && isFetchingUsers) ||
    (shouldFetchGroups && isFetchingGroups) ||
    (hasVmMonitoringCharts && isFetchingVmMonitoring) ||
    (hasHostMonitoringCharts && isFetchingHostMonitoring)

  const vmMonitoring = useMemo(
    () =>
      [vmMonitoringData?.MONITORING_DATA?.MONITORING ?? []]
        .flat()
        .filter(Boolean),
    [vmMonitoringData]
  )
  const hostMonitoring = useMemo(
    () =>
      [hostMonitoringData?.MONITORING_DATA?.MONITORING ?? []]
        .flat()
        .filter(Boolean)
        .map(({ TIMESTAMP, CAPACITY = {} }) => ({ TIMESTAMP, ...CAPACITY })),
    [hostMonitoringData]
  )

  const vmStates = useMemo(() => {
    const states = vms.reduce(
      (stateCounts, vm) => {
        const state = getVirtualMachineState(vm)?.name

        if (state === STATES.RUNNING) stateCounts.running += 1
        if (state === STATES.PENDING) stateCounts.deploying += 1
        if (state === STATES.POWEROFF) stateCounts.off += 1
        if (state?.includes('FAIL')) stateCounts.failed += 1

        return stateCounts
      },
      { running: 0, deploying: 0, off: 0, failed: 0 }
    )

    return {
      ...states,
      other: Math.max(
        0,
        vms.length -
          Object.values(states).reduce((total, value) => total + value, 0)
      ),
    }
  }, [vms])
  const vmOwnership = useMemo(
    () => ({
      owners: countUniqueResources(vms, 'UID', 'UNAME'),
      groups: countUniqueResources(vms, 'GID', 'GNAME'),
    }),
    [vms]
  )
  const hostStates = useMemo(() => {
    const states = hosts.reduce(
      (stateCounts, host) => {
        const state = getHostState(host)?.name

        if ([STATES.MONITORED, STATES.MONITORING_MONITORED].includes(state)) {
          stateCounts.monitoring += 1
        }
        if (
          [
            STATES.DISABLED,
            STATES.MONITORING_DISABLED,
            STATES.OFFLINE,
          ].includes(state)
        ) {
          stateCounts.disabled += 1
        }
        if ([STATES.ERROR, STATES.MONITORING_ERROR].includes(state)) {
          stateCounts.failed += 1
        }

        return stateCounts
      },
      { monitoring: 0, disabled: 0, failed: 0 }
    )

    return {
      ...states,
      other: Math.max(
        0,
        hosts.length -
          Object.values(states).reduce((total, value) => total + value, 0)
      ),
    }
  }, [hosts])
  const networkCapacity = useMemo(
    () =>
      vnets.reduce(
        (capacity, vnet) => ({
          used: capacity.used + (+vnet.USED_LEASES || 0),
          total: capacity.total + getTotalLeases(vnet),
        }),
        { used: 0, total: 0 }
      ),
    [vnets]
  )
  const imagesSize = useMemo(
    () => images.reduce((total, { SIZE }) => total + (+SIZE || 0), 0),
    [images]
  )
  const formattedImagesSize =
    imagesSize > 0 ? prettyBytes(imagesSize, UNITS.MB, 1) : `0 ${UNITS.MB}`
  const clusterCapacity = useMemo(() => {
    const cluster =
      clusters.find(
        ({ NAME = '' }) => NAME.toLocaleLowerCase() === 'default'
      ) ?? clusters[0]
    const totals = hosts
      .filter(({ CLUSTER_ID }) => String(CLUSTER_ID) === String(cluster?.ID))
      .reduce(
        (capacity, { HOST_SHARE = {} }) => ({
          cpuAllocated: capacity.cpuAllocated + (+HOST_SHARE.CPU_USAGE || 0),
          cpuTotal: capacity.cpuTotal + (+HOST_SHARE.MAX_CPU || 0),
          memoryAllocated:
            capacity.memoryAllocated + (+HOST_SHARE.MEM_USAGE || 0),
          memoryTotal: capacity.memoryTotal + (+HOST_SHARE.MAX_MEM || 0),
        }),
        {
          cpuAllocated: 0,
          cpuTotal: 0,
          memoryAllocated: 0,
          memoryTotal: 0,
        }
      )

    return { cluster, ...totals }
  }, [clusters, hosts])
  const dashboardHosts = hosts.map((host) => {
    const {
      ID,
      NAME,
      IM_MAD,
      VM_MAD,
      CLUSTER,
      CLUSTER_ID,
      HOST_SHARE = {},
    } = host
    const { name: stateName, color: stateColor = 'default' } =
      getHostState(host) ?? {}
    const isUnavailable = HOST_UNAVAILABLE_STATES.includes(stateName)
    const cpuUsage = +HOST_SHARE.CPU_USAGE || 0
    const cpuTotal = +HOST_SHARE.MAX_CPU || 0
    const memoryUsage = +HOST_SHARE.MEM_USAGE || 0
    const memoryTotal = +HOST_SHARE.MAX_MEM || 0
    const hasCpuCapacity = !isUnavailable && cpuTotal > 0
    const hasMemoryCapacity = !isUnavailable && memoryTotal > 0
    const clusterName =
      CLUSTER ??
      clusters.find(({ ID: id }) => String(id) === String(CLUSTER_ID))?.NAME ??
      '-'
    const vmCount = [host?.VMS?.ID ?? []].flat().length
    const cpuDetail = hasCpuCapacity
      ? `${numberFormatter.format(cpuUsage)} / ${numberFormatter.format(
          cpuTotal
        )}`
      : '- / -'
    const memoryDetail = hasMemoryCapacity
      ? `${formatMemory(memoryUsage)} / ${formatMemory(memoryTotal)}`
      : '- / -'

    return {
      id: ID,
      name: NAME ?? '-',
      status: {
        name: translate(HOST_STATE_LABELS[stateName] ?? T.INIT),
        color: stateColor,
      },
      metadata: [
        String(VM_MAD ?? IM_MAD ?? '-').toLocaleUpperCase(),
        `${translate(T.Cluster).toLocaleLowerCase()} ${clusterName}`,
        isUnavailable
          ? translate(T.Unreachable)
          : `${vmCount} ${translate(vmCount === 1 ? T.VM : T.VMs)}`,
      ],
      cpu: {
        label: translate(T.CPU),
        detail: cpuDetail,
        value: hasCpuCapacity ? getPercentage(cpuUsage, cpuTotal) : 0,
        ariaLabel: `${translate(T.CPU)}: ${cpuDetail}`,
      },
      memory: {
        label: translate(T.Memory).toLocaleUpperCase(),
        detail: memoryDetail,
        value: hasMemoryCapacity ? getPercentage(memoryUsage, memoryTotal) : 0,
        ariaLabel: `${translate(T.Memory)}: ${memoryDetail}`,
      },
      onClick: () => openResourceSingleView(HOST, host),
      ariaLabel: NAME ?? translate(T.Hosts),
    }
  })

  const handleRefresh = useCallback(() => {
    const requests = []

    if (shouldFetchZones) requests.push(refetchZones())
    if (shouldFetchClusters) requests.push(refetchClusters())
    if (shouldFetchHosts) requests.push(refetchHosts())
    if (shouldFetchVms) requests.push(refetchVms())
    if (shouldFetchVnets) requests.push(refetchVnets())
    if (shouldFetchImages) requests.push(refetchImages())
    if (shouldFetchUsers) requests.push(refetchUsers())
    if (shouldFetchGroups) requests.push(refetchGroups())

    if (hasVmMonitoringCharts) requests.push(refetchVmMonitoring())
    if (hasHostMonitoringCharts) requests.push(refetchHostMonitoring())

    return Promise.allSettled(requests)
  }, [
    refetchZones,
    refetchClusters,
    refetchHosts,
    refetchVms,
    refetchVnets,
    refetchImages,
    refetchUsers,
    refetchGroups,
    refetchVmMonitoring,
    refetchHostMonitoring,
    shouldFetchZones,
    shouldFetchClusters,
    shouldFetchHosts,
    shouldFetchVms,
    shouldFetchVnets,
    shouldFetchImages,
    shouldFetchUsers,
    shouldFetchGroups,
    hasVmMonitoringCharts,
    hasHostMonitoringCharts,
  ])

  const renderDashboardCard = ({ id, to }) => {
    switch (id) {
      case DASHBOARD_CARD_IDS.VIRTUAL_MACHINES:
        return (
          <DashboardResourceCard
            title={translate(T.VirtualMachines)}
            adornment={<VmsIcon />}
            value={vms.length}
            isLoading={isLoadingVms}
            loadingLabel={translate(T.Loading)}
            progressTotal={vms.length}
            progressAriaLabel={translate(T.VirtualMachines)}
            to={to ? PATH.INSTANCE.VMS.LIST : undefined}
            segments={[
              { id: 'running', value: vmStates.running, tone: 'success' },
              {
                id: 'deploying',
                value: vmStates.deploying,
                tone: 'information',
              },
              { id: 'off', value: vmStates.off, tone: 'neutral' },
              { id: 'failed', value: vmStates.failed, tone: 'error' },
              { id: 'other', value: vmStates.other, tone: 'focus' },
            ]}
            details={[
              {
                id: 'running',
                value: vmStates.running,
                label: translate(T.RUNNING),
                tone: 'success',
              },
              {
                id: 'deploying',
                value: vmStates.deploying,
                label: translate(T.Deploying),
                tone: 'information',
              },
              {
                id: 'off',
                value: vmStates.off,
                label: translate(T.Off),
                tone: 'neutral',
              },
              {
                id: 'failed',
                value: vmStates.failed,
                label: translate(T.FAILED),
                tone: 'error',
              },
              {
                id: 'other',
                value: vmStates.other,
                label: translate(T.Other),
                tone: 'focus',
              },
            ]}
          >
            <Box className="dashboard-resource-card-extra-summary">
              <UserIcon className="dashboard-resource-card-extra-icon" />
              <Box className="dashboard-resource-card-extra-item">
                <Text
                  className="dashboard-resource-card-extra-value"
                  component="span"
                  variant={TEXT_VARIANTS.CAPTION}
                  weight={TEXT_WEIGHTS.MEDIUM}
                  value={vmOwnership.owners}
                />
                <Text
                  className="dashboard-resource-card-extra-label"
                  component="span"
                  variant={TEXT_VARIANTS.CAPTION}
                  weight={TEXT_WEIGHTS.MEDIUM}
                  value={translate(T.Owner)}
                />
              </Box>
              <Box className="dashboard-resource-card-extra-item">
                <Text
                  className="dashboard-resource-card-extra-value"
                  component="span"
                  variant={TEXT_VARIANTS.CAPTION}
                  weight={TEXT_WEIGHTS.MEDIUM}
                  value={vmOwnership.groups}
                />
                <Text
                  className="dashboard-resource-card-extra-label"
                  component="span"
                  variant={TEXT_VARIANTS.CAPTION}
                  weight={TEXT_WEIGHTS.MEDIUM}
                  value={translate(T.Group)}
                />
              </Box>
            </Box>
          </DashboardResourceCard>
        )
      case DASHBOARD_CARD_IDS.HOSTS_SUMMARY:
        return (
          <DashboardResourceCard
            title={translate(T.Hosts)}
            adornment={<HostsIcon />}
            value={hosts.length}
            isLoading={isLoadingHosts}
            loadingLabel={translate(T.Loading)}
            progressTotal={hosts.length}
            progressAriaLabel={translate(T.Hosts)}
            to={to ? PATH.INFRASTRUCTURE.HOSTS.LIST : undefined}
            segments={[
              {
                id: 'monitoring',
                value: hostStates.monitoring,
                tone: 'success',
              },
              {
                id: 'disabled',
                value: hostStates.disabled,
                tone: 'neutral',
              },
              { id: 'failed', value: hostStates.failed, tone: 'error' },
              { id: 'other', value: hostStates.other, tone: 'focus' },
            ]}
            details={[
              {
                id: 'monitoring',
                value: hostStates.monitoring,
                label: translate(T.Monitoring),
                tone: 'success',
              },
              {
                id: 'disabled',
                value: hostStates.disabled,
                label: translate(T.Disabled),
                tone: 'neutral',
              },
              {
                id: 'failed',
                value: hostStates.failed,
                label: translate(T.FAILED),
                tone: 'error',
              },
              {
                id: 'other',
                value: hostStates.other,
                label: translate(T.Other),
                tone: 'focus',
              },
            ]}
          />
        )
      case DASHBOARD_CARD_IDS.VIRTUAL_NETWORKS:
        return (
          <DashboardResourceCard
            title={translate(T.VirtualNetworks)}
            adornment={<VnetsIcon />}
            value={vnets.length}
            isLoading={isLoadingVnets}
            loadingLabel={translate(T.Loading)}
            progressTotal={networkCapacity.total}
            progressAriaLabel={translate(T.IPsInUse)}
            to={to ? PATH.NETWORK.VNETS.LIST : undefined}
            segments={[
              {
                id: 'used-leases',
                value: networkCapacity.used,
                tone: 'success',
              },
            ]}
            details={[
              {
                id: 'used-leases',
                value: networkCapacity.used,
                label: translate(T.IPsInUse),
                tone: 'success',
              },
              ...(!isLoadingVnets && vnets.length === 0
                ? [
                    {
                      id: 'empty-networks',
                      label: translate(T.NoNetworksYet),
                      showIndicator: false,
                      isMuted: true,
                    },
                  ]
                : []),
            ]}
          />
        )
      case DASHBOARD_CARD_IDS.IMAGES:
        return (
          <DashboardResourceCard
            title={translate(T.Images)}
            adornment={<ImagesIcon />}
            value={images.length}
            isLoading={isLoadingImages}
            loadingLabel={translate(T.Loading)}
            progressTotal={images.length}
            progressAriaLabel={translate(T.Images)}
            to={to ? PATH.STORAGE.IMAGES.LIST : undefined}
            segments={[{ id: 'images', value: images.length, tone: 'success' }]}
            details={[
              {
                id: 'size',
                value: formattedImagesSize,
                label: translate(T.OnDatastores),
                showIndicator: false,
              },
            ]}
          />
        )
      case DASHBOARD_CARD_IDS.HOSTS:
        return (
          <DashboardHostsCard
            title={translate(T.Hosts)}
            adornment={
              canCreateHost ? (
                <Button
                  className="dashboard-card-header-action"
                  type="transparent"
                  size="small"
                  iconOnly={<AddIcon />}
                  aria-label={translate(T.CreateHost)}
                  onClick={() => history.push(PATH.INFRASTRUCTURE.HOSTS.CREATE)}
                />
              ) : undefined
            }
            hosts={dashboardHosts}
            isLoading={isLoadingHosts}
            loadingLabel={translate(T.Loading)}
            isNavigable={to}
          />
        )
      case DASHBOARD_CARD_IDS.CPU_CHART:
        return (
          <DashboardChartCard
            title={translate(T.CPU)}
            data={vmMonitoring}
            x={getMonitoringTimestamp}
            series={[
              {
                dataKey: 'CPU',
                label: translate(T.CPU),
                fill: true,
              },
            ]}
            valueFormatter={interpolationValue}
            isLoading={isFetchingVmMonitoring}
            loadingLabel={translate(T.Loading)}
            to={to ? PATH.INSTANCE.VMS.LIST : undefined}
          />
        )
      case DASHBOARD_CARD_IDS.MEMORY_CHART:
        return (
          <DashboardChartCard
            title={translate(T.Memory)}
            data={vmMonitoring}
            x={getMonitoringTimestamp}
            series={[
              {
                dataKey: 'MEMORY',
                label: translate(T.Memory),
                fill: true,
              },
            ]}
            valueFormatter={interpolationBytes}
            isLoading={isFetchingVmMonitoring}
            loadingLabel={translate(T.Loading)}
            to={to ? PATH.INSTANCE.VMS.LIST : undefined}
          />
        )
      case DASHBOARD_CARD_IDS.HOST_CPU_CHART:
        return (
          <DashboardChartCard
            title={translate(T.CpuHost)}
            data={hostMonitoring}
            x={getMonitoringTimestamp}
            series={[
              {
                dataKey: 'USED_CPU',
                label: translate(T.CpuHost),
              },
            ]}
            valueFormatter={interpolationValue}
            isLoading={isFetchingHostMonitoring}
            loadingLabel={translate(T.Loading)}
            to={to ? PATH.INFRASTRUCTURE.HOSTS.LIST : undefined}
          />
        )
      case DASHBOARD_CARD_IDS.HOST_MEMORY_CHART:
        return (
          <DashboardChartCard
            title={translate(T.MemoryHost)}
            data={hostMonitoring}
            x={getMonitoringTimestamp}
            series={[
              {
                dataKey: 'USED_MEMORY',
                label: translate(T.MemoryHost),
              },
            ]}
            valueFormatter={interpolationBytes}
            isLoading={isFetchingHostMonitoring}
            loadingLabel={translate(T.Loading)}
            to={to ? PATH.INFRASTRUCTURE.HOSTS.LIST : undefined}
          />
        )
      case DASHBOARD_CARD_IDS.CLUSTER_CAPACITY:
        return (
          <DashboardCapacityCard
            title={translate(T.ClusterCapacity)}
            titleTag={
              <Tag title={String(clusterCapacity.cluster?.NAME ?? '-')} />
            }
            adornment={
              canCreateHost ? (
                <Button
                  className="dashboard-card-header-action"
                  type="transparent"
                  size="small"
                  iconOnly={<AddIcon />}
                  aria-label={translate(T.CreateHost)}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    history.push(PATH.INFRASTRUCTURE.HOSTS.CREATE)
                  }}
                />
              ) : undefined
            }
            to={to ? PATH.INFRASTRUCTURE.CLUSTERS.LIST : undefined}
            isLoading={isLoadingClusters || isLoadingHosts}
            loadingLabel={translate(T.Loading)}
            items={[
              {
                id: 'cpu',
                label: translate(T.CpuAllocated),
                value: clusterCapacity.cpuAllocated,
                total: clusterCapacity.cpuTotal,
                valueLabel: `${numberFormatter.format(
                  clusterCapacity.cpuAllocated
                )} ${translate(T.Of)} ${numberFormatter.format(
                  clusterCapacity.cpuTotal
                )}`,
              },
              {
                id: 'memory',
                label: translate(T.MemoryAllocated),
                value: clusterCapacity.memoryAllocated,
                total: clusterCapacity.memoryTotal,
                valueLabel: `${
                  clusterCapacity.memoryAllocated < 0 ? '-' : ''
                }${prettyBytes(
                  Math.abs(clusterCapacity.memoryAllocated),
                  UNITS.KB,
                  1
                )} / ${prettyBytes(
                  clusterCapacity.memoryTotal,
                  UNITS.KB,
                  1
                )} · ${
                  Math.round(
                    getPercentage(
                      clusterCapacity.memoryAllocated,
                      clusterCapacity.memoryTotal
                    ) * 10
                  ) / 10
                }%`,
              },
            ]}
          />
        )
      case DASHBOARD_CARD_IDS.SYSTEM:
        return (
          <DashboardSystemCard
            title={translate(T.System)}
            isLoading={isLoadingUsers || isLoadingGroups}
            loadingLabel={translate(T.Loading)}
            isNavigable={to}
            items={[
              {
                id: 'users',
                label: translate(T.Users),
                value: users.length,
                icon: <UserIcon />,
                onClick: () => history.push(PATH.SYSTEM.USERS.LIST),
                ariaLabel: translate(T.Users),
              },
              {
                id: 'groups',
                label: translate(T.Groups),
                value: groups.length,
                icon: <GroupIcon />,
                onClick: () => history.push(PATH.SYSTEM.GROUPS.LIST),
                ariaLabel: translate(T.Groups),
              },
            ]}
          />
        )
      default:
        return null
    }
  }

  return (
    <Box
      sx={{
        margin: '0 auto',
        display: 'flex',
        width: '100%',
        maxWidth: '1160px',
        padding: '24px 32px 48px 32px',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      <DashboardHeader
        title={translate(T.Overview)}
        subtitle={dashboardSubtitle}
        isSubtitleLoading={isSubtitleLoading}
        loadingLabel={translate(T.Loading)}
        updatedText={translate(T.UpdatedJustNow)}
        updatedTextLabels={{
          minute: translate(T.UpdatedMinuteAgo, ['%s']),
          minutes: translate(T.UpdatedMinutesAgo, ['%s']),
          hour: translate(T.UpdatedHourAgo, ['%s']),
          hours: translate(T.UpdatedHoursAgo, ['%s']),
          day: translate(T.UpdatedDayAgo, ['%s']),
          days: translate(T.UpdatedDaysAgo, ['%s']),
        }}
        refreshLabel={translate(T.Refresh)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        primaryAction={
          canCreateVm
            ? {
                label: translate(T.CreateVM),
                icon: <AddIcon />,
                onClick: () => history.push(PATH.INSTANCE.VMS.CREATE),
              }
            : undefined
        }
      />

      <DashboardPanel data-cy="dashboard-panel">
        {dashboardCards.map((card) => (
          <DashboardPanelItem
            key={card.id}
            size={card.size}
            data-dashboard-card={card.id}
          >
            {renderDashboardCard(card)}
          </DashboardPanelItem>
        ))}
      </DashboardPanel>
    </Box>
  )
}

GeneralDashboard.displayName = 'GeneralDashboard'
