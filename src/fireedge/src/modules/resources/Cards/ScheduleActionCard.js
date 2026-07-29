/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { WarningTriangle as WarningIcon } from 'iconoir-react'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'

import { StatusChip } from '@modules/resources/Status'
import { rowStyles } from '@modules/resources/Tables/styles'
import Timer from '@modules/resources/Timer'

import { T, TEMPLATE_SCHEDULE_TYPE_STRING } from '@ConstantsModule'
import {
  getPeriodicityByTimeInSeconds,
  getRepeatInformation,
  getTypeScheduleAction,
  isRelative,
} from '@ModelsModule'
import { sentenceCase, timeFromMilliseconds } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'

const StyledTypography = styled(Typography)(({ theme }) => ({
  marginLeft: `${theme.spacing(1)} !important`,
}))

const StyledTypographyTypeSchedule = styled(Typography)(() => ({
  fontStyle: 'italic',
}))

const ScheduleActionCard = memo(({ schedule, actions }) => {
  const { translate } = useTranslation()
  const theme = useTheme()
  const classes = useMemo(() => rowStyles(theme), [theme])
  const { palette } = useTheme()

  const { ID, ACTION, TIME, MESSAGE, DONE, WARNING, NAME } = schedule

  const typeScheduleText =
    translate(
      TEMPLATE_SCHEDULE_TYPE_STRING?.[getTypeScheduleAction(schedule)]
    ) + ':' || ''

  const titleName = NAME ? `(${NAME})` : ''
  const titleAction = `#${ID} ${translate(sentenceCase(ACTION))} ${titleName}`
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
            <StyledTypography variant="caption">
              {translate(repeat)}
            </StyledTypography>
          )}
          {end && (
            <StyledTypography variant="caption">
              {translate(end)}
            </StyledTypography>
          )}
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
                    {time?.time} {translate(time?.period)}
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
