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
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Component, forwardRef } from 'react'

import {
  getItemStyles,
  getStyles,
} from '@modules/componentsv2/composed/Dashboard/Panel/styles'

const PANEL_ITEM_SIZES = ['quarter', 'third', 'half', 'full', 'wide', 'narrow']

/**
 * Flexible dashboard content area.
 *
 * @param {object} props - Component properties
 * @param {Component} props.children - Dashboard items
 * @param {object} ref - Forwarded ref
 * @returns {Component} Dashboard panel
 */
export const DashboardPanel = forwardRef(({ children, ...opts }, ref) => (
  <Box
    ref={ref}
    {...opts}
    sx={(theme) =>
      getStyles({
        theme,
      })
    }
  >
    {children}
  </Box>
))

DashboardPanel.propTypes = {
  children: PropTypes.node,
}

DashboardPanel.displayName = 'DashboardPanel'

/**
 * Flexible item inside a dashboard panel.
 *
 * The item is the future integration point for widget ordering and resizing.
 *
 * @param {object} props - Component properties
 * @param {'quarter'|'third'|'half'|'full'|'wide'|'narrow'} props.size - Preferred item width
 * @param {Component} props.children - Dashboard widget
 * @param {string} props.className - Additional item class name
 * @param {object} ref - Forwarded ref
 * @returns {Component} Dashboard panel item
 */
export const DashboardPanelItem = forwardRef(
  ({ size = 'full', children, className = '', ...opts }, ref) => (
    <Box
      ref={ref}
      className={`dashboard-panel-item dashboard-panel-item-${size} ${className}`}
      {...opts}
      sx={(theme) => getItemStyles({ theme, size })}
    >
      {children}
    </Box>
  )
)

DashboardPanelItem.propTypes = {
  size: PropTypes.oneOf(PANEL_ITEM_SIZES),
  children: PropTypes.node,
  className: PropTypes.string,
}

DashboardPanelItem.displayName = 'DashboardPanelItem'
