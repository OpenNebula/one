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

import { ReactNode, Component, forwardRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Button as MUIButton, Typography } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Buttons/Default/styles'
import { Tooltip } from '@modules/componentsv2/primitives/Tooltip/Default'
import { renderIcon } from '@UtilsModule'
import {
  useCompactToolbarAction,
  useCompactToolbarId,
} from '@modules/componentsv2/primitives/Buttons/CompactToolbar/context'
import { useTranslation } from '@ProvidersModule'

/**
 * @param {object} root0 - Params
 * @param {string} root0.children - Children
 * @param {string} root0.type - Button type
 * @param {string} root0.htmlType - The default button behavior, can be submit, reset or button.
 * @param {boolean} root0.isDisabled - Disable button
 * @param {boolean} root0.isDestructive - Set button style to destructive
 * @param {ReactNode} root0.startIcon - Start icon
 * @param {ReactNode} root0.endIcon - End icon
 * @param {ReactNode} root0.iconOnly - Only icon to render
 * @param {string} root0.title - Button label
 * @param {ReactNode} root0.tooltip - Tooltip text content
 * @param {object} root0.tooltipLink - Tooltip link
 * @param {object} root0.tooltipprops - Tooltip props
 * @param {string} root0.size - Size of button
 * @returns {Component} - Custom MUI Button component
 */
export const Button = forwardRef(
  (
    {
      children,
      type = 'primary',
      htmlType,
      size = 'small',
      startIcon = null,
      endIcon = null,
      iconOnly = null,
      isDisabled = false,
      isDestructive = false,
      compactable = false,
      ...opts
    },
    ref
  ) => {
    const { translateText } = useTranslation()
    const {
      sx,
      tooltip,
      tooltipLink,
      tooltipprops,
      dataCy,
      eACTION: _eACTION,
      ...buttonProps
    } = opts
    const { onClick, title } = buttonProps
    const compactId = useCompactToolbarId('compact-button')

    const rawContent =
      renderIcon(iconOnly) || buttonProps?.title || children || 'Button'
    const content =
      typeof rawContent === 'string' ? translateText(rawContent) : rawContent
    const compactOption = useMemo(
      () => ({
        title,
        tooltip,
        startIcon: iconOnly ?? startIcon,
        isDisabled,
        isDestructive,
        onClick,
      }),
      [iconOnly, isDestructive, isDisabled, onClick, startIcon, title, tooltip]
    )
    const isCompacted = useCompactToolbarAction(
      compactId,
      compactOption,
      compactable
    )

    if (isCompacted) return null

    const hasTooltip =
      typeof tooltip === 'string' ? tooltip.trim().length > 0 : !!tooltip
    const tooltipTitle =
      hasTooltip &&
      (tooltipLink ? (
        <Typography variant="subtitle2">
          {typeof tooltip === 'string' ? translateText(tooltip) : tooltip}
          <a target="_blank" href={tooltipLink.link} rel="noreferrer">
            {tooltipLink.text}
          </a>
        </Typography>
      ) : (
        <Typography variant="subtitle2">
          {typeof tooltip === 'string' ? translateText(tooltip) : tooltip}
        </Typography>
      ))

    const button = (
      <MUIButton
        {...buttonProps}
        data-cy={buttonProps?.['data-cy'] ?? dataCy}
        type={htmlType}
        ref={ref}
        size={size}
        disabled={isDisabled}
        disableRipple
        startIcon={iconOnly ? null : renderIcon(startIcon)}
        endIcon={iconOnly ? null : renderIcon(endIcon)}
        sx={[
          (theme) =>
            getStyles({
              theme,
              type,
              iconOnly: !!iconOnly,
              size,
              isDestructive,
              ...buttonProps,
            }),
          ...(Array.isArray(sx) ? sx : [sx]),
        ].filter(Boolean)}
      >
        {content}
      </MUIButton>
    )

    return hasTooltip ? (
      <Tooltip title={tooltipTitle} {...tooltipprops}>
        <span style={{ display: 'inline-flex', width: 'fit-content' }}>
          {button}
        </span>
      </Tooltip>
    ) : (
      button
    )
  }
)

Button.propTypes = {
  children: PropTypes.node,
  type: PropTypes.string,
  htmlType: PropTypes.string,
  size: PropTypes.string,
  isDisabled: PropTypes.bool,
  isDestructive: PropTypes.bool,
  compactable: PropTypes.bool,
  iconOnly: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  endIcon: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  startIcon: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  title: PropTypes.string,
  tooltip: PropTypes.node,
  tooltipLink: PropTypes.object,
  tooltipprops: PropTypes.object,
  dataCy: PropTypes.string,
}

Button.displayName = 'Button'
