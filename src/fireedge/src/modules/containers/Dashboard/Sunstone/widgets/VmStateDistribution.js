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
import { Box, Typography, useTheme } from '@mui/material'
import { css } from '@emotion/css'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

import { VmAPI } from '@FeaturesModule'
import { Translate, Tr } from '@ComponentsModule'
import { T, VM_STATES, VM_POOL_PAGINATION_SIZE } from '@ConstantsModule'

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

/**
 * Capitalizes the first letter of a string.
 *
 * @param {string} str - The string to capitalize
 * @returns {string} The capitalized string
 */
const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : ''

const VmStateDistribution = memo(({ disableAnimations }) => {
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])

  const { data: vms = [], isFetching } = VmAPI.useGetVmsPaginatedQuery({
    extended: 0,
    pageSize: VM_POOL_PAGINATION_SIZE,
  })

  const { chartData, totalCount } = useMemo(() => {
    if (!vms?.length) return { chartData: [], totalCount: 0 }

    const stateCounts = {}
    vms.forEach((vm) => {
      const stateIndex = parseInt(vm.STATE, 10)
      stateCounts[stateIndex] = (stateCounts[stateIndex] || 0) + 1
    })

    const entries = Object.entries(stateCounts)
      .map(([stateIndex, count]) => {
        const stateInfo = VM_STATES[parseInt(stateIndex, 10)]
        if (!stateInfo || count === 0) return null

        return {
          name: capitalize(stateInfo.name),
          value: count,
          color: stateInfo.color,
        }
      })
      .filter(Boolean)

    return { chartData: entries, totalCount: vms.length }
  }, [vms])

  if (isFetching) return null

  return (
    <Box className={classes.root} data-cy="dashboard-widget-vm-state">
      <Typography variant="h6" className={classes.title}>
        <Translate word={T.VmStateDistribution} />
      </Typography>
      {!chartData.length ? (
        <Typography variant="body1" color="text.secondary" align="center">
          {Tr(T.NoDataAvailableYet)}
        </Typography>
      ) : (
        <Box sx={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                paddingAngle={2}
                isAnimationActive={!disableAnimations}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <Typography
            variant="h4"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          >
            {totalCount}
          </Typography>
        </Box>
      )}
    </Box>
  )
})

VmStateDistribution.displayName = 'VmStateDistribution'

VmStateDistribution.propTypes = {
  disableAnimations: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
}

export default VmStateDistribution
