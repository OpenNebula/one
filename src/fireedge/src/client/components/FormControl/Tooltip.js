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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { QuestionMarkCircle } from 'iconoir-react'
import { InputAdornment, Typography, Tooltip } from '@mui/material'
import { Tr, labelCanBeTranslated } from 'client/components/HOC'

const AdornmentWithTooltip = memo(
  ({ title, position = 'end', children }) => {
    if (
      !title ||
      title === '' ||
      (Array.isArray(title) && title.length === 0)
    ) {
      return null
    }

    return (
      <Tooltip
        arrow
        placement="bottom"
        title={
          <Typography variant="subtitle2">
            {labelCanBeTranslated(title) ? Tr(title) : title}
          </Typography>
        }
      >
        <InputAdornment position={position} style={{ cursor: 'help' }}>
          {children ?? <QuestionMarkCircle />}
        </InputAdornment>
      </Tooltip>
    )
  },
  (prevProps, nextProps) =>
    Array.isArray(nextProps.title)
      ? prevProps.title?.[0] === nextProps.title?.[0] ||
        prevProps.title === nextProps.title?.[0]
      : prevProps.title === nextProps.title
)

AdornmentWithTooltip.propTypes = {
  title: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node,
    PropTypes.object,
  ]),
  children: PropTypes.any,
  position: PropTypes.oneOf(['start', 'end']),
}

AdornmentWithTooltip.displayName = 'AdornmentWithTooltip'

export default AdornmentWithTooltip
