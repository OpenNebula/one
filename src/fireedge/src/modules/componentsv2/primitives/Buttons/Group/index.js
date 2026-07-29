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

import { Component, forwardRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, ButtonGroup as MUIButtonGroup } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Buttons/Group/styles'
import { renderIcon } from '@UtilsModule'
import { useControllableState } from '@HooksModule'
import clsx from 'clsx'
import { Tooltip } from '@modules/componentsv2/primitives/Tooltip/Default'
import {
  useCompactToolbarAction,
  useCompactToolbarId,
} from '@modules/componentsv2/primitives/Buttons/CompactToolbar/context'
import { useTranslation } from '@ProvidersModule'

const normalizeSelected = (value) => {
  if (value == null) return undefined
  if (value instanceof Set) return new Set(value)

  return new Set([].concat(value))
}

const ButtonGroupItem = ({ button = {}, isSelected = false, onToggle }) => {
  const { translate } = useTranslation()
  const {
    _id,
    value,
    title = '',
    htmlType = 'button',
    isDisabled = false,
    startIcon,
    endIcon,
    isDestructive,
    dataCy,
    tooltip,
    onClick,
    compactable,
  } = button
  const compactOption = useMemo(
    () => ({
      title,
      tooltip,
      startIcon,
      isDisabled,
      isDestructive,
      isSelected,
      onClick,
    }),
    [isDestructive, isDisabled, isSelected, onClick, startIcon, title, tooltip]
  )
  const isCompacted = useCompactToolbarAction(_id, compactOption, compactable)

  if (isCompacted) return null

  return (
    <Tooltip title={tooltip}>
      <Box
        className={clsx('button-container', {
          selected: isSelected,
          disabled: isDisabled,
          destructive: isDestructive,
        })}
        data-cy={dataCy}
        aria-disabled={isDisabled}
        onClick={(event) => {
          if (isDisabled) return

          onClick?.(event)
          onToggle?.(value)
        }}
      >
        {startIcon && (
          <span className="buttongroup-button-icon">
            {renderIcon(startIcon)}
          </span>
        )}

        {title && (
          <Button type={htmlType} className={'buttongroup-button'}>
            {translate(title)}
          </Button>
        )}

        {endIcon && (
          <span className="buttongroup-button-icon">{renderIcon(endIcon)}</span>
        )}
      </Box>
    </Tooltip>
  )
}

ButtonGroupItem.propTypes = {
  button: PropTypes.object,
  isSelected: PropTypes.bool,
  onToggle: PropTypes.func,
}

/**
 * @param {object} root0 - Params
 * @param {any} root0.children - Children
 * @returns {Component} ButtonGroup
 */
export const ButtonGroup = forwardRef(
  (
    {
      buttons = [],
      children,
      selected: selectedProp,
      isMultipleSelectable,
      onSelectionChange,
    },
    ref
  ) => {
    const hasChildren = children != null
    const groupId = useCompactToolbarId('compact-button-group')

    const items = useMemo(
      () =>
        hasChildren
          ? []
          : buttons.map((button, index) => ({
              ...button,
              _id: `${groupId}-${button.value ?? index}`,
              value: button.value ?? index,
            })),
      [buttons, groupId, hasChildren]
    )

    const selectedValue = useMemo(
      () => normalizeSelected(selectedProp),
      [selectedProp]
    )

    const selectedFromButtons = useMemo(
      () => new Set(items.filter((b) => b?.selected).map((b) => b.value)),
      [items]
    )

    const hasButtonSelection =
      selectedProp == null && items.some((button) => button?.selected != null)

    const [selectedState, setSelectedState] = useControllableState({
      value: selectedValue,
      defaultValue: new Set(),
      onChange: onSelectionChange,
    })

    const selected = hasButtonSelection ? selectedFromButtons : selectedState

    const toggle = (id) => {
      if (selectedProp == null && !onSelectionChange) return
      if (hasButtonSelection) return

      setSelectedState((prev = new Set()) => {
        if (!isMultipleSelectable) return new Set([id])

        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)

        return next
      })
    }

    return (
      <MUIButtonGroup
        className="buttongroup-container"
        sx={(theme) => getStyles({ theme })}
        ref={ref}
      >
        {hasChildren
          ? children
          : items?.map((button) => (
              <ButtonGroupItem
                key={button._id}
                button={button}
                isSelected={selected?.has(button.value)}
                onToggle={toggle}
              />
            ))}
      </MUIButtonGroup>
    )
  }
)

ButtonGroup.propTypes = {
  buttons: PropTypes.array,
  children: PropTypes.node,
  isMultipleSelectable: PropTypes.bool,
  selected: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.instanceOf(Set),
    PropTypes.number,
    PropTypes.string,
  ]),
  onSelectionChange: PropTypes.func,
}

ButtonGroup.displayName = 'ButtonGroup'
