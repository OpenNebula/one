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

import { forwardRef, Component, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { getStyles } from '@modules/componentsv2/composed/SearchBar/Default/slots/search/styles'
import { TextField } from '@modules/componentsv2/primitives/TextField'
import { Search as SearchIcon } from 'iconoir-react'

/**
 * SearchSlot component.
 *
 * @param {object} root0 - Params
 * @param {string} root0.label - Label text
 * @param {string} root0.hint - Hint text
 * @param {object} root0.children - Child elements
 * @param {string} root0.initialValue - Initial value
 * @returns {Component} - TextField component
 */
export const SearchSlot = forwardRef(
  (
    {
      placeholder = 'Search',
      searchIcon = SearchIcon,
      value,
      onChange,
      autoFocus = true,
      disabled,
      isDisabled,
      dataCy,
    },
    ref
  ) => {
    const inputRef = useRef(null)
    const isSearchDisabled = disabled || isDisabled

    useEffect(() => {
      if (!autoFocus || isSearchDisabled) return undefined

      const focusFrame = window.requestAnimationFrame(() => {
        const activeElement = document.activeElement
        const isEditing =
          activeElement &&
          (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName) ||
            activeElement.isContentEditable)

        if (!isEditing) inputRef.current?.focus()
      })

      return () => window.cancelAnimationFrame(focusFrame)
    }, [autoFocus, isSearchDisabled])

    return (
      <Box
        sx={(theme) =>
          getStyles({
            theme,
          })
        }
        ref={ref}
        className={'search-slot'}
      >
        <TextField
          onChange={onChange}
          startIcon={searchIcon}
          placeholder={placeholder}
          value={value}
          inputRef={inputRef}
          disabled={isSearchDisabled}
          inputProps={{ 'data-cy': dataCy }}
        />
      </Box>
    )
  }
)

SearchSlot.propTypes = {
  onChange: PropTypes.func,
  autoFocus: PropTypes.bool,
  disabled: PropTypes.bool,
  isDisabled: PropTypes.bool,
  dataCy: PropTypes.string,
  searchIcon: PropTypes.node,
  placeholder: PropTypes.string,
  value: PropTypes.string,
}

SearchSlot.displayName = 'SearchSlot'
