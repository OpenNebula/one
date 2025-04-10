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

import { SCHEMES, T } from '@ConstantsModule'
import { css } from '@emotion/css'
import Graph from '@modules/components/Charts/Graph'
import { Tr, Translate } from '@modules/components/HOC'
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
    padding: typography.pxToRem(16),
    borderRadius: typography.pxToRem(16),
    backgroundColor: palette.background.paper,
  }),
  title: css({
    marginBottom: typography.pxToRem(16),
  }),
  progressBarTitle: css({
    color: palette.secondary.main,
  }),
  secondTitle: css({
    marginBottom: typography.pxToRem(20),
  }),
  progressBar: css({
    height: typography.pxToRem(4),
    borderRadius: typography.pxToRem(4),
    marginBottom: typography.pxToRem(16),
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor: palette.grey[palette.mode === SCHEMES.LIGHT ? 400 : 800],
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: typography.pxToRem(4),
      backgroundColor: palette.secondary.main,
    },
  }),
  graph: css({
    width: '100%',
    aspectRatio: '3 / 1',
  }),
})

const dataTypes = {
  cpu: {
    title: T.CPU,
    titleQuota: T.UsedCPU,
    key: 'CPU',
    graph: {
      x: 'TIMESTAMP',
      y: ['CPU'],
      lineColors: '#40B3D9',
      interpolation: interpolationValue,
    },
  },
  memory: {
    title: T.Memory,
    titleQuota: T.UsedMemory,
    key: 'MEMORY',
    graph: {
      x: 'TIMESTAMP',
      y: ['MEMORY'],
      lineColors: '#40B3D9',
      interpolation: interpolationBytes,
    },
  },
  disks: {
    title: T.Disks,
    key: 'SYSTEM_DISK_SIZE',
    graph: {
      x: 'TIMESTAMP',
      y: ['DISKRDIOPS', 'DISKWRIOPS'],
      lineColors: ['#40B3D9', '#2A2D3D'],
      interpolation: interpolationBytes,
    },
  },
  networks: {
    title: T.Networks,
    key: 'NETWORKS',
    graph: {
      x: 'TIMESTAMP',
      y: ['NETRX', 'NETTX'],
      lineColors: ['#40B3D9', '#2A2D3D'],
      legendNames: [T.NetworkRx, T.NetworkTx],
      interpolation: interpolationBytesSeg,
    },
  },
  'host-cpu': {
    title: T.CpuHost,
    key: 'CPU',
    graph: {
      x: 'TIMESTAMP',
      y: ['USED_CPU'],
      lineColors: '#40B3D9',
      interpolation: interpolationValue,
    },
  },
  'host-memory': {
    title: T.MemoryHost,
    key: 'MEMORY',
    graph: {
      x: 'TIMESTAMP',
      y: ['USED_MEMORY'],
      lineColors: '#40B3D9',
      interpolation: interpolationBytes,
    },
  },
}

export const DashboardCardVMInfo = memo(
  ({
    access = false,
    type = '',
    quotaData = {},
    vmpoolMonitoringData = {},
    ...props
  }) => {
    const resourceType = dataTypes?.[type]

    if (!access || !resourceType) return ''

    const theme = useTheme()
    const classes = useMemo(() => styles(theme), [theme])

    return (
      <Box className={classes.root}>
        <Typography variant="h6" className={classes.title}>
          <Translate word={resourceType?.title} />
        </Typography>
        <QuotaBar
          {...{ ...props, resourceType, data: quotaData?.VM_QUOTA, classes }}
        />
        <MonitoringGraphs
          {...{
            ...props,
            data: vmpoolMonitoringData?.MONITORING_DATA?.MONITORING,
            classes,
            resourceType,
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
}
DashboardCardVMInfo.displayName = 'DashboardCardVMInfo'

export const DashboardCardHostInfo = memo(
  ({ access = false, type = '', hostpoolMonitoringData = {}, ...props }) => {
    const monitoring = hostpoolMonitoringData?.MONITORING_DATA?.MONITORING

    const resourceType = dataTypes?.[type]

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

    const theme = useTheme()
    const classes = useMemo(() => styles(theme), [theme])

    return (
      <Box className={classes.root}>
        <Typography variant="h6" className={classes.title}>
          <Translate word={resourceType?.title} />
        </Typography>
        <MonitoringGraphs
          {...{ ...props, data: cpuMemoryData, classes, resourceType }}
        />
      </Box>
    )
  }
)
DashboardCardHostInfo.propTypes = {
  access: PropTypes.bool,
  type: PropTypes.string,
  hostpoolMonitoringData: PropTypes.object,
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
            className={clsx(classes.progressBarTitle, classes.secondTitle)}
          >
            {dataUsed}
          </Typography>
        </Tooltip>
      )
    }

    const percentage = useMemo(
      () => (parseInt(data?.[`${key}_USED`]) / parseInt(quotaData)) * 100,
      [data]
    )

    return (
      <>
        <Typography className={classes.progressBarTitle}>
          {`${percentage.toFixed(0)}%`}
        </Typography>
        <Tooltip placement="top-start" title={`${resourceType?.titleQuota}`}>
          <LinearProgress
            variant="determinate"
            value={percentage}
            className={classes.progressBar}
          />
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

const MonitoringGraphs = memo(({ resourceType, data }) => {
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
      showLegends={false}
    />
  )
})
MonitoringGraphs.propTypes = {
  data: PropTypes.object,
  resourceType: PropTypes.object,
}
MonitoringGraphs.displayName = 'MonitoringGraphs'
