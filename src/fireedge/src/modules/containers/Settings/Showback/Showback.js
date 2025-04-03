/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { DateRangeFilter, Tr } from '@ComponentsModule'
import { STYLE_BUTTONS, T } from '@ConstantsModule'
import { css } from '@emotion/css'
import { VmAPI, useGeneralApi } from '@FeaturesModule'
import { SubmitButton } from '@modules/components/FormControl'
import { useSettingWrapper } from '@modules/containers/Settings/Wrapper'
import { Box, Stack, Typography, useTheme } from '@mui/material'
import { DateTime } from 'luxon'
import { ReactElement, useMemo, useState } from 'react'
const styles = ({ typography, palette }) => ({
  formContainer: css({
    alignItems: 'center',
  }),
})

/**
 * Section to calculate showback data.
 *
 * @returns {ReactElement} Settings showback
 */
export const Settings = () => {
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])

  const { Legend, InternalWrapper } = useSettingWrapper()
  // Get functions to success and error
  const { enqueueError, enqueueSuccess } = useGeneralApi()

  // Hook to calculate showback
  const [calculateShowback] = VmAPI.useLazyCalculateShowbackQuery()

  // Create hooks for date range
  const [dateRange, setDateRange] = useState({
    startDate: DateTime.now().minus({ months: 1 }),
    endDate: DateTime.now(),
  })

  const handleDateChange = (newDateRange) => {
    setDateRange(newDateRange)
  }

  // Refetch data when click on Get showback button
  const handleCalculateClick = async () => {
    const params = {
      startMonth: dateRange.startDate.month,
      startYear: dateRange.startDate.year,
      endMonth: dateRange.endDate.month,
      endYear: dateRange.endDate.year,
    }

    try {
      await calculateShowback(params)
      enqueueSuccess(T.SuccessShowbackCalculated)
    } catch (error) {
      enqueueError(T.ErrorShowbackCalculated, error.message)
    }
  }

  return (
    <Box component="form">
      <Legend title={T['showback.title']} />
      <InternalWrapper>
        <Typography variant="body2" gutterBottom sx={{ m: '1rem' }}>
          {Tr(T['showback.button.help.paragraph.1'])}
        </Typography>
        <Stack
          height={1}
          gap="0.5rem"
          p="0.5rem"
          overflow="auto"
          className={classes.formContainer}
        >
          <DateRangeFilter
            initialStartDate={dateRange.startDate}
            initialEndDate={dateRange.endDate}
            onDateChange={handleDateChange}
            views={['month', 'year']}
          />
          <SubmitButton
            onClick={handleCalculateClick}
            importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
            size={STYLE_BUTTONS.SIZE.MEDIUM}
            type={STYLE_BUTTONS.TYPE.FILLED}
            label={T['showback.button.calculateShowback']}
          />
        </Stack>
      </InternalWrapper>
    </Box>
  )
}
