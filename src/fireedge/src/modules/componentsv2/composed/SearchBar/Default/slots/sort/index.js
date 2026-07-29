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

import { forwardRef, Component, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { getStyles } from '@modules/componentsv2/composed/SearchBar/Default/slots/sort/styles'
import { MenuButton } from '@modules/componentsv2/primitives/Buttons/Menu'
import { Sort as SortIcon, SortDown, SortUp } from 'iconoir-react'

/**
 * SortSlot component.
 *
 * @param {object} root0 - Params
 * @param {string} root0.label - Label text
 * @param {string} root0.hint - Hint text
 * @param {object} root0.children - Child elements
 * @param {string} root0.initialValue - Initial value
 * @returns {Component} - Sort menu button
 */
export const SortSlot = forwardRef(
  (
    {
      placeholder = 'Sort',
      sortIcon = SortIcon,
      options = [],
      initialValue,
      sortDesc = false,
      onChange,
    },
    ref
  ) => {
    const selectedValue =
      typeof initialValue === 'object'
        ? initialValue?.value ?? initialValue?.text
        : initialValue
    const selectedLabel =
      typeof initialValue === 'object' ? initialValue?.text : initialValue
    const sortOptions = useMemo(
      () =>
        options.map((option) => {
          const optionValue =
            typeof option === 'object' ? option?.value ?? option?.text : option
          const isSelected =
            selectedValue != null &&
            String(optionValue) === String(selectedValue)

          const DirectionIcon = sortDesc ? SortDown : SortUp
          const optionTitle = typeof option === 'object' ? option?.text : option

          return {
            title: optionTitle,
            dataCy: option?.dataCy,
            isDisabled: option?.isDisabled,
            isSelected,
            startIcon: isSelected ? (
              <DirectionIcon width="16px" height="16px" strokeWidth={1.6} />
            ) : undefined,
            onClick: () => onChange?.(option),
          }
        }),
      [onChange, options, selectedValue, sortDesc]
    )

    return (
      <Box
        sx={(theme) =>
          getStyles({
            theme,
          })
        }
        ref={ref}
      >
        <MenuButton
          dataCy="sort-by-button"
          startIcon={sortIcon}
          placeholder={selectedLabel ?? placeholder}
          options={[sortOptions]}
          size="medium"
          type="secondary"
          disableCloseOnSelect
        />
      </Box>
    )
  }
)

SortSlot.propTypes = {
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  sortIcon: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  options: PropTypes.array,
  initialValue: PropTypes.any,
  sortDesc: PropTypes.bool,
}

SortSlot.displayName = 'SortSlot'
