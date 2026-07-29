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
import { getStyles } from '@modules/componentsv2/primitives/Badge/Default/styles'

/**
 * @param {object} root0 - Params
 * @param {string} root0.status - Badge status
 * @param {string} root0.type - Type of badge
 * @param {boolean} root0.isSelected - Parent controlled selection state
 * @returns {Component} - Custom MUI Badge component
 */
export const Badge = forwardRef(
  (
    { children, status = 'default', type = 'dot', title = '', ...opts },
    ref
  ) => (
    <Box
      ref={ref}
      sx={(theme) =>
        getStyles({
          theme,
          status,
          type,
        })
      }
      {...opts}
    >
      <Box className="badge-title">{children ?? title}</Box>
    </Box>
  )
)

Badge.propTypes = {
  children: PropTypes.node,
  status: PropTypes.string,
  type: PropTypes.string,
  title: PropTypes.string,
}

Badge.displayName = 'Badge'
