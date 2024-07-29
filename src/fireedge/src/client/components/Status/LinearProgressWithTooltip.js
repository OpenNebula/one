/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { LinearProgressWithLabel } from 'client/components/Status'
import PropTypes from 'prop-types'

import { Tooltip, Typography, Box } from '@mui/material'
import { Component } from 'react'
import { Tr } from 'client/components/HOC'

/**
 * `LinearProgressWithTooltip` component displays a linear progress bar with a label and an optional tooltip.
 *
 * @param {object} props - Component properties.
 * @param {number} props.value - Value of the progress bar (0-100).
 * @param {string} props.label - Label to display on the progress bar.
 * @param {string} props.tooltipTitle - Title for the tooltip.
 * @param {Node} props.icon - Icon to display next to the progress bar.
 * @param {number} props.high - Upper display threshold limit.
 * @param {number} props.low - Lower display threshold limit.
 * @returns {Component} Rendered component.
 */
const LinearProgressWithTooltip = ({
  value,
  label,
  tooltipTitle,
  icon,
  high,
  low,
}) => (
  <Box display="flex" alignItems="center">
    <Box flexGrow={1} lineHeight={1}>
      <LinearProgressWithLabel
        value={value}
        label={label}
        high={high}
        low={low}
      />
    </Box>
    <Tooltip
      arrow
      placement="right"
      title={<Typography variant="subtitle2">{Tr(tooltipTitle)}</Typography>}
    >
      <Box component="span" ml={2} mt={1} mr={2} lineHeight={1}>
        {icon}
      </Box>
    </Tooltip>
  </Box>
)

LinearProgressWithTooltip.propTypes = {
  value: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  tooltipTitle: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  high: PropTypes.number,
  low: PropTypes.number,
}

LinearProgressWithTooltip.defaultProps = {
  high: 66,
  low: 33,
}

LinearProgressWithTooltip.displayName = 'LinearProgressWithTooltip'

export default LinearProgressWithTooltip
