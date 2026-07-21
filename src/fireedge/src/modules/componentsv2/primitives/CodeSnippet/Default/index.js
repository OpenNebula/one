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

import { ReactNode, Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/CodeSnippet/Default/styles'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { Text } from '@modules/componentsv2/primitives/Text'
import { Copy } from 'iconoir-react'
import { useClipboard } from '@HooksModule'
import { Tooltip } from '@modules/componentsv2/primitives/Tooltip/Default'
import { T, STYLE_BUTTONS, TEXT_WEIGHTS, TEXT_VARIANTS } from '@ConstantsModule'

/**
 * @param {object} root0 - Params
 * @param {string} root0.status - CodeSnippet status
 * @param {ReactNode} root0.startIcon - Start icon
 * @param {ReactNode} root0.endIcon - End icon
 * @param {boolean} root0.isSelected - Parent controlled selection state
 * @returns {Component} - Custom MUI CodeSnippet component
 */
export const CodeSnippet = forwardRef(
  ({ title, code = '', isDisabled = false, ...opts }, ref) => {
    const { copy, isCopied } = useClipboard()

    return (
      <Box
        ref={ref}
        sx={(theme) =>
          getStyles({
            theme,
            isDisabled,
            hasTitle: Boolean(title),
            ...opts,
          })
        }
      >
        <Box className="topbar">
          {title && (
            <Box className="title-container">
              <Text
                className="code-snippet-title"
                value={title}
                variant={TEXT_VARIANTS.H6}
                weight={TEXT_WEIGHTS.REGULAR}
              />
            </Box>
          )}

          <Tooltip title={isCopied(code) ? T.Copied : T.Copy}>
            <Box className="code-snippet-copy-button">
              <Button
                isDisabled={isDisabled}
                iconOnly={<Copy width="12px" height="12px" />}
                onClick={() => copy(code)}
                type={STYLE_BUTTONS.TYPE.TRANSPARENT}
              />
            </Box>
          </Tooltip>
        </Box>

        <Box className="code-container">
          <Box component="code">{code}</Box>
        </Box>
      </Box>
    )
  }
)

CodeSnippet.propTypes = {
  code: PropTypes.string,
  title: PropTypes.string,
  isDisabled: PropTypes.bool,
}

CodeSnippet.displayName = 'CodeSnippet'
