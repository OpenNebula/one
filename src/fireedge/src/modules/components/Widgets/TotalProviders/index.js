/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useMemo } from 'react'

import { useTheme, CircularProgress, Paper, Typography } from '@mui/material'

import { PieChart } from 'react-minimal-pie-chart'
import NumberEasing from '@modules/components/NumberEasing'
import { TypographyWithPoint } from '@modules/components/Typography'
import { T } from '@ConstantsModule'
import { ProviderAPI } from '@FeaturesModule'
import { groupBy } from '@UtilsModule'

import useStyles from '@modules/components/Widgets/TotalProviders/styles'

/**
 * Renders a widget to display the all providers grouped by type.
 *
 * @returns {ReactElement} Total providers by type
 */
const TotalProviders = () => {
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])
  const { data: config = {} } = ProviderAPI.useGetProviderConfigQuery()
  const { data: providers = [], isLoading } = ProviderAPI.useGetProvidersQuery()
  const totalProviders = providers?.length

  const chartData = useMemo(() => {
    const groups = groupBy(providers, 'TEMPLATE.PLAIN.provider')

    return Object.entries(config).map(([id, { name, color }]) => ({
      color,
      title: name,
      value: groups[id]?.length ?? 0,
    }))
  }, [totalProviders])

  const legend = useMemo(
    () => (
      <div>
        {chartData?.map(({ title: titleLegend, value, color }) => (
          <TypographyWithPoint key={titleLegend} pointColor={color}>
            <NumberEasing value={+value} />
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

  return (
    <Paper
      data-cy="dashboard-widget-total-providers-by-type"
      className={classes.root}
    >
      <div className={classes.title}>
        <Typography className={classes.titlePrimary}>
          {isLoading ? (
            <CircularProgress size={20} />
          ) : (
            <NumberEasing value={totalProviders} />
          )}
          <span>{T.Providers}</span>
        </Typography>
        <Typography className={classes.titleSecondary}>{T.InTotal}</Typography>
      </div>
      <div className={classes.content}>
        {chart}
        {legend}
      </div>
    </Paper>
  )
}

TotalProviders.displayName = 'TotalProviders'

export default TotalProviders
