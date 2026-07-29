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
import { forwardRef, Component } from 'react'
import { Box } from '@mui/material'
import { getStyles } from '@modules/componentsv2/composed/DetailsDrawer/Default/slots/summary/styles'
import { Tooltip } from '@modules/componentsv2/primitives/Tooltip/Default'

/**
 * SummarySlot component.
 *
 * @param {object} root0 - Params
 * @returns {Component} - SummarySlot component
 */
export const SummarySlot = forwardRef(({ labels = [] }, ref) => (
  <Box
    sx={(theme) =>
      getStyles({
        theme,
      })
    }
    ref={ref}
  >
    {labels?.map(([title, value], idx) => (
      <Box key={idx} className="region-summary">
        {typeof title === 'string' ? (
          <Tooltip title={title} followCursor>
            <span className="region-summary--title text-ellipsis">{title}</span>
          </Tooltip>
        ) : (
          <Box className="region-summary--title">{title}</Box>
        )}
        {value && (
          <span className="region-summary--value text-ellipsis">{value}</span>
        )}
      </Box>
    ))}
  </Box>
))

SummarySlot.propTypes = {
  labels: PropTypes.array,
}

SummarySlot.displayName = 'SummarySlot'
