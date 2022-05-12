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
import { memo } from 'react'
import PropTypes from 'prop-types'
import { WarningTriangleOutline as WarningIcon } from 'iconoir-react'
import { useTheme, Typography, Paper, Stack } from '@mui/material'

import Timer from 'client/components/Timer'
import { StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import {
  isRelative,
  getPeriodicityByTimeInSeconds,
  getRepeatInformation,
} from 'client/models/Scheduler'
import { timeFromMilliseconds } from 'client/models/Helper'
import { sentenceCase } from 'client/utils'
import { T } from 'client/constants'

const ScheduleActionCard = memo(({ schedule, actions }) => {
  const classes = rowStyles()
  const { palette } = useTheme()

  const { ID, ACTION, TIME, MESSAGE, DONE, WARNING } = schedule

  const titleAction = `#${ID} ${sentenceCase(ACTION)}`
  const timeIsRelative = isRelative(TIME)

  const time = timeIsRelative ? getPeriodicityByTimeInSeconds(TIME) : TIME
  const formatTime =
    !timeIsRelative && timeFromMilliseconds(+TIME).toFormat('ff')
  const formatDoneTime = DONE && timeFromMilliseconds(+DONE).toFormat('ff')

  const { repeat, end } = getRepeatInformation(schedule)

  const noMore = !repeat && DONE

  return (
    <Paper variant="outlined" className={classes.root}>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography noWrap component="span">
            {titleAction}
          </Typography>
          {MESSAGE && (
            <span className={classes.labels}>
              <StatusChip text={MESSAGE} />
            </span>
          )}
        </div>
        <Stack
          mt={0.5}
          spacing={2}
          alignItems="center"
          flexWrap="wrap"
          direction="row"
        >
          {repeat && <Typography variant="caption">{repeat}</Typography>}
          {end && <Typography variant="caption">{end}</Typography>}
          {DONE && (
            <Typography variant="caption" title={formatDoneTime}>
              <Timer initial={DONE} translateWord={T.DoneAgo} />
            </Typography>
          )}
          {!noMore && (
            <>
              <Typography variant="caption">
                {timeIsRelative ? (
                  <span>{Object.values(time).join(' ')}</span>
                ) : (
                  <span title={formatTime}>
                    <Timer initial={TIME} translateWord={T.FirstTime} />
                  </span>
                )}
              </Typography>
              {WARNING && <WarningIcon color={palette.warning.main} />}
            </>
          )}
        </Stack>
      </div>
      {actions && (
        <div className={classes.actions}>
          {typeof actions === 'function' ? actions({ noMore }) : actions}
        </div>
      )}
    </Paper>
  )
})

ScheduleActionCard.propTypes = {
  schedule: PropTypes.object.isRequired,
  actions: PropTypes.any,
}

ScheduleActionCard.displayName = 'ScheduleActionCard'

export default ScheduleActionCard
