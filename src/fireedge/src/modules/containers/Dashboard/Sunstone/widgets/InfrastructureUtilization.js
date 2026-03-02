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
import {
  Box,
  LinearProgress,
  linearProgressClasses,
  Typography,
  useTheme,
} from '@mui/material'
import { css } from '@emotion/css'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'

import { HostAPI } from '@FeaturesModule'
import { Translate } from '@ComponentsModule'
import { T, COLOR } from '@ConstantsModule'

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
  barLabel: css({
    fontSize: '1rem',
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: '1.25rem',
    paddingBottom: '0.5rem',
  }),
  progressBar: css({
    height: typography.pxToRem(8),
    borderRadius: typography.pxToRem(4),
    marginBottom: typography.pxToRem(16),
  }),
})

/**
 * Returns the appropriate color for a utilization percentage.
 *
 * @param {number} percentage - The utilization percentage (0-100)
 * @returns {string} Hex color string
 */
const getBarColor = (percentage) => {
  if (percentage >= 90) return COLOR.error.main
  if (percentage >= 70) return COLOR.warning.main

  return COLOR.success.main
}

/**
 * Infrastructure Utilization widget showing aggregate CPU and Memory
 * usage across all hosts as progress bars.
 *
 * @param {object} props - Props
 * @param {string} props.view - Current view name
 * @returns {ReactElement|null} Utilization panel or null when no data
 */
const InfrastructureUtilization = memo(({ view }) => {
  const theme = useTheme()
  const { palette } = theme
  const classes = useMemo(() => styles(theme), [theme])

  const { data: hosts = [] } = HostAPI.useGetHostsQuery()

  const { cpuPercent, memPercent } = useMemo(() => {
    if (!hosts?.length) return { cpuPercent: 0, memPercent: 0 }

    let totalMaxCpu = 0
    let totalCpuUsage = 0
    let totalMaxMem = 0
    let totalMemUsage = 0

    hosts.forEach((host) => {
      const share = host?.HOST_SHARE || {}

      totalMaxCpu += parseInt(share.MAX_CPU || '0', 10)
      totalCpuUsage += parseInt(share.CPU_USAGE || '0', 10)
      totalMaxMem += parseInt(share.MAX_MEM || '0', 10)
      totalMemUsage += parseInt(share.MEM_USAGE || '0', 10)
    })

    return {
      cpuPercent: totalMaxCpu > 0
        ? Math.min((totalCpuUsage / totalMaxCpu) * 100, 100)
        : 0,
      memPercent: totalMaxMem > 0
        ? Math.min((totalMemUsage / totalMaxMem) * 100, 100)
        : 0,
    }
  }, [hosts])

  if (!hosts?.length) return null

  return (
    <Box className={classes.root} data-cy="dashboard-widget-infrastructure">
      <Typography variant="h6" className={classes.title}>
        <Translate word={T.InfrastructureUtilization} />
      </Typography>

      <Typography className={classes.barLabel}>
        {`CPU: ${cpuPercent.toFixed(0)}%`}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={cpuPercent}
        sx={{
          [`&.${linearProgressClasses.colorPrimary}`]: {
            backgroundColor:
              palette?.graphs?.cloud?.bars?.total || palette.action.hover,
          },
          [`& .${linearProgressClasses.bar}`]: {
            borderRadius: 4,
            backgroundColor: getBarColor(cpuPercent),
          },
        }}
        className={classes.progressBar}
      />

      <Typography className={classes.barLabel}>
        {`Memory: ${memPercent.toFixed(0)}%`}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={memPercent}
        sx={{
          [`&.${linearProgressClasses.colorPrimary}`]: {
            backgroundColor:
              palette?.graphs?.cloud?.bars?.total || palette.action.hover,
          },
          [`& .${linearProgressClasses.bar}`]: {
            borderRadius: 4,
            backgroundColor: getBarColor(memPercent),
          },
        }}
        className={classes.progressBar}
      />
    </Box>
  )
})

InfrastructureUtilization.displayName = 'InfrastructureUtilization'

InfrastructureUtilization.propTypes = {
  view: PropTypes.string,
}

export { InfrastructureUtilization }
export default InfrastructureUtilization
