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

import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import { Typography as MUITypography, Box, Stack } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Labels/Default/styles'
import { Tooltip } from '@modules/componentsv2/primitives/Tooltip'
import { HelpCircle as TooltipIcon } from 'iconoir-react'
import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'

/**
 * @param {object} root0 - Params
 * @param {boolean} root0.isRequired - Render required icon
 * @param {boolean} root0.option - Render isOptional banner
 * @param {string} root0.tooltip - Render tooltip icon + text
 * @returns {Component} - Custom MUI Label component
 */
export const Label = forwardRef(
  (
    { children, isRequired = false, isOptional = false, tooltip = '', ...opts },
    ref
  ) => {
    const { translate, translateText } = useTranslation()
    const content = opts?.title || children || 'Label'
    const translatedContent =
      typeof content === 'string' ? translateText(content) : content

    return (
      <Stack
        direction="row"
        sx={(theme) =>
          getStyles({ theme, isRequired, isOptional, tooltip, ...opts })
        }
      >
        {isRequired && <Box className="isRequired-icon">*</Box>}
        <MUITypography className="label" ref={ref} {...opts}>
          {translatedContent}
        </MUITypography>

        {tooltip && (
          <Tooltip title={tooltip}>
            <TooltipIcon className="tooltip-icon" />
          </Tooltip>
        )}

        {isOptional && (
          <MUITypography className="isOptional-banner">
            {`(${translate(T.Optional)})`}
          </MUITypography>
        )}
      </Stack>
    )
  }
)

Label.propTypes = {
  children: PropTypes.node,
  isRequired: PropTypes.bool,
  isOptional: PropTypes.bool,
  tooltip: PropTypes.string,
}

Label.displayName = 'Label'
