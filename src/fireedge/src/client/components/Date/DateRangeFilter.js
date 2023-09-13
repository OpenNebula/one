/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { DateTime } from 'luxon'

/**
 * DateRangeFilter component for selecting a date range.
 *
 * @param {object} props - Component properties.
 * @param {string} props.initialStartDate - The initial start date value.
 * @param {string} props.initialEndDate - The initial end date value.
 * @param {Function} props.onDateChange - Callback function when date changes.
 * @returns {Component} DateRangeFilter component.
 */
export const DateRangeFilter = ({
  initialStartDate,
  initialEndDate,
  onDateChange,
}) => {
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
      <DatePicker
        label="Start Date"
        value={dateRange.startDate}
        onChange={(date) => handleDateChange('startDate', date)}
        maxDate={dateRange.endDate || today}
        renderInput={(params) => (
          <TextField {...params} variant="outlined" margin="dense" />
        )}
      />
      <Box marginLeft={2}>
        <DatePicker
          label="End Date"
          value={dateRange.endDate}
          onChange={(date) => handleDateChange('endDate', date)}
          minDate={dateRange.startDate || '1900-01-01'}
          renderInput={(params) => (
            <TextField {...params} variant="outlined" margin="dense" />
          )}
        />
      </Box>
    </Box>
  )
}

DateRangeFilter.propTypes = {
  initialStartDate: PropTypes.instanceOf(DateTime).isRequired,
  initialEndDate: PropTypes.instanceOf(DateTime).isRequired,
  onDateChange: PropTypes.func.isRequired,
}
