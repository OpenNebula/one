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
import { Box, Grid, Typography, useTheme } from '@mui/material'
import { css } from '@emotion/css'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'

import { HostAPI } from '@FeaturesModule'
import { Graph, Tr, Translate } from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { interpolationValue, interpolationBytes } from '@UtilsModule'

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
})

const hostCpuConfig = (theme) => ({
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
})

const hostMemConfig = (theme) => ({
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
})

const HostMonitoringGraphs = memo(() => {
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])

  const { data, isFetching } = HostAPI.useGetHostMonitoringPoolQuery({
    seconds: 3600,
  })

  const monitoring = data?.MONITORING_DATA?.MONITORING

  const transformedData = useMemo(
    () =>
      (Array.isArray(monitoring) ? monitoring : [monitoring])
        .filter(Boolean)
        .map(({ TIMESTAMP, CAPACITY }) => ({
          TIMESTAMP,
          ...CAPACITY,
        })),
    [monitoring]
  )

  if (!monitoring?.length) return null

  const cpuConfig = hostCpuConfig(theme)
  const memConfig = hostMemConfig(theme)

  return (
    <Grid container spacing={3} data-cy="dashboard-widget-host-monitoring">
      <Grid item xs={12} md={6}>
        <Box className={classes.root}>
          <Typography variant="h6" className={classes.title}>
            <Translate word={cpuConfig.title} />
          </Typography>
          <Graph
            name={Tr(cpuConfig.title)}
            filter={cpuConfig.graph.y}
            data={transformedData}
            y={cpuConfig.graph.y}
            x={cpuConfig.graph.x}
            legendNames={cpuConfig.title}
            lineColors={cpuConfig.graph.lineColors}
            interpolationY={cpuConfig.graph.interpolation}
            showLegends={cpuConfig.showLegends}
            sortX
            isFetching={isFetching}
            shouldFill={cpuConfig.shouldFill}
          />
        </Box>
      </Grid>
      <Grid item xs={12} md={6}>
        <Box className={classes.root}>
          <Typography variant="h6" className={classes.title}>
            <Translate word={memConfig.title} />
          </Typography>
          <Graph
            name={Tr(memConfig.title)}
            filter={memConfig.graph.y}
            data={transformedData}
            y={memConfig.graph.y}
            x={memConfig.graph.x}
            legendNames={memConfig.title}
            lineColors={memConfig.graph.lineColors}
            interpolationY={memConfig.graph.interpolation}
            showLegends={memConfig.showLegends}
            sortX
            isFetching={isFetching}
            shouldFill={memConfig.shouldFill}
          />
        </Box>
      </Grid>
    </Grid>
  )
})

HostMonitoringGraphs.displayName = 'HostMonitoringGraphs'

export default HostMonitoringGraphs
