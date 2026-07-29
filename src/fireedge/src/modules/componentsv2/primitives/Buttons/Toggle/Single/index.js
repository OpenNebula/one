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
import { forwardRef, Component, useMemo } from 'react'
import { getStyles } from '@modules/componentsv2/primitives/Buttons/Toggle/Single/styles'
import { Tooltip } from '@modules/componentsv2/primitives/Tooltip/Default'
import PropTypes from 'prop-types'
import { useControllableState } from '@HooksModule'
import { renderIcon } from '@UtilsModule'
import {
  useCompactToolbarAction,
  useCompactToolbarId,
} from '@modules/componentsv2/primitives/Buttons/CompactToolbar/context'
import { useTranslation } from '@ProvidersModule'

const TOGGLE_SIZES = Object.freeze({
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
})

/**
 * @param {object} root0 - Params
 * @param {Array} root0.options - List of options [{text,value, disabled, checked}]
 * @param {Function} root0.onClick - OnClick handler when value is selected
 * @param {string} root0.size - Circle size
 * @param {string} root0.direction - Direction of toggle buttons
 * @returns {Component} - Custom MUI Toggle component
 */
export const Toggle = forwardRef(
  (
    {
      text = '',
      value,
      title,
      tooltip,
      startIcon,
      onClick = () => {},
      onChange,
      size = TOGGLE_SIZES.MEDIUM,
      isOutlined = false,
      isDisabled = false,
      isSelectable = true,
      isSelected,
      sx,
      compactable = false,
      ...opts
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const compactId = useCompactToolbarId('compact-toggle')
    const { 'aria-label': ariaLabel, ...boxProps } = opts
    const tooltipTitle = tooltip ?? title
    const accessibleLabel = translate(
      ariaLabel ??
        (text || (typeof tooltipTitle === 'string' ? tooltipTitle : undefined))
    )

    const [effectiveSelected, setEffectiveSelected] = useControllableState({
      value: isSelected,
      defaultValue: isSelected ?? false,
      onChange: (next) => onChange?.(value, next),
    })

    const handleOnClick = (event) => {
      if (isDisabled) return
      onClick?.(event)
      if (!isSelectable) return
      setEffectiveSelected((prev) => !prev)
    }

    const handleKeyDown = (event) => {
      if (isDisabled) return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleOnClick(event)
      }
    }
    const compactOption = useMemo(
      () => ({
        title: text || (typeof tooltipTitle === 'string' ? tooltipTitle : ''),
        tooltip: tooltipTitle,
        startIcon,
        isDisabled,
        isSelected: effectiveSelected,
        onClick,
      }),
      [effectiveSelected, isDisabled, onClick, startIcon, text, tooltipTitle]
    )
    const isCompacted = useCompactToolbarAction(
      compactId,
      compactOption,
      compactable
    )

    if (isCompacted) return null

    return (
      <Tooltip title={tooltipTitle}>
        <Box
          sx={[
            (theme) =>
              getStyles({
                theme,
                size,
                isOutlined,
                isDisabled,
                isSelected: effectiveSelected,
              }),
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
          ref={ref}
          onClick={handleOnClick}
          onKeyDown={handleKeyDown}
          className={'toggle-button-container'}
          role="button"
          aria-pressed={effectiveSelected}
          aria-disabled={isDisabled}
          aria-label={accessibleLabel}
          tabIndex={isDisabled ? -1 : 0}
          {...boxProps}
        >
          {startIcon &&
            renderIcon(startIcon, {
              className: 'toggle-button-icon',
              key: 'toggle-start-icon',
            })}
          {text && <Box className="toggle-button-text">{translate(text)}</Box>}
        </Box>
      </Tooltip>
    )
  }
)

Toggle.propTypes = {
  text: PropTypes.string,
  value: PropTypes.any,
  title: PropTypes.node,
  tooltip: PropTypes.string,
  startIcon: PropTypes.node,
  size: PropTypes.oneOf(Object.values(TOGGLE_SIZES)),
  isDisabled: PropTypes.bool,
  isOutlined: PropTypes.bool,
  isSelectable: PropTypes.bool,
  isSelected: PropTypes.bool,
  compactable: PropTypes.bool,
  onClick: PropTypes.func,
  onChange: PropTypes.func,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.func]),
}
Toggle.displayName = 'Toggle'
