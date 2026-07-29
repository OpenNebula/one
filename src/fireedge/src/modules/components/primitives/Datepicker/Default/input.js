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
import { Box, TextField } from '@mui/material'
import { Calendar } from 'iconoir-react'
import { forwardRef, Component } from 'react'

/**
 * @param {object} root0 - Props
 * @param {string} root0.value - Current selected date
 * @param {Function} root0.onClick - On click handler
 * @param {string} root0.className - Classname
 * @param {string} root0.label - Input label
 * @param {string} root0.placeholder - Input placeholder
 * @param {boolean} root0.disabled - Disabled state
 * @param {string} root0.dataCy - Cypress selector
 * @returns {Component} - Dateinput component
 */
export const CalendarInput = forwardRef(
  (
    {
      value,
      onClick,
      className,
      label,
      placeholder = 'DD/MM/YYYY',
      disabled,
      dataCy,
    },
    ref
  ) => (
    <Box className={className} ref={ref} onClick={onClick}>
      <TextField
        variant="standard"
        id="datepicker-input"
        label={label}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        inputProps={{
          'data-cy': dataCy,
          sx: {
            height: '100%',
            padding: 0,
            margin: 0,
          },
        }}
        InputProps={{
          disableUnderline: true,
          endAdornment: (
            <Box className="datepicker-input-endadornment">
              <Calendar width={'16px'} height={'16px'} />
            </Box>
          ),
          sx: (theme) => ({
            padding: 0,
            border: 0,
            borderRadius: `${theme.borderRadius.xlg}px`,
            height: '100%',
          }),
        }}
      />
    </Box>
  )
)

CalendarInput.propTypes = {
  value: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  dataCy: PropTypes.string,
}

CalendarInput.displayName = 'CalendarInput'
