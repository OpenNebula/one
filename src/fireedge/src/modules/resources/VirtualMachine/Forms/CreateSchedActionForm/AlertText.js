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
import {
  ALL_DAYS,
  END_TYPE_VALUES,
  REPEAT_VALUES,
  SCHEDULE_TYPE,
  TEMPLATE_SCHEDULE_TYPE_STRING,
  VM_SCHEDULE_TYPE_STRING,
} from '@ConstantsModule'
import { getRepeatInformation } from '@ModelsModule'
import { useTranslation } from '@ProvidersModule'
import { AlertNotification } from '@ComponentsV2Module'
import { Box } from '@mui/material'
import { DateTime } from 'luxon'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

const getNow = () => DateTime.now()

const getNextWeek = () =>
  getNow().plus({ weeks: 1 }).set({ hour: 12, minute: 0, second: 0 })

const toSeconds = (value) => {
  if ([undefined, null, ''].includes(value)) return undefined
  if (value?.toSeconds) return value.toSeconds()
  if (value instanceof Date) return Math.trunc(value.getTime() / 1000)

  const numberValue = Number(value)
  if (Number.isFinite(numberValue)) {
    return numberValue > 9999999999
      ? Math.trunc(numberValue / 1000)
      : numberValue
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? undefined
    : Math.trunc(date.getTime() / 1000)
}

const formatScheduleTime = (value) => {
  const seconds = toSeconds(value)
  if (!Number.isFinite(seconds)) return ''

  const dateTime = DateTime.fromSeconds(seconds)

  return [dateTime.toRelative(), dateTime.toFormat('ff')]
    .filter(Boolean)
    .join(' - ')
}

const VisualAlert = ({ title, description }) => (
  <Box
    sx={{
      width: '100%',
      '& [role="alert"]': {
        boxSizing: 'border-box',
        width: '100%',
      },
    }}
  >
    <AlertNotification
      type="primary"
      status="information"
      isDismissible={false}
      title={title}
      description={description}
    />
  </Box>
)

VisualAlert.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
}

VisualAlert.displayName = 'VisualAlert'

/**
 * Render alert of schedule actions.
 *
 * @param {object} data - Data of schedule action
 * @returns {ReactElement|string} App rendered.
 */
const AlertText = (data) => {
  const { translate } = useTranslation()
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
  const scheduleTypeLabels =
    PERIODIC === SCHEDULE_TYPE.RELATIVE
      ? TEMPLATE_SCHEDULE_TYPE_STRING
      : VM_SCHEDULE_TYPE_STRING
  const typeScheduleText = translate(scheduleTypeLabels?.[PERIODIC]) || ''

  if (PERIODIC === SCHEDULE_TYPE.RELATIVE) {
    if (!RELATIVE_TIME || !PERIOD) {
      return ''
    }

    return (
      <VisualAlert
        title={typeScheduleText}
        description={`${RELATIVE_TIME} ${translate(PERIOD)}`}
      />
    )
  } else {
    if (!TIME) {
      return ''
    }
    const scheduleTimeText = formatScheduleTime(TIME)

    switch (PERIODIC) {
      case SCHEDULE_TYPE.PERIODIC: {
        let endValue =
          END_TYPE === END_TYPE_VALUES.DATE ? toSeconds(END_VALUE) : END_VALUE
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
        const description = [
          repeat && translate(repeat),
          end && translate(end),
          scheduleTimeText,
        ]
          .filter(Boolean)
          .join(' - ')

        return (
          <VisualAlert title={typeScheduleText} description={description} />
        )
      }
      default:
        return (
          <VisualAlert
            title={typeScheduleText}
            description={scheduleTimeText}
          />
        )
    }
  }
}

export default AlertText
