import * as React from 'react'

import { Paper, Typography } from '@material-ui/core'

import { useProvision } from 'client/hooks'
import { SingleBar } from 'client/components/Charts'
import Count from 'client/components/Count'
import { groupBy } from 'client/utils'
import { T, PROVISIONS_STATES } from 'client/constants'

import useStyles from 'client/components/Widgets/TotalProvisionsByState/styles'

const TotalProvisionsByState = () => {
  const { provisions } = useProvision()
  const classes = useStyles()

  const chartData = React.useMemo(() => {
    const groups = groupBy(provisions, 'TEMPLATE.BODY.state')

    return PROVISIONS_STATES.map((_, stateIndex) =>
      groups[stateIndex]?.length ?? 0
    )
  }, [provisions])

  const totalProvisions = provisions.length

  const title = React.useMemo(() => (
    <div className={classes.title}>
      <Typography className={classes.titlePrimary}>
        <Count number={`${totalProvisions}`} />
        <span>{T.Provisions}</span>
      </Typography>
      <Typography className={classes.titleSecondary}>
        {T.InTotal}
      </Typography>
    </div>
  ), [classes, totalProvisions])

  return React.useMemo(() => (
    <Paper
      data-cy='dashboard-widget-provisions-by-states'
      className={classes.root}
    >
      {title}
      <div className={classes.content}>
        <SingleBar
          legend={PROVISIONS_STATES}
          data={chartData}
          total={totalProvisions}
        />
      </div>
    </Paper>
  ), [classes, chartData])
}

TotalProvisionsByState.displayName = 'TotalProvisionsByState'

export default TotalProvisionsByState
