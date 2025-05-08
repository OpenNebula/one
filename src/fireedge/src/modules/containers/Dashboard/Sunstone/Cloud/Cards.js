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

import { T } from '@ConstantsModule'
import { css } from '@emotion/css'
import { Graph, Tr, Translate } from '@ComponentsModule'
import {
  Box,
  LinearProgress,
  linearProgressClasses,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import {
  interpolationBytes,
  interpolationBytesSeg,
  interpolationValue,
  prettyBytes,
} from '@UtilsModule'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'

const styles = ({ palette, typography }) => ({
  root: css({
    padding: typography.pxToRem(24),
    borderRadius: typography.pxToRem(16),
    backgroundColor: palette.background.paper,
  }),
  title: css({
    marginBottom: typography.pxToRem(16),
    fontSize: typography.pxToRem(21),
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: typography.pxToRem(20),
  }),
  progressBarTitle: css({
    color: palette?.graphs?.cloud?.titles?.color,
    fontSize: '1rem',
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: '1.25rem',
    paddingBottom: '0.5rem',
  }),
  noProgressBarTitle: css({
    color: palette?.graphs?.cloud?.titles?.color,
    fontSize: '1rem',
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: '1.25rem',
  }),
  secondTitle: css({
    marginBottom: typography.pxToRem(20),
  }),
  progressBar: css({
    height: typography.pxToRem(4),
    borderRadius: typography.pxToRem(4),
    marginBottom: typography.pxToRem(16),
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor: palette?.graphs?.cloud?.bars?.total,
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: typography.pxToRem(4),
      backgroundColor: palette?.graphs?.cloud?.bars?.used,
    },
  }),
  graph: css({
    width: '100%',
    aspectRatio: '3 / 1',
  }),
})

const dataTypes = (theme) => ({
  cpu: {
    title: T.CPU,
    titleQuota: T.UsedCPU,
    key: 'CPU',
    graph: {
      x: [(point) => new Date(parseInt(point.TIMESTAMP) * 1000).getTime()],
      y: ['CPU'],
      lineColors: [theme?.palette?.graphs?.cloud?.cpu?.real],
      interpolation: interpolationValue,
    },
    shouldFill: ['CPU'],
    showLegends: false,
  },
  memory: {
    title: T.Memory,
    titleQuota: T.UsedMemory,
    key: 'MEMORY',
    graph: {
      x: [(point) => new Date(parseInt(point.TIMESTAMP) * 1000).getTime()],
      y: ['MEMORY'],
      lineColors: [theme?.palette?.graphs?.cloud?.memory?.real],
      interpolation: interpolationBytes,
    },
    shouldFill: ['MEMORY'],
    showLegends: false,
  },
  disks: {
    title: T.Disks,
    key: 'SYSTEM_DISK_SIZE',
    graph: {
      x: [(point) => new Date(parseInt(point.TIMESTAMP) * 1000).getTime()],
      y: ['DISKRDIOPS', 'DISKWRIOPS'],
      lineColors: [
        theme?.palette?.graphs?.cloud?.disks?.diskReadIOPS,
        theme?.palette?.graphs?.cloud?.disks?.diskWriteIOPS,
      ],
      interpolation: interpolationBytes,
      legendNames: [T.DiskReadIOPS, T.DiskWriteIOPS],
    },
    shouldFill: ['DISKRDIOPS'],
    showLegends: true,
  },
  networks: {
    title: T.Networks,
    key: 'NETWORKS',
    graph: {
      x: [(point) => new Date(parseInt(point.TIMESTAMP) * 1000).getTime()],
      y: ['NETRX', 'NETTX'],
      lineColors: [
        theme?.palette?.graphs?.cloud?.networks?.netDownloadSpeed,
        theme?.palette?.graphs?.cloud?.networks?.netUploadSpeed,
      ],
      legendNames: [T.NetRX, T.NetTX],
      interpolation: interpolationBytesSeg,
    },
    shouldFill: ['NETRX'],
    showLegends: true,
  },
  'host-cpu': {
    title: T.CpuHost,
    key: 'CPU',
    graph: {
      x: [(point) => new Date(parseInt(point.TIMESTAMP) * 1000).getTime()],
      y: ['USED_CPU'],
      lineColors: [theme?.palette?.graphs?.cloud?.hostCpu?.real],
      interpolation: interpolationValue,
    },
    shouldFill: ['CPU'],
    showLegends: false,
  },
  'host-memory': {
    title: T.MemoryHost,
    key: 'MEMORY',
    graph: {
      x: [(point) => new Date(parseInt(point.TIMESTAMP) * 1000).getTime()],
      y: ['USED_MEMORY'],
      lineColors: [theme?.palette?.graphs?.cloud?.hostMemory?.real],
      interpolation: interpolationBytes,
    },
    shouldFill: ['MEMORY'],
    showLegends: false,
  },
})

/**
 * Returns the generic quota only.
 *
 * @param {object} quota - Quota data
 * @returns {object} - The generic quota
 */
const genericQuota = (quota) => {
  // Find the first object without the key 'CLUSTER_IDS' that is the generic quota
  if ([].concat(quota)) {
    return quota.find((item) => !Object.hasOwn(item, 'CLUSTER_IDS')) ?? {}
  }
}

export const DashboardCardVMInfo = memo(
  ({
    access = false,
    type = '',
    quotaData = {},
    vmpoolMonitoringData = {},
    isFetching = false,
    ...props
  }) => {
    const theme = useTheme()
    const resourceType = dataTypes(theme)?.[type]

    if (!access || !resourceType) return ''

    const classes = useMemo(() => styles(theme), [theme])

    return (
      <Box className={classes.root}>
        <Typography variant="h6" className={classes.title}>
          <Translate word={resourceType?.title} />
        </Typography>
        <QuotaBar
          {...{
            ...props,
            resourceType,
            data: genericQuota(quotaData?.VM_QUOTA),
            classes,
          }}
        />
        <MonitoringGraphs
          {...{
            ...props,
            data: vmpoolMonitoringData?.MONITORING_DATA?.MONITORING,
            classes,
            resourceType,
            isFetching,
          }}
        />
      </Box>
    )
  }
)
DashboardCardVMInfo.propTypes = {
  access: PropTypes.bool,
  type: PropTypes.string,
  quotaData: PropTypes.object,
  vmpoolMonitoringData: PropTypes.object,
  isFetching: PropTypes.bool,
}
DashboardCardVMInfo.displayName = 'DashboardCardVMInfo'

export const DashboardCardHostInfo = memo(
  ({
    access = false,
    type = '',
    hostpoolMonitoringData = {},
    isFetching = false,
    ...props
  }) => {
    const monitoring = hostpoolMonitoringData?.MONITORING_DATA?.MONITORING

    const theme = useTheme()
    const resourceType = dataTypes(theme)?.[type]

    if (!access || !resourceType || !monitoring?.length) {
      return ''
    }

    const cpuMemoryData = useMemo(
      () =>
        (Array.isArray(monitoring) ? monitoring : [monitoring]).map(
          ({ TIMESTAMP, CAPACITY }) => ({
            TIMESTAMP,
            ...CAPACITY,
          })
        ),
      [monitoring]
    )

    const classes = useMemo(() => styles(theme), [theme])

    return (
      <Box className={classes.root}>
        <Typography variant="h6" className={classes.title}>
          <Translate word={resourceType?.title} />
        </Typography>
        <MonitoringGraphs
          {...{
            ...props,
            data: cpuMemoryData,
            classes,
            resourceType,
            isFetching,
          }}
        />
      </Box>
    )
  }
)
DashboardCardHostInfo.propTypes = {
  access: PropTypes.bool,
  type: PropTypes.string,
  hostpoolMonitoringData: PropTypes.object,
  isFetching: PropTypes.bool,
}
DashboardCardHostInfo.displayName = 'DashboardCardHostInfo'

const QuotaBar = memo(
  ({ data, resourceType, classes, unitBytes, showQuota }) => {
    const key = resourceType?.key
    const quotaData = data?.[key]

    if (!quotaData || !showQuota) return ''

    if (quotaData === '-1') {
      const dataUsed = unitBytes
        ? prettyBytes(+(data?.[`${key}_USED`] || '0'), 'MB', 2)
        : data?.[`${key}_USED`]

      return (
        <Tooltip placement="top-start" title={`${resourceType?.titleQuota}`}>
          <Typography
            className={clsx(classes.noProgressBarTitle, classes.secondTitle)}
          >
            {`${dataUsed} / -`}
          </Typography>
        </Tooltip>
      )
    }

    const percentage = useMemo(
      () => (parseInt(data?.[`${key}_USED`]) / parseInt(quotaData)) * 100,
      [data]
    )

    const usedVsQuota = `${resourceType?.titleQuota}: ${parseInt(
      data?.[`${key}_USED`]
    )} / ${quotaData} ${key === 'MEMORY' ? ' MB' : ''}`

    return (
      <>
        <Tooltip placement="top-start" title={usedVsQuota}>
          <div>
            <Typography className={classes.progressBarTitle}>
              {`${percentage.toFixed(0)}%`}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={percentage}
              className={classes.progressBar}
            />
          </div>
        </Tooltip>
      </>
    )
  }
)
QuotaBar.propTypes = {
  data: PropTypes.object,
  resourceType: PropTypes.object,
  classes: PropTypes.object,
  unitBytes: PropTypes.bool,
  showQuota: PropTypes.bool,
}
QuotaBar.displayName = 'QuotaBar'

const MonitoringGraphs = memo(({ resourceType, data, isFetching }) => {
  if (!resourceType?.graph) return ''
  const { x, y, lineColors, legendNames, interpolation } = resourceType?.graph

  return (
    <Graph
      name={Tr(resourceType.title)}
      filter={y}
      data={data}
      y={y}
      x={x}
      legendNames={legendNames || resourceType.title}
      lineColors={lineColors}
      interpolationY={interpolation}
      showLegends={resourceType?.showLegends}
      sortX
      isFetching={isFetching}
      shouldFill={resourceType?.shouldFill}
    />
  )
})
MonitoringGraphs.propTypes = {
  data: PropTypes.object,
  resourceType: PropTypes.object,
  isFetching: PropTypes.bool,
}
MonitoringGraphs.displayName = 'MonitoringGraphs'
