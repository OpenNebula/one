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
import { Component, forwardRef } from 'react'
import { Box } from '@mui/material'
import { getStyles } from '@modules/componentsv2/composed/Panels/Quota/styles'

/**
 * Displays quota controls and chart using the Components V2 design system.
 *
 * @param {object} props - Component props
 * @param {object} props.controls - Quota controls node
 * @param {object} props.chart - Quota chart node
 * @param {object} ref - Forwarded ref
 * @returns {Component} Quota tab
 */
export const QuotaTab = forwardRef(({ controls, chart }, ref) => (
  <Box sx={(theme) => getStyles({ theme })} ref={ref}>
    <Box className="quota-controls-panel">
      <Box className="quota-controls-content">{controls}</Box>
    </Box>

    <Box className="quota-chart-panel">{chart}</Box>
  </Box>
))

QuotaTab.propTypes = {
  controls: PropTypes.node,
  chart: PropTypes.node,
}

QuotaTab.displayName = 'QuotaTab'
