import * as React from 'react'

import { PieChart } from 'react-minimal-pie-chart'
import { Typography, Paper } from '@material-ui/core'

import { useProvision } from 'client/hooks'
import { TypographyWithPoint } from 'client/components/Typography'
import Count from 'client/components/Count'
import { groupBy } from 'client/utils'
import { T, PROVIDERS_TYPES } from 'client/constants'

import useStyles from 'client/components/Widgets/TotalProviders/styles'

const TotalProviders = () => {
  const { providers } = useProvision()

  const classes = useStyles()

  const totalProviders = React.useMemo(() => providers.length, [providers.length])

  const chartData = React.useMemo(() => {
    const groups = groupBy(providers, 'TEMPLATE.PLAIN.provider')

    return PROVIDERS_TYPES?.map(({ name, color }) => ({
      color,
      title: name,
      value: groups[name]?.length ?? 0
    }))
  }, [totalProviders])

  const title = React.useMemo(() => (
    <div className={classes.title}>
      <Typography className={classes.titlePrimary}>
        <Count number={`${totalProviders}`} />
        <span>{T.Providers}</span>
      </Typography>
      <Typography className={classes.titleSecondary}>
        {T.InTotal}
      </Typography>
    </div>
  ), [classes, totalProviders])

  const legend = React.useMemo(() => (
    <div>
      {chartData?.map(({ title: titleLegend, value, color }) =>
        <div key={titleLegend}>
          <TypographyWithPoint pointColor={color}>
            <Count number={`${value}`} />
            <Typography component='span' className={classes.legendSecondary}>
              {titleLegend}
            </Typography>
          </TypographyWithPoint>
        </div>
      )}
    </div>
  ), [classes, chartData])

  const chart = React.useMemo(() => (
    <PieChart
      className={classes.chart}
      background={totalProviders === 0 && '#c3c3c3'}
      data={chartData}
      lineWidth={18}
      rounded
      animate
    />
  ), [classes, chartData])

  return (
    <Paper
      data-cy='dashboard-widget-total-providers-by-type'
      className={classes.root}
    >
      {title}
      <div className={classes.content}>
        {chart}
        {legend}
      </div>
    </Paper>
  )
}

TotalProviders.displayName = 'TotalProviders'

export default TotalProviders
