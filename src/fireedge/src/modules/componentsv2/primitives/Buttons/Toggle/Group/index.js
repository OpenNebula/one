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

import { Box, Divider } from '@mui/material'
import {
  forwardRef,
  Component,
  Fragment,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { getStyles } from '@modules/componentsv2/primitives/Buttons/Toggle/Group/styles'
import PropTypes from 'prop-types'
import { Toggle } from '@modules/componentsv2/primitives/Buttons/Toggle/Single'
import { useControllableState } from '@HooksModule'
import { MenuButton } from '@modules/componentsv2/primitives/Buttons/Menu'
import { CompactToolbarOverflow } from '@modules/componentsv2/primitives/Buttons/CompactToolbar'

/**
 * @param {object} root0 - Params
 * @param {Array} root0.options - List of options [[{...toggle}], [{...toggle}]]
 * @param {string} root0.size - Circle size
 * @param {Function} root0.onChange - On toggle selection change
 * @param {boolean} root0.isMultipleSelectable - Can select multiple options
 * @returns {Component} - Custom MUI ToggleGroup component
 */
export const ToggleGroup = forwardRef(
  (
    {
      onChange,
      size = 'medium',
      isMultipleSelectable = false,
      isSelectable = true,
      isOutlined = true,
      options = [],
      sx,
      ...opts
    },
    ref
  ) => {
    const groupRefs = useRef([])
    const [visibleGroups, setVisibleGroups] = useState(() =>
      options?.map((group) => !!group?.length)
    )
    const [selectedValues, setSelectedValues] = useControllableState({
      defaultValue: [],
      onChange,
    })

    const updateVisibleGroups = useCallback(() => {
      const nextVisibleGroups = options?.map(
        (_, index) => !!groupRefs.current[index]?.childElementCount
      )

      setVisibleGroups((current = []) =>
        current.length === nextVisibleGroups.length &&
        current.every((value, index) => value === nextVisibleGroups[index])
          ? current
          : nextVisibleGroups
      )
    }, [options])

    useLayoutEffect(() => {
      groupRefs.current = groupRefs.current.slice(0, options.length)
      updateVisibleGroups()

      const observers = groupRefs.current
        .map((node) => {
          if (!node) return undefined

          const observer = new MutationObserver(updateVisibleGroups)
          observer.observe(node, { childList: true })

          return observer
        })
        .filter(Boolean)

      return () => observers.forEach((observer) => observer.disconnect())
    }, [options, updateVisibleGroups])

    const handleToggleChange = (toggleValue, isSelected) =>
      setSelectedValues((prev) => [
        ...(isMultipleSelectable ? prev?.filter((v) => v !== toggleValue) : []),
        ...(isSelected ? [toggleValue] : []),
      ])

    const hasVisibleGroupAfter = (groupIdx) =>
      visibleGroups?.slice(groupIdx + 1)?.some(Boolean)

    return (
      <Box
        sx={[
          (theme) => getStyles({ theme, isOutlined }),
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        ref={ref}
        className={'toggle-group-container'}
        data-compact-toolbar-divider-count={Math.max(
          (options?.length ?? 0) - 1,
          0
        )}
        {...opts}
      >
        {options?.map((group, groupIdx) => (
          <Fragment key={groupIdx}>
            <Box
              className="toggle-group-section"
              ref={(node) => {
                groupRefs.current[groupIdx] = node
              }}
            >
              {group?.map((toggle, toggleIdx) => {
                if (toggle?.compactToolbarOverflow) {
                  return (
                    <CompactToolbarOverflow
                      key={toggle.value ?? toggleIdx}
                      size={size}
                      isDisabled={toggle.isDisabled}
                      useToggleTrigger
                    />
                  )
                }

                const { options: menuOptions, ...toggleProps } = toggle ?? {}

                return menuOptions ? (
                  <MenuButton
                    key={toggleProps.value ?? toggleIdx}
                    {...toggleProps}
                    size={size}
                    options={menuOptions}
                    isDisabled={toggleProps.isDisabled}
                    __useToggleTrigger
                  />
                ) : (
                  <Toggle
                    key={toggleIdx}
                    isSelectable={isSelectable}
                    {...toggleProps}
                    size={size}
                    isSelected={selectedValues?.includes(toggleProps?.value)}
                    onChange={handleToggleChange}
                  />
                )
              })}
            </Box>
            {visibleGroups?.[groupIdx] && hasVisibleGroupAfter(groupIdx) && (
              <Divider
                orientation="vertical"
                flexItem
                className="toggle-group-divider"
              />
            )}
          </Fragment>
        ))}
      </Box>
    )
  }
)

ToggleGroup.propTypes = {
  size: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)),
  isMultipleSelectable: PropTypes.bool,
  isSelectable: PropTypes.bool,
  isOutlined: PropTypes.bool,
  onChange: PropTypes.func,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.func]),
}
ToggleGroup.displayName = 'ToggleGroup'
