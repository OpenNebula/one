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

import { Component, ReactNode, forwardRef, isValidElement } from 'react'
import PropTypes from 'prop-types'
import { Tooltip as MUITooltip, useTheme } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Tooltip/Default/styles'
import { useTranslation } from '@ProvidersModule'

/**
 * Tooltip component displays contextual information on hover.
 *
 * @param {object} root0 - Params
 * @param {string} root0.title - Tooltip text content
 * @param {string} root0.placement - Tooltip placement position
 * @param {ReactNode} root0.children - Element that triggers the tooltip
 * @returns {Component} - Tooltip component
 */
export const Tooltip = forwardRef(
  ({ title = '', placement, children, ...opts }, ref) => {
    const theme = useTheme()
    const { translate } = useTranslation()

    // Check children is a valid element to avoid errors in MUI Tooltip component
    if (!isValidElement(children)) {
      return children ?? null
    }

    return (
      <MUITooltip
        ref={ref}
        title={typeof title === 'string' ? translate(title) : title}
        arrow={false}
        componentsProps={{
          tooltip: {
            sx: getStyles({ theme }),
          },
        }}
        {...(placement && { placement })}
        {...opts}
      >
        {children}
      </MUITooltip>
    )
  }
)

Tooltip.propTypes = {
  title: PropTypes.node,
  placement: PropTypes.oneOf([
    'top',
    'top-start',
    'top-end',
    'bottom',
    'bottom-start',
    'bottom-end',
    'left',
    'left-start',
    'left-end',
    'right',
    'right-start',
    'right-end',
  ]),
  children: PropTypes.node,
}

Tooltip.displayName = 'Tooltip'
