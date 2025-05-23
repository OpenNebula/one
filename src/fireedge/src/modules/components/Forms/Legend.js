/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { Typography, styled } from '@mui/material'
import PropTypes from 'prop-types'
import { isValidElement, memo } from 'react'

import AdornmentWithTooltip from '@modules/components/FormControl/Tooltip'
import { Translate } from '@modules/components/HOC'

const StyledLegend = styled((props) => (
  <Typography variant="underline" component="legend" {...props} />
))(({ ownerState }) => ({
  ...(ownerState.tooltip && {
    display: 'inline-flex',
    alignItems: 'center',
  }),
  ...(!ownerState.disableGutters && {
    marginBottom: '1em',
  }),
}))

const Legend = memo(
  ({ 'data-cy': dataCy, title, tooltip, disableGutters, ...rest }) => (
    <StyledLegend
      data-cy={dataCy}
      ownerState={{ tooltip, disableGutters }}
      {...rest}
    >
      {isValidElement(title) ? title : <Translate word={title} />}
      {!!tooltip && <AdornmentWithTooltip title={tooltip} />}
    </StyledLegend>
  ),
  (prev, next) => prev.title === next.title && prev.tooltip === next.tooltip
)

Legend.propTypes = {
  'data-cy': PropTypes.string,
  title: PropTypes.any,
  tooltip: PropTypes.string,
  disableGutters: PropTypes.bool,
}

Legend.displayName = 'FieldsetLegend'

export default Legend
