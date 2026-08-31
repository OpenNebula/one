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

import { forwardRef, useState, useEffect, Component } from 'react'
import PropTypes from 'prop-types'
import { Box, GlobalStyles } from '@mui/material'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import 'react-datepicker/dist/react-datepicker-cssmodules.css'
import { CalendarHeader } from '@modules/components/primitives/Datepicker/Default/header'
import { CalendarInput } from '@modules/components/primitives/Datepicker/Default/input'
import {
  getPortalStyles,
  getStyles,
} from '@modules/components/primitives/Datepicker/Default/styles'
import { isSameDay, isSameMonth } from 'date-fns'
import en from 'date-fns/locale/en-US'
import { DateTime } from 'luxon'
import {
  CURRENT_TIME_ZONE,
  DATE_FORMAT,
  DATE_PLACEHOLDER,
} from '@ConstantsModule'

const toDatepickerDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return date

  const zonedDate = DateTime.fromJSDate(date, { zone: CURRENT_TIME_ZONE })

  return new Date(
    zonedDate.year,
    zonedDate.month - 1,
    zonedDate.day,
    zonedDate.hour,
    zonedDate.minute,
    zonedDate.second,
    zonedDate.millisecond
  )
}

const fromDatepickerDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return date

  return DateTime.fromObject(
    {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      millisecond: date.getMilliseconds(),
    },
    { zone: CURRENT_TIME_ZONE }
  ).toJSDate()
}

const convertDateValue = (value, converter) =>
  Array.isArray(value) ? value.map(converter) : converter(value)

/**
 * Datepicker component displays date selector.
 *
 * @param {object} root0 - Params
 * @param {Function} root0.onDismiss - Callback when close button is clicked
 * @param {Function} root0.onChange - Callback when date is changed
 * @param {boolean} root0.isMultipleSelectable - Controls whether to select more than 1 date
 * @param {Date|Date[]} root0.value - Controlled selected date value
 * @param {string} root0.label - Input label
 * @param {string} root0.placeholder - Input placeholder
 * @param {string} root0.dataCy - Cypress selector
 * @param {object} root0.locale - Date fns locale import
 * @returns {Component} - Datepicker component
 */
export const Datepicker = forwardRef(
  (
    {
      onDismiss = () => {},
      onChange,
      isMultipleSelectable = false,
      value,
      label,
      placeholder = DATE_PLACEHOLDER,
      dateFormat = DATE_FORMAT,
      dataCy,
      locale = en,
      portalId,
      ...datePickerProps
    },
    ref
  ) => {
    const [currentMonth, setCurrentMonth] = useState(() =>
      toDatepickerDate(new Date())
    )
    const [selectedDates, setSelectedDates] = useState(null)
    const { minDate, maxDate, ...restDatePickerProps } = datePickerProps

    // Resets the state value properly
    const isControlled = value !== undefined
    const selectedValue =
      value ?? selectedDates ?? (isMultipleSelectable ? [] : null)
    const datepickerSelectedValue = convertDateValue(
      selectedValue,
      toDatepickerDate
    )
    const today = toDatepickerDate(new Date())

    useEffect(() => {
      if (!isControlled) {
        setSelectedDates(isMultipleSelectable ? [] : null)
      }
    }, [isControlled, isMultipleSelectable])

    const getDayClassName = (date) => {
      const classes = []

      if (isSameDay(date, today)) {
        classes.push('highlight-today')
      }

      if (!isSameMonth(date, currentMonth)) {
        classes.push('outside-current-month')
      }

      return classes.join(' ')
    }

    return (
      <>
        {portalId && (
          <GlobalStyles
            styles={(theme) => getPortalStyles({ theme, portalId })}
          />
        )}
        <Box sx={(theme) => getStyles({ theme })} ref={ref}>
          <DatePicker
            selectsMultiple={isMultipleSelectable}
            shouldCloseOnSelect={!isMultipleSelectable}
            showPopperArrow={false}
            disabledKeyboardNavigation
            placeholderText={placeholder}
            renderCustomHeader={(props) => (
              <CalendarHeader
                {...props}
                className={'datepicker-header'}
                locale={locale}
              />
            )}
            customInput={
              <CalendarInput
                className="datepicker-input"
                dataCy={dataCy}
                label={label}
              />
            }
            dayClassName={getDayClassName}
            calendarClassName={'datepicker-calendar'}
            wrapperClassName={'datepicker-wrapper'}
            popperPlacement="bottom-start"
            onMonthChange={(date) => setCurrentMonth(date)}
            onYearChange={(date) => setCurrentMonth(date)}
            onCalendarClose={() =>
              setCurrentMonth(toDatepickerDate(new Date()))
            }
            onChange={(dates) => {
              const convertedDates = convertDateValue(dates, fromDatepickerDate)

              if (!isControlled) {
                setSelectedDates(convertedDates)
              }
              onChange?.(convertedDates)
            }}
            onDismiss={onDismiss}
            locale={locale}
            portalId={portalId}
            dateFormat={dateFormat}
            minDate={toDatepickerDate(minDate)}
            maxDate={toDatepickerDate(maxDate)}
            {...restDatePickerProps}
            {...{
              [isMultipleSelectable ? 'selectedDates' : 'selected']:
                datepickerSelectedValue,
            }}
          />
        </Box>
      </>
    )
  }
)

Datepicker.propTypes = {
  onDismiss: PropTypes.func,
  onChange: PropTypes.func,
  isMultipleSelectable: PropTypes.bool,
  value: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  ]),
  dateFormat: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  dataCy: PropTypes.string,
  locale: PropTypes.object,
  portalId: PropTypes.string,
}

Datepicker.displayName = 'Datepicker'
