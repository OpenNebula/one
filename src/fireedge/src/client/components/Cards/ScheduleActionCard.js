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
import { Paper, Stack, Typography, styled, useTheme } from '@mui/material'
import { WarningTriangleOutline as WarningIcon } from 'iconoir-react'
import PropTypes from 'prop-types'
import { memo } from 'react'

import { StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'
import Timer from 'client/components/Timer'

import { T, TEMPLATE_SCHEDULE_TYPE_STRING } from 'client/constants'
import { timeFromMilliseconds } from 'client/models/Helper'
import {
  getPeriodicityByTimeInSeconds,
  getRepeatInformation,
  getTypeScheduleAction,
  isRelative,
} from 'client/models/Scheduler'
import { sentenceCase } from 'client/utils'
import { Tr } from 'client/components/HOC'

const StyledTypography = styled(Typography)(({ theme }) => ({
  marginLeft: `${theme.spacing(1)} !important`,
}))

const StyledTypographyTypeSchedule = styled(Typography)(() => ({
  fontStyle: 'italic',
}))

const ScheduleActionCard = memo(({ schedule, actions }) => {
  const classes = rowStyles()
  const { palette } = useTheme()

  const { ID, ACTION, TIME, MESSAGE, DONE, WARNING, NAME } = schedule

  const typeScheduleText =
    Tr(TEMPLATE_SCHEDULE_TYPE_STRING?.[getTypeScheduleAction(schedule)]) +
      ':' || ''

  const titleName = NAME ? `(${NAME})` : ''
  const titleAction = `#${ID} ${Tr(sentenceCase(ACTION))} ${titleName}`
  const timeIsRelative = isRelative(TIME)

  const time = timeIsRelative ? getPeriodicityByTimeInSeconds(TIME) : TIME
  const formatTime =
    !timeIsRelative && timeFromMilliseconds(+TIME).toFormat('ff')
  const formatDoneTime =
    DONE && timeFromMilliseconds(DONE === '-1' ? +TIME : +DONE).toFormat('ff')

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
          <StyledTypographyTypeSchedule variant="caption">
            {typeScheduleText}
          </StyledTypographyTypeSchedule>
          {repeat && (
            <StyledTypography variant="caption">{repeat}</StyledTypography>
          )}
          {end && <StyledTypography variant="caption">{end}</StyledTypography>}
          {DONE && (
            <StyledTypography variant="caption" title={formatDoneTime}>
              <Timer
                initial={DONE === '-1' ? +TIME : +DONE}
                translateWord={T.DoneAgo}
              />
            </StyledTypography>
          )}
          {!noMore && (
            <>
              <StyledTypography variant="caption">
                {timeIsRelative ? (
                  <span>
                    {time?.time} {Tr(time?.period)}
                  </span>
                ) : (
                  <span title={formatTime}>
                    <Timer initial={TIME} />
                  </span>
                )}
              </StyledTypography>
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
