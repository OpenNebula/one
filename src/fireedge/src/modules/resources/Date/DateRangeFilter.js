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
import PropTypes from 'prop-types'
import { Component, useState } from 'react'
import { Box, TextField } from '@mui/material'
import { DatePicker, LocalizationProvider } from '@mui/lab'
import { DateTime, Settings } from 'luxon'
import { useTranslation } from '@ProvidersModule'
import { T } from '@ConstantsModule'

import AdapterLuxon from '@mui/lab/AdapterLuxon'
import { useAuth } from '@FeaturesModule'

const textFieldSx = {
  minWidth: 220,
  '& .MuiInputLabel-root': { color: 'text.body' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'text.action' },
  '& .MuiOutlinedInput-root': {
    bgcolor: 'surface.primary',
    color: 'text.headings',
    '& fieldset': { borderColor: 'border.primary' },
    '&:hover fieldset': { borderColor: 'border.actionHover' },
    '&.Mui-focused fieldset': { borderColor: 'border.focus' },
  },
  '& .MuiIconButton-root, & .MuiSvgIcon-root': { color: 'icon.action' },
}

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
  const { translate } = useTranslation()
  // Set language for date picker
  const { settings: fireedge = {} } = useAuth()
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
          label={translate(T.StartDate)}
          value={dateRange.startDate}
          onChange={(date) => handleDateChange('startDate', date)}
          maxDate={dateRange.endDate || today}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              margin="dense"
              sx={textFieldSx}
            />
          )}
          views={views}
        />
      </LocalizationProvider>

      <Box marginLeft={2}>
        <LocalizationProvider dateAdapter={AdapterLuxon} locale={lang}>
          <DatePicker
            label={translate(T.EndDate)}
            value={dateRange.endDate}
            onChange={(date) => handleDateChange('endDate', date)}
            minDate={dateRange.startDate || '1900-01-01'}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                margin="dense"
                sx={textFieldSx}
              />
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
