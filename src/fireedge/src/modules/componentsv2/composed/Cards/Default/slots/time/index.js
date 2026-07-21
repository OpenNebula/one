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

import { forwardRef, Component } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { getStyles } from '@modules/componentsv2/composed/Cards/Default/slots/time/styles'
import { T } from '@ConstantsModule'
import { timeFromMilliseconds } from '@UtilsModule'

/**
 * TimeSlot component.
 *
 * @param {object} root0 - Params
 * @param {string} root0.time - Time text
 * @param {string} root0.label - Time label
 * @returns {Component} - TimeSlot component
 */
export const TimeSlot = forwardRef(({ time, label = T.Registered }, ref) => (
  <Box
    sx={(theme) =>
      getStyles({
        theme,
      })
    }
    ref={ref}
  >
    {time && (
      <Box className="region-label">
        <span className="region-label--value">{`${label} ${timeFromMilliseconds(
          +time
        ).toRelative()}`}</span>
      </Box>
    )}
  </Box>
))

TimeSlot.propTypes = {
  time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
}

TimeSlot.displayName = 'TimeSlot'
