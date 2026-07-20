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

import clsx from 'clsx'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
  Component,
  forwardRef,
} from 'react'
import PropTypes from 'prop-types'
import { renderIcon } from '@UtilsModule'
import { Box, Menu as MUIMenu, Divider } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Buttons/Menu/styles'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { Toggle } from '@modules/componentsv2/primitives/Buttons/Toggle/Single'
import { NavArrowDown, NavArrowLeft } from 'iconoir-react'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import {
  useCompactToolbarAction,
  useCompactToolbarId,
} from '@modules/componentsv2/primitives/Buttons/CompactToolbar/context'
import { useTranslation } from '@ProvidersModule'

const normalizeOptionGroups = (options = []) =>
  [].concat(options).map((group) => [].concat(group).filter(Boolean))

const isEveryOptionDisabled = (options = []) =>
  normalizeOptionGroups(options)
    .flat()
    .every((option) => option?.isDisabled)

const NESTED_HOVER_DELAY = 150

const getMousePoint = ({ clientX, clientY } = {}) => ({
  x: clientX,
  y: clientY,
})

const isPointInsideNode = (node, point) => {
  if (!node || point?.x === undefined || point?.y === undefined) return false

  const rect = node.getBoundingClientRect()

  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  )
}

const MenuButtonOption = ({
  option = {},
  isDisabled = false,
  onClose,
  nestedTrigger = 'click',
}) => {
  const { translateText } = useTranslation()
  const optionRef = useRef(null)
  const nestedPaperRef = useRef(null)
  const isNestedPaperHoveredRef = useRef(false)
  const openTimerRef = useRef(null)
  const closeTimerRef = useRef(null)
  const mousePointRef = useRef(null)
  const [nestedAnchorEl, setNestedAnchorEl] = useState(null)
  const {
    title,
    onClick,
    eACTION: _eACTION,
    dataCy,
    tooltip: _tooltip,
    startIcon,
    isDestructive,
    isDisabled: optionDisabled,
    isSelected,
    options: nestedOptions,
    onMouseEnter,
    onMouseLeave,
    renderContent,
    sx: optionSx,
    ...rest
  } = option
  const hasNestedOptions = !!nestedOptions
  const normalizedNestedOptions = normalizeOptionGroups(nestedOptions)
  const isOptionDisabled =
    isDisabled ||
    optionDisabled ||
    (hasNestedOptions && isEveryOptionDisabled(nestedOptions))
  const openNestedOnHover = nestedTrigger === 'hover'
  const open = Boolean(nestedAnchorEl)
  const isOptionHovered = () => optionRef.current?.matches(':hover') ?? false
  const isMouseInsideNestedArea = (point = mousePointRef.current) =>
    isNestedPaperHoveredRef.current ||
    isOptionHovered() ||
    isPointInsideNode(optionRef.current, point) ||
    isPointInsideNode(nestedPaperRef.current, point)
  const clearOpenTimer = () => {
    clearTimeout(openTimerRef.current)
    openTimerRef.current = null
  }
  const clearCloseTimer = () => {
    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }
  const handleCloseNested = () => {
    clearOpenTimer()
    clearCloseTimer()
    isNestedPaperHoveredRef.current = false
    setNestedAnchorEl(null)
  }
  const scheduleOpenNested = (anchorEl, event) => {
    if (event) {
      mousePointRef.current = getMousePoint(event)
    }

    clearCloseTimer()

    if (openTimerRef.current || open) return

    openTimerRef.current = setTimeout(() => {
      if (
        isOptionHovered() ||
        isPointInsideNode(optionRef.current, mousePointRef.current)
      ) {
        setNestedAnchorEl(anchorEl)
      }

      openTimerRef.current = null
    }, NESTED_HOVER_DELAY)
  }
  const scheduleCloseNested = (event) => {
    if (event) {
      mousePointRef.current = getMousePoint(event)
    }

    clearOpenTimer()

    if (isMouseInsideNestedArea()) {
      clearCloseTimer()

      return
    }

    if (closeTimerRef.current) return

    closeTimerRef.current = setTimeout(() => {
      if (!isMouseInsideNestedArea()) {
        setNestedAnchorEl(null)
      }

      closeTimerRef.current = null
    }, NESTED_HOVER_DELAY)
  }
  const handleCloseAll = () => {
    handleCloseNested()
    onClose?.()
  }
  const handleNestedPaperMouseEnter = () => {
    isNestedPaperHoveredRef.current = true
    clearCloseTimer()
  }
  const handleNestedPaperMouseLeave = (event) => {
    isNestedPaperHoveredRef.current = false

    if (openNestedOnHover) {
      scheduleCloseNested(event)
    }
  }

  useEffect(
    () => () => {
      clearTimeout(openTimerRef.current)
      clearTimeout(closeTimerRef.current)
    },
    []
  )

  useEffect(() => {
    if (!openNestedOnHover || !open) return undefined

    const handleMouseMove = (event) => {
      mousePointRef.current = getMousePoint(event)

      if (isMouseInsideNestedArea()) {
        clearCloseTimer()

        return
      }

      scheduleCloseNested()
    }

    document.addEventListener('mousemove', handleMouseMove)

    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [open, openNestedOnHover])

  useEffect(() => {
    if (!openNestedOnHover || !hasNestedOptions || isOptionDisabled || open) {
      return undefined
    }

    const animationFrame = requestAnimationFrame(() => {
      if (isOptionHovered()) {
        scheduleOpenNested(optionRef.current)
      }
    })

    return () => cancelAnimationFrame(animationFrame)
  }, [hasNestedOptions, isOptionDisabled, open, openNestedOnHover])

  if (renderContent) {
    return typeof renderContent === 'function'
      ? renderContent({ onClose: handleCloseAll })
      : renderContent
  }

  return (
    <>
      <Box
        ref={optionRef}
        className={clsx('menu-button-option', {
          disabled: isOptionDisabled,
          destructive: isDestructive,
          selected: isSelected,
        })}
        onClick={(event) => {
          if (isOptionDisabled) return

          clearOpenTimer()

          if (hasNestedOptions) {
            setNestedAnchorEl(event.currentTarget)

            return
          }

          onClick?.(event)
          onClose?.()
        }}
        onMouseEnter={(event) => {
          onMouseEnter?.(event)
          mousePointRef.current = getMousePoint(event)
          clearCloseTimer()

          if (openNestedOnHover && hasNestedOptions && !isOptionDisabled) {
            scheduleOpenNested(event.currentTarget, event)
          }
        }}
        onMouseLeave={(event) => {
          onMouseLeave?.(event)

          if (openNestedOnHover && hasNestedOptions) {
            scheduleCloseNested(event)
          }
        }}
        data-cy={dataCy}
        sx={hasNestedOptions ? undefined : optionSx}
        {...rest}
      >
        {hasNestedOptions && <NavArrowLeft className="option-starticon" />}
        {startIcon && renderIcon(startIcon, { className: 'option-starticon' })}
        <Box className="menu-button-option-label">
          {typeof title === 'string' ? translateText(title) : title}
        </Box>
      </Box>
      {hasNestedOptions && (
        <MUIMenu
          keepMounted={false}
          MenuListProps={{ disablePadding: true }}
          sx={[
            (theme) =>
              getStyles({
                theme,
              }),
            ...(Array.isArray(optionSx) ? optionSx : [optionSx]),
          ]}
          anchorEl={nestedAnchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            ref: nestedPaperRef,
            onMouseEnter: handleNestedPaperMouseEnter,
            onMouseLeave: handleNestedPaperMouseLeave,
          }}
          open={open}
          onClose={handleCloseNested}
        >
          {normalizedNestedOptions.flatMap((group, nestedIdx) => {
            const items = group.map((nestedOption, optionIdx) => (
              <MenuButtonOption
                key={`${nestedIdx}-${optionIdx}`}
                option={nestedOption}
                isDisabled={isDisabled}
                onClose={handleCloseAll}
                nestedTrigger={nestedTrigger}
              />
            ))

            if (nestedIdx < normalizedNestedOptions.length - 1) {
              items.push(
                <Divider
                  key={`nested-divider-${nestedIdx}`}
                  orientation="horizontal"
                  flexItem
                  className="menu-group-divider"
                />
              )
            }

            return items
          })}
        </MUIMenu>
      )}
    </>
  )
}

MenuButtonOption.propTypes = {
  option: PropTypes.object,
  isDisabled: PropTypes.bool,
  onClose: PropTypes.func,
  nestedTrigger: PropTypes.oneOf(['click', 'hover']),
}

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
 * @param {string} root0.size - Size of button
 * @returns {Component} - Custom MUI Button component
 */
export const MenuButton = forwardRef(
  (
    {
      __useToggleTrigger = false,
      startIcon,
      endIcon = NavArrowDown,
      iconOnly,
      type,
      isDisabled = false,
      options = [],
      placeholder = T.Options,
      size = 'small',
      sx,
      dataCy,
      compactable = false,
      nestedTrigger = 'click',
      ...opts
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const compactId = useCompactToolbarId('compact-menu-button')
    const { tooltip, isDestructive } = opts
    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)
    const translatedPlaceholder = translate(placeholder)
    const compactOption = useMemo(
      () => ({
        title: placeholder,
        tooltip: tooltip ?? placeholder,
        startIcon: iconOnly ?? startIcon,
        isDisabled,
        isDestructive,
        options,
        sx,
      }),
      [
        iconOnly,
        isDestructive,
        isDisabled,
        options,
        placeholder,
        startIcon,
        sx,
        tooltip,
      ]
    )
    const isCompacted = useCompactToolbarAction(
      compactId,
      compactOption,
      compactable
    )

    const handleSetAnchor = (e) => setAnchorEl(e.currentTarget)
    const handleClose = () => setAnchorEl(null)

    const normalizedOptions = normalizeOptionGroups(options)
    const isAllOptionsDisabled = isEveryOptionDisabled(options)

    const Trigger = __useToggleTrigger ? Toggle : Button

    if (isCompacted) return null

    return (
      <Box className="menu-button-container" ref={ref}>
        <Trigger
          onClick={handleSetAnchor}
          isDisabled={isDisabled || isAllOptionsDisabled}
          size={size}
          {...(__useToggleTrigger
            ? {
                startIcon: iconOnly,
                tooltip: translatedPlaceholder,
                isSelectable: false,
                isSelected: open,
              }
            : {
                type:
                  type ??
                  (iconOnly
                    ? STYLE_BUTTONS.TYPE.TRANSPARENT
                    : STYLE_BUTTONS.TYPE.SECONDARY),
                endIcon,
                startIcon,
                title: translatedPlaceholder,
                iconOnly,
                dataCy,
              })}
        />
        <MUIMenu
          keepMounted={false}
          MenuListProps={{ disablePadding: true }}
          sx={[
            (theme) =>
              getStyles({
                theme,
              }),
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            style: {
              transform: 'translateY(4px)',
            },
          }}
          open={open}
          onClose={handleClose}
        >
          {normalizedOptions?.flatMap((group, groupIdx) => {
            const items = group.map((option, idx) => (
              <MenuButtonOption
                key={`${groupIdx}-${idx}`}
                option={option}
                isDisabled={isDisabled}
                onClose={handleClose}
                nestedTrigger={nestedTrigger}
              />
            ))

            if (groupIdx < normalizedOptions.length - 1) {
              items.push(
                <Divider
                  key={`divider-${groupIdx}`}
                  orientation="horizontal"
                  flexItem
                  className="menu-group-divider"
                />
              )
            }

            return items
          })}
        </MUIMenu>
      </Box>
    )
  }
)

MenuButton.propTypes = {
  options: PropTypes.array,
  size: PropTypes.string,
  isDisabled: PropTypes.bool,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  iconOnly: PropTypes.node,
  dataCy: PropTypes.string,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.func]),
  compactable: PropTypes.bool,
  nestedTrigger: PropTypes.oneOf(['click', 'hover']),

  __useToggleTrigger: PropTypes.bool, // PRIVATE
}

MenuButton.displayName = 'MenuButton'
