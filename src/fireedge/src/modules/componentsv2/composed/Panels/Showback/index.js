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

import { T } from '@ConstantsModule'
import { SubmitButton } from '@modules/componentsv2/primitives/Buttons/Submit'
import { getStyles } from '@modules/componentsv2/composed/Panels/Showback/styles'

/**
 * Displays showback controls and charts using the Components V2 design system.
 *
 * @param {object} props - Component props
 * @param {object} props.dateRangeFilter - Date range filter node
 * @param {object} props.summaryTable - Summary table chart node
 * @param {object} props.summaryChart - Summary bar chart node
 * @param {object} props.detailsTable - Details table chart node
 * @param {Function} props.onGetShowback - Get showback handler
 * @param {boolean} props.isLoading - Loading state
 * @param {object} ref - Forwarded ref
 * @returns {Component} Showback tab
 */
export const ShowbackTab = forwardRef(
  (
    {
      dateRangeFilter,
      summaryTable,
      summaryChart,
      detailsTable,
      onGetShowback,
      isLoading = false,
    },
    ref
  ) => (
    <Box sx={(theme) => getStyles({ theme })} ref={ref}>
      <Box className="showback-toolbar">
        {dateRangeFilter}
        <SubmitButton
          type="primary"
          onClick={onGetShowback}
          isDisabled={isLoading}
          label={T['showback.button.getShowback']}
        />
      </Box>

      <Box className="showback-summary">
        <Box className="showback-chart showback-chart-compact">
          {summaryTable}
        </Box>
        <Box className="showback-chart showback-chart-compact">
          {summaryChart}
        </Box>
      </Box>

      <Box className="showback-chart showback-chart-detail">{detailsTable}</Box>
    </Box>
  )
)

ShowbackTab.propTypes = {
  dateRangeFilter: PropTypes.node,
  summaryTable: PropTypes.node,
  summaryChart: PropTypes.node,
  detailsTable: PropTypes.node,
  onGetShowback: PropTypes.func,
  isLoading: PropTypes.bool,
}

ShowbackTab.displayName = 'ShowbackTab'
