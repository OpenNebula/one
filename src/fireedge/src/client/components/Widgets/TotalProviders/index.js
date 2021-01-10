import * as React from 'react'

import { PieChart } from 'react-minimal-pie-chart'
import { Typography, useTheme, lighten, Paper } from '@material-ui/core'
import { Public as ProvidersIcon } from '@material-ui/icons'

import { useProvision } from 'client/hooks'
import { TypographyWithPoint } from 'client/components/Typography'
import { get } from 'client/utils'
import { T } from 'client/constants'

import useStyles from 'client/components/Widgets/TotalProviders/styles'

const TotalProviders = () => {
  const { providers, provisions } = useProvision()

  const classes = useStyles()
  const theme = useTheme()
  const usedColor = theme.palette.secondary.main
  const bgColor = lighten(theme.palette.background.paper, 0.8)

  const totalProviders = React.useMemo(() => providers.length, [providers])

  const usedProviders = React.useMemo(() =>
    provisions
      ?.map(provision => get(provision, 'TEMPLATE.BODY.provider'))
      ?.filter((provision, idx, self) => self.indexOf(provision) === idx)
      ?.length ?? 0
  , [provisions])

  const usedPercent = React.useMemo(() =>
    totalProviders !== 0 ? (usedProviders * 100) / totalProviders : 0
  , [totalProviders, usedProviders])

  const title = React.useMemo(() => (
    <div className={classes.title}>
      <Typography className={classes.titlePrimary}>
        {`${totalProviders} ${T.Providers}`}
      </Typography>
      <Typography className={classes.titleSecondary}>
        {T.InTotal}
      </Typography>
    </div>
  ), [classes, totalProviders])

  const legend = React.useMemo(() => (
    <div>
      <TypographyWithPoint key={usedProviders} pointColor={usedColor}>
        {`${usedProviders}`}
      </TypographyWithPoint>
      <Typography className={classes.legendSecondary}>
        {T.Used}
      </Typography>
    </div>
  ), [classes, usedProviders])

  const chart = React.useMemo(() => (
    <PieChart
      className={classes.chart}
      background={bgColor}
      data={[{ value: 1, key: 1, color: usedColor }]}
      reveal={usedPercent}
      lineWidth={20}
      lengthAngle={270}
      rounded
      animate
      label={({ dataIndex }) => (
        <ProvidersIcon
          key={dataIndex}
          x={25} y={25} width='50'height='50'
          style={{ fill: bgColor }}
        />
      )}
      labelPosition={0}
    />
  ), [classes, usedPercent])

  return (
    <Paper
      data-cy='dashboard-widget-total-providers-by-state'
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
