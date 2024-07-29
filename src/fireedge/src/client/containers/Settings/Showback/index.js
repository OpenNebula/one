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
import { ReactElement, useState } from 'react'
import { Paper, Box, Typography, Stack, Button } from '@mui/material'

import { T } from 'client/constants'
import { Translate, Tr } from 'client/components/HOC'
import { DateTime } from 'luxon'
import { DateRangeFilter } from 'client/components/Date'

import { useLazyCalculateShowbackQuery } from 'client/features/OneApi/vm'
import { useGeneralApi } from 'client/features/General'

/**
 * Section to calculate showback data.
 *
 * @returns {ReactElement} Settings showback
 */
const Settings = () => {
  // Get functions to success and error
  const { enqueueError, enqueueSuccess } = useGeneralApi()

  // Hook to calculate showback
  const [calculateShowback] = useLazyCalculateShowbackQuery()

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
    <Paper component="form" variant="outlined">
      <Box mt="0.5rem" p="1rem">
        <Typography variant="underline">
          <Translate word={T['showback.title']} />
        </Typography>
      </Box>

      <Stack height={1} gap="0.5rem" p="0.5rem" overflow="auto">
        <DateRangeFilter
          initialStartDate={dateRange.startDate}
          initialEndDate={dateRange.endDate}
          onDateChange={handleDateChange}
          views={['month', 'year']}
        />
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleCalculateClick}
          sx={{ m: '1rem' }}
        >
          {Tr(T['showback.button.calculateShowback'])}
        </Button>
        <Typography variant="body2" gutterBottom sx={{ m: '1rem' }}>
          {Tr(T['showback.button.help.paragraph.1'])}
        </Typography>
      </Stack>
    </Paper>
  )
}

export default Settings
