/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { memo } from 'react'
import PropTypes from 'prop-types'
import { styled, Typography } from '@mui/material'

import AdornmentWithTooltip from 'client/components/FormControl/Tooltip'
import { Translate } from 'client/components/HOC'

const StyledLegend = styled((props) => (
  <Typography variant="subtitle1" component="legend" {...props} />
))(
  ({ theme }) => ({
    padding: '0em 1em 0.2em 0.5em',
    borderBottom: `2px solid ${theme.palette.secondary.main}`,
  }),
  ({ ownerState }) => ({
    ...(ownerState.tooltip && {
      display: 'inline-flex',
      alignItems: 'center',
    }),
    ...(!ownerState.disableGutters && {
      marginBottom: '1em',
    }),
  })
)

const Legend = memo(
  ({ title, tooltip, disableGutters }) => (
    <StyledLegend ownerState={{ tooltip, disableGutters }}>
      <Translate word={title} />
      {!!tooltip && <AdornmentWithTooltip title={tooltip} />}
    </StyledLegend>
  ),
  (prev, next) => prev.title === next.title && prev.tooltip === next.tooltip
)

Legend.propTypes = {
  title: PropTypes.any,
  tooltip: PropTypes.string,
  disableGutters: PropTypes.bool,
}

Legend.displayName = 'FieldsetLegend'

export default Legend
