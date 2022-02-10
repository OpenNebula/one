/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import { useMemo } from 'react'

import { PieChart } from 'react-minimal-pie-chart'
import { Skeleton, Typography, Paper } from '@mui/material'

import { useAuth } from 'client/features/Auth'
import { useProvider } from 'client/features/One'
import { TypographyWithPoint } from 'client/components/Typography'
import NumberEasing from 'client/components/NumberEasing'
import { groupBy } from 'client/utils'
import { T } from 'client/constants'

import useStyles from 'client/components/Widgets/TotalProviders/styles'

const TotalProviders = ({ isLoading }) => {
  const classes = useStyles()
  const { providerConfig } = useAuth()
  const providers = useProvider()
  const totalProviders = providers?.length

  const chartData = useMemo(() => {
    const groups = groupBy(providers, 'TEMPLATE.PLAIN.provider')

    return Object.entries(providerConfig).map(([id, { name, color }]) => ({
      color,
      title: name,
      value: groups[id]?.length ?? 0,
    }))
  }, [totalProviders])

  const title = useMemo(
    () => (
      <div className={classes.title}>
        <Typography className={classes.titlePrimary}>
          <NumberEasing value={`${totalProviders}`} />
          <span>{T.Providers}</span>
        </Typography>
        <Typography className={classes.titleSecondary}>{T.InTotal}</Typography>
      </div>
    ),
    [classes, totalProviders]
  )

  const legend = useMemo(
    () => (
      <div>
        {chartData?.map(({ title: titleLegend, value, color }) => (
          <TypographyWithPoint key={titleLegend} pointColor={color}>
            <NumberEasing value={`${value}`} />
            <span className={classes.legendSecondary} title={titleLegend}>
              {titleLegend}
            </span>
          </TypographyWithPoint>
        ))}
      </div>
    ),
    [classes, chartData]
  )

  const chart = useMemo(
    () => (
      <PieChart
        className={classes.chart}
        background={totalProviders === 0 && '#c3c3c3'}
        data={chartData}
        lineWidth={18}
        rounded
        animate
      />
    ),
    [classes, chartData]
  )

  return useMemo(
    () =>
      !totalProviders && isLoading ? (
        <Skeleton variant="rectangular" sx={{ height: { xs: 210, sm: 350 } }} />
      ) : (
        <Paper
          data-cy="dashboard-widget-total-providers-by-type"
          className={classes.root}
        >
          {title}
          <div className={classes.content}>
            {chart}
            {legend}
          </div>
        </Paper>
      ),
    [classes, chart, totalProviders, isLoading]
  )
}

TotalProviders.displayName = 'TotalProviders'

export default TotalProviders
