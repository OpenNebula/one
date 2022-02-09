/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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

import { Skeleton, Paper, Typography } from '@mui/material'

import { useProvision } from 'client/features/One'
import { SingleBar } from 'client/components/Charts'
import NumberEasing from 'client/components/NumberEasing'
import { groupBy } from 'client/utils'
import { T, PROVISIONS_STATES } from 'client/constants'

import useStyles from 'client/components/Widgets/TotalProvisionsByState/styles'

const TotalProvisionsByState = ({ isLoading }) => {
  const classes = useStyles()
  const provisions = useProvision()
  const totalProvisions = provisions?.length

  const chartData = useMemo(() => {
    const groups = groupBy(provisions, 'TEMPLATE.BODY.state')

    return PROVISIONS_STATES.map(
      (_, stateIndex) => groups[stateIndex]?.length ?? 0
    )
  }, [totalProvisions])

  const title = useMemo(
    () => (
      <div className={classes.title}>
        <Typography className={classes.titlePrimary}>
          <NumberEasing value={`${totalProvisions}`} />
          <span>{T.Provisions}</span>
        </Typography>
        <Typography className={classes.titleSecondary}>{T.InTotal}</Typography>
      </div>
    ),
    [classes, totalProvisions]
  )

  return useMemo(
    () =>
      !totalProvisions && isLoading ? (
        <Skeleton variant="rectangular" sx={{ height: { xs: 210, sm: 350 } }} />
      ) : (
        <Paper
          data-cy="dashboard-widget-provisions-by-states"
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
      ),
    [classes, chartData, totalProvisions, isLoading]
  )
}

TotalProvisionsByState.displayName = 'TotalProvisionsByState'

export default TotalProvisionsByState
