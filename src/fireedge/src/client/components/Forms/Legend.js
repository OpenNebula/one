/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { Tr, labelCanBeTranslated } from 'client/components/HOC'

const StyledLegend = styled((props) => (
  <Typography variant="subtitle1" component="legend" {...props} />
))(({ theme, tooltip }) => ({
  marginBottom: '1em',
  padding: '0em 1em 0.2em 0.5em',
  borderBottom: `2px solid ${theme.palette.secondary.main}`,
  ...(!!tooltip && {
    display: 'inline-flex',
    alignItems: 'center',
  }),
}))

const Legend = memo(
  ({ title, tooltip }) => {
    return (
      <StyledLegend tooltip={tooltip}>
        {labelCanBeTranslated(title) ? Tr(title) : title}
        {!!tooltip && <AdornmentWithTooltip title={tooltip} />}
      </StyledLegend>
    )
  },
  (prev, next) => prev.title === next.title && prev.tooltip === next.tooltip
)

Legend.propTypes = {
  title: PropTypes.string,
  tooltip: PropTypes.string,
}

Legend.displayName = 'FieldsetLegend'

export default Legend
