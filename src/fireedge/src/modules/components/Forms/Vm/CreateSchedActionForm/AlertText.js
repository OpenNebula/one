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
import {
  ALL_DAYS,
  END_TYPE_VALUES,
  REPEAT_VALUES,
  SCHEDULE_TYPE,
  TEMPLATE_SCHEDULE_TYPE_STRING,
} from '@ConstantsModule'
import { getRepeatInformation, timeFromMilliseconds } from '@ModelsModule'
import { Tr } from '@modules/components/HOC'
import Timer from '@modules/components/Timer'
import { Alert, styled, Typography } from '@mui/material'
import { DateTime } from 'luxon'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

const getNow = () => DateTime.now()

const getNextWeek = () =>
  getNow().plus({ weeks: 1 }).set({ hour: 12, minute: 0, second: 0 })

const StyledTypography = styled(Typography)(({ theme }) => ({
  marginLeft: `${theme.spacing(1)} !important`,
}))

const StyledTypographyTypeSchedule = styled(Typography)(() => ({
  fontStyle: 'italic',
}))

const VisualAlert = ({ children }) => <Alert severity="info">{children}</Alert>

VisualAlert.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
}

VisualAlert.displayName = 'VisualAlert'

/**
 * Render alert of schedule actions.
 *
 * @param {object} data - Data of schedule action
 * @returns {ReactElement} App rendered.
 */
const AlertText = (data) => {
  if (!data || !data?.PERIODIC) {
    return ''
  }

  const {
    PERIODIC,
    TIME,
    RELATIVE_TIME,
    PERIOD,
    REPEAT,
    WEEKLY,
    MONTHLY,
    YEARLY,
    HOURLY,
    END_TYPE,
    END_VALUE,
  } = data
  const typeScheduleText =
    Tr(TEMPLATE_SCHEDULE_TYPE_STRING?.[PERIODIC]) + ':' || ''

  if (PERIODIC === SCHEDULE_TYPE.RELATIVE) {
    if (!RELATIVE_TIME || !PERIOD) {
      return ''
    }

    return (
      <VisualAlert>
        <StyledTypographyTypeSchedule variant="caption">
          {typeScheduleText}
        </StyledTypographyTypeSchedule>
        <StyledTypography variant="caption">
          {RELATIVE_TIME} {Tr(PERIOD)}
        </StyledTypography>
      </VisualAlert>
    )
  } else {
    if (!TIME) {
      return ''
    }
    const time = TIME?.toSeconds
      ? TIME.toSeconds()
      : DateTime.fromJSDate(new Date(TIME)).toSeconds()
    const formatTime = timeFromMilliseconds(+time).toFormat('ff')

    switch (PERIODIC) {
      case SCHEDULE_TYPE.PERIODIC: {
        let endValue = END_VALUE?.toSeconds ? END_VALUE.toSeconds() : END_VALUE
        if (END_TYPE && !END_VALUE) {
          END_TYPE === END_TYPE_VALUES.REPETITION && (endValue = '')
          END_TYPE === END_TYPE_VALUES.DATE &&
            (endValue = getNextWeek().toSeconds())
        }

        const schedule = {
          END_TYPE,
          END_VALUE: endValue,
          REPEAT,
        }

        switch (REPEAT) {
          case REPEAT_VALUES.DAILY:
            schedule.REPEAT = REPEAT_VALUES.WEEKLY
            schedule.DAYS = ALL_DAYS
            break
          case REPEAT_VALUES.WEEKLY:
            schedule.DAYS = WEEKLY
            break
          case REPEAT_VALUES.MONTHLY:
            schedule.DAYS = MONTHLY
            break
          case REPEAT_VALUES.YEARLY:
            schedule.DAYS = YEARLY
            break
          default:
            schedule.DAYS = HOURLY
            break
        }

        const { repeat, end } = getRepeatInformation(schedule)

        return (
          <VisualAlert>
            <StyledTypographyTypeSchedule variant="caption">
              {typeScheduleText}
            </StyledTypographyTypeSchedule>
            {repeat && (
              <StyledTypography variant="caption">
                {Tr(repeat)}
              </StyledTypography>
            )}
            {end && (
              <StyledTypography variant="caption">{Tr(end)}</StyledTypography>
            )}
            <StyledTypography variant="caption" title={formatTime}>
              <Timer initial={time} />
            </StyledTypography>
          </VisualAlert>
        )
      }
      default:
        return (
          <VisualAlert>
            <StyledTypographyTypeSchedule variant="caption">
              {typeScheduleText}
            </StyledTypographyTypeSchedule>
            <StyledTypography variant="caption" title={formatTime}>
              <Timer initial={time} />
            </StyledTypography>
          </VisualAlert>
        )
    }
  }
}

export default AlertText
