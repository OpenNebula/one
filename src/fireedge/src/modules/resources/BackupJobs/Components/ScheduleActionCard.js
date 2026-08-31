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
import { memo } from 'react'

import { Tag } from '@ComponentsModule'
import RelativeTime from '@modules/resources/BackupJobs/Components/RelativeTime'

import { T, TEMPLATE_SCHEDULE_TYPE_STRING } from '@ConstantsModule'
import {
  getPeriodicityByTimeInSeconds,
  getRepeatInformation,
  getTypeScheduleAction,
  isRelative,
} from '@ModelsModule'
import {
  formatDateTime,
  sentenceCase,
  timeFromMilliseconds,
} from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'

const StyledTypography = styled(Typography)(({ theme }) => ({
  marginLeft: `${theme.spacing(1)} !important`,
}))

const StyledTypographyTypeSchedule = styled(Typography)(() => ({
  fontStyle: 'italic',
}))

const ScheduleActionCard = memo(({ schedule, actions }) => {
  const { translate } = useTranslation()
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
    !timeIsRelative && formatDateTime(timeFromMilliseconds(+TIME))
  const formatDoneTime =
    DONE && formatDateTime(timeFromMilliseconds(DONE === '-1' ? +TIME : +DONE))

  const { repeat, end } = getRepeatInformation(schedule)

  const noMore = !repeat && DONE

  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'flex',
        gap: 1,
        p: 1.5,
        alignItems: 'center',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Stack flex="1 1 auto" overflow="hidden">
        <Stack direction="row" gap={1} alignItems="center">
          <Typography noWrap component="span">
            {titleAction}
          </Typography>
          {MESSAGE && <Tag title={MESSAGE} />}
        </Stack>
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
              <RelativeTime
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
                    <RelativeTime initial={TIME} />
                  </span>
                )}
              </StyledTypography>
              {WARNING && <WarningIcon color={palette.warning.main} />}
            </>
          )}
        </Stack>
      </Stack>
      {actions &&
        (typeof actions === 'function' ? actions({ noMore }) : actions)}
    </Paper>
  )
})

ScheduleActionCard.propTypes = {
  schedule: PropTypes.object.isRequired,
  actions: PropTypes.any,
}

ScheduleActionCard.displayName = 'ScheduleActionCard'

export default ScheduleActionCard
