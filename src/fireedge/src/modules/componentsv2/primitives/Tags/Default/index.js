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

import {
  ReactNode,
  Component,
  forwardRef,
  isValidElement,
  createElement,
} from 'react'
import PropTypes from 'prop-types'
import { Button as MUIButton } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Tags/Default/styles'
import { useControllableState } from '@HooksModule'

/**
 * @param {object} root0 - Params
 * @param {string} root0.status - Tag status
 * @param {ReactNode} root0.startIcon - Start icon
 * @param {ReactNode} root0.endIcon - End icon
 * @param {boolean} root0.isSelected - Parent controlled selection state
 * @param {string} root0.titleClassName - Optional wrapped title class name
 * @param {object} root0.customColor - Optional custom tag colors
 * @param {string} root0.dataCy - Cypress selector
 * @returns {Component} - Custom MUI Tag component
 */
export const Tag = forwardRef(
  (
    {
      children,
      status = 'default',
      startIcon = null,
      endIcon = null,
      isInteractive = false,
      isSelected,
      title = '',
      titleClassName,
      customColor,
      dataCy,
      onChange,
      onClick,
      ...opts
    },
    ref
  ) => {
    const [selected, setSelected] = useControllableState({
      value: isSelected,
      defaultValue: false,
      onChange,
    })

    const renderIcon = (icon) =>
      !icon ? null : isValidElement(icon) ? icon : createElement(icon)

    const handleClick = (event) => {
      if (isInteractive) {
        event.preventDefault()
        setSelected((prev) => !prev)
      }

      onClick?.(event)
    }

    const label = children ?? title
    const content = (
      <span className={`tag-title ${titleClassName ?? ''}`.trim()}>
        {label}
      </span>
    )

    return (
      <MUIButton
        ref={ref}
        disableRipple
        onClick={handleClick}
        startIcon={renderIcon(startIcon)}
        endIcon={renderIcon(endIcon)}
        data-cy={dataCy}
        sx={(theme) =>
          getStyles({
            theme,
            status,
            isInteractive,
            isClickable: Boolean(onClick),
            isSelected: selected,
            customColor,
            ...opts,
          })
        }
        {...opts}
      >
        {content}
      </MUIButton>
    )
  }
)

Tag.propTypes = {
  children: PropTypes.node,
  status: PropTypes.string,
  title: PropTypes.string,
  titleClassName: PropTypes.string,
  customColor: PropTypes.shape({
    background: PropTypes.string,
    border: PropTypes.string,
    text: PropTypes.string,
  }),
  isInteractive: PropTypes.bool,
  endIcon: PropTypes.node,
  startIcon: PropTypes.node,
  isSelected: PropTypes.bool,
  dataCy: PropTypes.string,
  onChange: PropTypes.func,
  onClick: PropTypes.func,
}

Tag.displayName = 'Tag'
