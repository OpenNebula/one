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
import { Component } from 'react'
import { Box } from '@mui/material'
import { DateTime } from 'luxon'

import { Datepicker } from '@modules/componentsv2/primitives/Datepicker'
import { T } from '@ConstantsModule'

const toDate = (date) => {
  if (!date) return null
  if (date instanceof Date) return date
  if (DateTime.isDateTime(date)) return date.toJSDate()

  return new Date(date)
}

const toDateTime = (date) => {
  if (!date) return null
  if (DateTime.isDateTime(date)) return date

  return DateTime.fromJSDate(date)
}

const isMonthYearView = (views = []) =>
  views.includes('month') && views.includes('year') && views.length === 2

/**
 * DateRangeFilter component for selecting a date range.
 *
 * @param {object} props - Component properties.
 * @param {object} props.initialStartDate - The initial start date value.
 * @param {object} props.initialEndDate - The initial end date value.
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
  const dateRange = {
    startDate: initialStartDate,
    endDate: initialEndDate,
  }

  const handleDateChange = (type, date) => {
    const updatedRange = {
      ...dateRange,
      [type]: toDateTime(date),
    }

    onDateChange(updatedRange)
  }

  const useMonthYearPicker = isMonthYearView(views)
  const dateFormat = useMonthYearPicker ? 'MM/yyyy' : 'dd/MM/yyyy'
  const pickerProps = {
    dateFormat,
    showMonthYearPicker: useMonthYearPicker,
  }

  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: `${theme.scale[300]}px`,
        width: '100%',
      })}
    >
      <Box>
        <Datepicker
          label={T.StartDate}
          value={toDate(dateRange.startDate)}
          onChange={(date) => handleDateChange('startDate', date)}
          maxDate={toDate(dateRange.endDate) ?? new Date()}
          {...pickerProps}
        />
      </Box>

      <Box>
        <Datepicker
          label={T.EndDate}
          value={toDate(dateRange.endDate)}
          onChange={(date) => handleDateChange('endDate', date)}
          minDate={toDate(dateRange.startDate) ?? new Date('1900-01-01')}
          {...pickerProps}
        />
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

DateRangeFilter.displayName = 'DateRangeFilter'
