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
import PropTypes from 'prop-types'
import { Component, useState } from 'react'
import { Box, TextField } from '@mui/material'
import { DatePicker } from '@mui/lab'
import { DateTime, Settings } from 'luxon'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

import LocalizationProvider from '@mui/lab/LocalizationProvider'
import AdapterLuxon from '@mui/lab/AdapterLuxon'
import { useAuth } from 'client/features/Auth'

/**
 * DateRangeFilter component for selecting a date range.
 *
 * @param {object} props - Component properties.
 * @param {string} props.initialStartDate - The initial start date value.
 * @param {string} props.initialEndDate - The initial end date value.
 * @param {Function} props.onDateChange - Callback function when date changes.
 * @param {object} props.views - Views to format in component
 * @returns {Component} DateRangeFilter component.
 */
export const DateRangeFilter = ({
  initialStartDate,
  initialEndDate,
  onDateChange,
  views,
}) => {
  // Set language for date picker
  const { settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()
  const lang = fireedge?.LANG?.substring(0, 2)
  Settings.defaultLocale = lang

  const [dateRange, setDateRange] = useState({
    startDate: initialStartDate,
    endDate: initialEndDate,
  })

  const today = DateTime.now()

  const handleDateChange = (type, date) => {
    const updatedRange = {
      ...dateRange,
      [type]: date,
    }

    setDateRange(updatedRange)
    if (onDateChange) {
      onDateChange(updatedRange)
    }
  }

  return (
    <Box display="flex" alignItems="center" marginRight={2}>
      <LocalizationProvider dateAdapter={AdapterLuxon} locale={lang}>
        <DatePicker
          label={Tr(T.StartDate)}
          value={dateRange.startDate}
          onChange={(date) => handleDateChange('startDate', date)}
          maxDate={dateRange.endDate || today}
          renderInput={(params) => (
            <TextField {...params} variant="outlined" margin="dense" />
          )}
          views={views}
        />
      </LocalizationProvider>

      <Box marginLeft={2}>
        <LocalizationProvider dateAdapter={AdapterLuxon} locale={lang}>
          <DatePicker
            label={Tr(T.EndDate)}
            value={dateRange.endDate}
            onChange={(date) => handleDateChange('endDate', date)}
            minDate={dateRange.startDate || '1900-01-01'}
            renderInput={(params) => (
              <TextField {...params} variant="outlined" margin="dense" />
            )}
            views={views}
          />
        </LocalizationProvider>
      </Box>
    </Box>
  )
}

DateRangeFilter.propTypes = {
  initialStartDate: PropTypes.instanceOf(DateTime).isRequired,
  initialEndDate: PropTypes.instanceOf(DateTime).isRequired,
  onDateChange: PropTypes.func.isRequired,
  views: PropTypes.array,
}
