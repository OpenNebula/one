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
import {
  NavArrowLeft as MonthDecreaseIcon,
  FastArrowLeft as YearDecreaseIcon,
  NavArrowRight as MonthIncreaseIcon,
  FastArrowRight as YearIncreaseIcon,
} from 'iconoir-react'
import { format } from 'date-fns'
import { Button } from '@modules/componentsv2/primitives/Buttons'
import { Box, Typography } from '@mui/material'
import { Component } from 'react'

/**
 * @param {object} root0 - Props
 * @param {Date} root0.date - Current calendar date
 * @param {Function} root0.decreaseMonth - Decrement month
 * @param {Function} root0.increaseMonth - Increment month
 * @param {Function} root0.decreaseYear - Decrement month
 * @param {Function} root0.increaseYear - Increment month
 * @param {string} root0.className - Classname
 * @param {object} root0.locale - Date fns locale import
 * @returns {Component} - Datepicker header
 */
export const CalendarHeader = ({
  date,
  decreaseMonth,
  increaseMonth,
  increaseYear,
  decreaseYear,
  className,
  locale,
}) => (
  <Box className={className}>
    <Box className="date-range-buttons">
      <Button
        onClick={decreaseYear}
        aria-label="Previous year"
        iconOnly={<YearDecreaseIcon width={'24px'} height={'24px'} />}
        type="transparent"
      />
      <Button
        onClick={decreaseMonth}
        aria-label="Previous month"
        iconOnly={<MonthDecreaseIcon width={'24px'} height={'24px'} />}
        type="transparent"
      />
    </Box>

    <Typography className="month-year-display">
      {`${format(date, 'MMMM yyyy', {
        locale,
      })}`}
    </Typography>

    <Box className="date-range-buttons">
      <Button
        onClick={increaseMonth}
        aria-label="Next month"
        iconOnly={<MonthIncreaseIcon width={'24px'} height={'24px'} />}
        type="transparent"
      />
      <Button
        onClick={increaseYear}
        aria-label="Next year"
        iconOnly={<YearIncreaseIcon width={'24px'} height={'24px'} />}
        type="transparent"
      />
    </Box>
  </Box>
)

CalendarHeader.propTypes = {
  date: PropTypes.instanceOf(Date),
  decreaseMonth: PropTypes.func,
  increaseMonth: PropTypes.func,
  decreaseYear: PropTypes.func,
  increaseYear: PropTypes.func,
  className: PropTypes.string,
  locale: PropTypes.object,
}

CalendarHeader.displayName = 'CalendarHeader'
