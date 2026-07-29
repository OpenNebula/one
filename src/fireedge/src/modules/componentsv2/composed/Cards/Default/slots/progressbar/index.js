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

import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { getStyles } from '@modules/componentsv2/composed/Cards/Default/slots/progressbar/styles'
import { ProgressBar } from '@modules/componentsv2/primitives/Progress/Bar'

/**
 * ProgressBarSlot component.
 *
 * @param {object} params - Params
 * @param {Array} params.bars - Progress bar entries
 * @returns {Component} - ProgressBarSlot component
 */
export const ProgressBarSlot = forwardRef(({ bars = [] }, ref) => (
  <Box
    sx={(theme) =>
      getStyles({
        theme,
      })
    }
    ref={ref}
  >
    {bars?.map(({ label, size, value, isLabelVisible, thresholds }, idx) => (
      <Box key={idx}>
        <ProgressBar
          label={label}
          size={size}
          value={value}
          isLabelVisible={isLabelVisible}
          thresholds={thresholds}
        />
      </Box>
    ))}
  </Box>
))

ProgressBarSlot.propTypes = {
  bars: PropTypes.array,
}

ProgressBarSlot.displayName = 'ProgressBarSlot'
