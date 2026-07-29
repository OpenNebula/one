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
import { isValidElement, forwardRef } from 'react'
import { Tooltip } from '@modules/componentsv2/primitives/Tooltip/Default'
import { HelpCircle } from 'iconoir-react'
import { getStyles } from '@modules/componentsv2/composed/Forms/FormStepper/Legend/styles'
import { Text } from '@modules/componentsv2/primitives/Text'
import { TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'

export const Legend = forwardRef(
  ({ 'data-cy': dataCy, title, tooltip, ...rest }, ref) => (
    <Box data-cy={dataCy} sx={(theme) => getStyles({ theme })} {...rest}>
      {isValidElement(title) ? (
        title
      ) : (
        <Text
          value={title}
          variant={TEXT_VARIANTS.H6}
          weight={TEXT_WEIGHTS.BOLD}
        />
      )}
      {!!tooltip && (
        <Tooltip title={tooltip}>
          <HelpCircle className="form-legend-tooltip-icon" />
        </Tooltip>
      )}
    </Box>
  )
)

Legend.propTypes = {
  'data-cy': PropTypes.string,
  title: PropTypes.any,
  tooltip: PropTypes.string,
  disableGutters: PropTypes.bool,
}

Legend.displayName = 'FieldsetLegend'
