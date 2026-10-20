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
import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { getStyles } from '@modules/components/primitives/Buttons/Card/styles'
import { Text } from '@modules/components/primitives/Text'
import { Tooltip } from '@modules/components/primitives/Tooltip/Default'
import { renderIcon } from '@UtilsModule'

/**
 * Card-shaped selectable button.
 *
 * @param {object} root0 - Params
 * @param {string|Component} root0.text - Button text
 * @param {string|Component} root0.description - Optional supporting text
 * @param {Component} root0.startIcon - Icon displayed above the text
 * @param {string} root0.startIconSize - Size of the start icon (either 'small' or 'big')
 * @param {*} root0.value - Option value
 * @param {boolean} root0.isSelected - Whether the button is selected
 * @param {boolean} root0.isDisabled - Whether the button is disabled
 * @param {Function} root0.onClick - Click handler
 * @returns {Component} Card button component
 */
export const CardButton = forwardRef(
  (
    {
      text = '',
      description,
      startIcon,
      startIconSize = 'small',
      value,
      isSelected = false,
      isDisabled = false,
      onClick,
      className,
      ...opts
    },
    ref
  ) => {
    const handleClick = (event) => {
      if (isDisabled) return

      onClick?.(event, value)
    }

    return (
      <Tooltip title={description ?? ''} placement="top">
        <span style={{ display: 'inline-flex', width: 'fit-content' }}>
          <Box
            component="button"
            type="button"
            ref={ref}
            value={value}
            disabled={isDisabled}
            aria-pressed={isSelected}
            aria-disabled={isDisabled}
            className={clsx('card-button-container', className, {
              selected: isSelected,
              disabled: isDisabled,
            })}
            data-cy={opts?.['data-cy'] ?? opts?.dataCy}
            onClick={handleClick}
            sx={(theme) => getStyles({ theme })}
            {...opts}
          >
            {startIcon && (
              <Box
                component="span"
                className={`card-button-icon ${startIconSize}`}
              >
                {renderIcon(startIcon)}
              </Box>
            )}

            {text && (
              <Text
                component="span"
                className="card-button-text"
                value={text}
              />
            )}
          </Box>
        </span>
      </Tooltip>
    )
  }
)

CardButton.propTypes = {
  text: PropTypes.node,
  description: PropTypes.node,
  startIcon: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  startIconSize: PropTypes.oneOf(['small', 'big']),
  value: PropTypes.any,
  isSelected: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
}

CardButton.displayName = 'CardButton'
