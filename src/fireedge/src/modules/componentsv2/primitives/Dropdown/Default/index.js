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

import { useControllableState } from '@HooksModule'
import {
  Component,
  forwardRef,
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react'
import PropTypes from 'prop-types'
import { Autocomplete, ListSubheader, Divider, useTheme } from '@mui/material'
import { InputField } from '@modules/componentsv2/primitives/Fields/Default'
import { NavArrowDown as OpenIcon, Cancel as CloseIcon } from 'iconoir-react'
import {
  getInputStyles,
  getMenuStyles,
  getListStyles,
} from '@modules/componentsv2/primitives/Dropdown/Default/styles'
import { renderIcon } from '@UtilsModule'
import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'

const getOptionText = (option) => {
  const text = typeof option === 'object' ? option?.text : option

  return text == null ? '' : String(text)
}

const getOptionValue = (option) =>
  typeof option === 'object' ? option?.value ?? option?.text : option

const getOptionDataCy = (dataCy, option) => {
  const value =
    typeof option === 'object'
      ? option?.dataCy ?? getOptionValue(option)
      : option

  return dataCy && value != null
    ? `${dataCy}-${String(value).toLowerCase()}`
    : undefined
}

const filterByTextOrValue = (options, { inputValue }) => {
  const query = inputValue?.toLowerCase?.() ?? ''

  return options?.filter((option) => {
    const text = getOptionText(option).toLowerCase()
    const value = String(getOptionValue(option) ?? '').toLowerCase()

    return text.includes(query) || value.includes(query)
  })
}

/**
 * Dropdown component .
 *
 * @param {Array} root0.options - Dropdown options
 * @param {boolean} root0.isDefaultOpen - Open by default
 * @param {boolean} root0.isMultipleSelectable - Select multiple options
 * @param {boolean} root0.isDisabled - Is disabled
 * @param {number} root0.rowsDisplayed - Number of rows shown
 * @param {string} root0.menuTitle - Dropdown menu title
 * @param {string} root0.placeholder - Placeholder text
 * @returns {Component} - Dropdown component
 */
export const Dropdown = forwardRef(
  (
    {
      onChange,
      error,
      freeSolo = false,
      hint,
      tooltip,
      initialValue,
      isOutlined = true,
      isDefaultOpen = false,
      isMultipleSelectable = false,
      isDisabled = false,
      isReadOnly = false,
      isSearchable = false,
      isDisableEnter = false,
      disableCloseOnSelect = false,
      label,
      menuTitle,
      onInputChange,
      options = [],
      placeholder,
      endIcon,
      startIcon,
      PopperComponent,
      filterOptions = filterByTextOrValue,
      dataCy,
      rowsDisplayed = 4, // Controls the height of the scrollable menu container
    },
    ref
  ) => {
    const { translate, translateText } = useTranslation()
    const theme = useTheme()
    const [open, setOpen] = useState(false)
    const inputRef = useRef(null)
    const menuItemRef = useRef(null)
    const menuTitleRef = useRef(null)
    const [menuHeight, setMenuHeight] = useState({ min: 0, max: 0 })
    const [selected, setSelected] = useControllableState({
      value: initialValue,
      defaultValue: initialValue ?? (isMultipleSelectable ? [] : null),
      onChange,
    })
    const getTranslatedOptionText = useCallback(
      (option) => translateText(getOptionText(option)),
      [translateText]
    )
    const resolvedFilterOptions = useCallback(
      (availableOptions, state) => {
        if (filterOptions !== filterByTextOrValue) {
          return filterOptions(availableOptions, state)
        }

        const query = state.inputValue?.toLowerCase?.() ?? ''

        return availableOptions.filter((option) => {
          const text = getTranslatedOptionText(option).toLowerCase()
          const value = String(getOptionValue(option) ?? '').toLowerCase()

          return text.includes(query) || value.includes(query)
        })
      },
      [filterOptions, getTranslatedOptionText]
    )

    const handleClear = useCallback(
      (event) => {
        if (isDisabled || isReadOnly) return

        event.preventDefault()
        event.stopPropagation()
        setSelected(isMultipleSelectable ? [] : null)
        setOpen(false)
      },
      [isDisabled, isReadOnly, isMultipleSelectable, setSelected]
    )

    const preventClearMouseDown = useCallback((event) => {
      event.preventDefault()
      event.stopPropagation()
    }, [])

    const hasSelectedValue = isMultipleSelectable
      ? [].concat(selected ?? []).length > 0
      : selected !== null && selected !== undefined && selected !== ''

    useEffect(() => {
      if (menuItemRef.current && inputRef.current) {
        const min = inputRef.current.offsetHeight
        let max = menuItemRef.current.offsetHeight * rowsDisplayed

        if (menuTitleRef.current) {
          max += menuTitleRef.current.offsetHeight
        }

        setMenuHeight({
          min,
          max,
        })
      }
    }, [open])

    // Waits for inputRef to be defined before opening menu, otherwise anchoring fails
    useEffect(() => {
      if (isDefaultOpen && inputRef.current) {
        setOpen(true)
      }
    }, [isDefaultOpen])

    const inputStyles = useMemo(
      () =>
        getInputStyles({
          theme,
          isOpen: open,
          menuHeight,
          hasTitle: !!menuTitle,
        }),
      [theme, open, menuHeight, menuTitle]
    )

    const menuStyles = useMemo(
      () =>
        getMenuStyles({
          theme,
        }),
      [theme]
    )

    const listBoxStyles = useMemo(
      () =>
        getListStyles({
          theme,
          rowsDisplayed,
        }),
      [theme, rowsDisplayed]
    )

    return (
      <Autocomplete
        disabled={isDisabled}
        disableCloseOnSelect={disableCloseOnSelect}
        open={open}
        onClose={() => setOpen(false)}
        ref={ref}
        className="dropdown"
        sx={inputStyles}
        onChange={(_, value) => {
          if (isDisabled) return

          setSelected(value)
        }}
        onInputChange={(event, value, reason) => {
          if (isDisabled) return

          if (reason === 'input') {
            setOpen(true)
          }

          onInputChange?.(event, value, reason)
        }}
        value={
          isMultipleSelectable
            ? [].concat(selected ?? [])
            : options.length === 0 && !freeSolo
            ? null
            : selected
        }
        multiple={isMultipleSelectable}
        options={options}
        filterOptions={resolvedFilterOptions}
        getOptionLabel={getTranslatedOptionText}
        isOptionEqualToValue={(opt, val) => {
          if (!val) return false

          return String(getOptionValue(opt)) === String(getOptionValue(val))
        }}
        freeSolo={freeSolo}
        ListboxProps={{
          sx: listBoxStyles,
        }}
        PopperComponent={PopperComponent}
        componentsProps={{
          paper: {
            className: 'dropdown-menu-paper',
            sx: menuStyles,
          },
        }}
        renderInput={({ InputProps, inputProps }) => (
          <InputField
            onClick={() => {
              if (isDisabled) return
              setOpen((prev) => !prev)
            }}
            className={'dropdown-input-wrapper'}
            ref={inputRef}
            label={label}
            placeholder={placeholder || T.Placeholder}
            isDisabled={isDisabled}
            isOutlined={isOutlined}
            hint={hint}
            tooltip={tooltip}
            error={error}
            endIcon={() =>
              endIcon ? (
                renderIcon(endIcon)
              ) : hasSelectedValue && !isDisabled && !isReadOnly ? (
                <CloseIcon
                  width="16px"
                  height="16px"
                  strokeWidth={1.6}
                  onMouseDown={preventClearMouseDown}
                  onClick={handleClear}
                  data-cy={dataCy && `${dataCy}-clear`}
                />
              ) : (
                <OpenIcon width="16px" height="16px" strokeWidth={1.6} />
              )
            }
            startIcon={startIcon && renderIcon(startIcon)}
            inputProps={{
              ...inputProps,
              'data-cy': inputProps?.['data-cy'] ?? dataCy,
              readOnly: isReadOnly || (!freeSolo && !isSearchable),
              ...(isDisableEnter
                ? {
                    onKeyDown: (e) => {
                      inputProps?.onKeyDown?.(e)
                      e.key === 'Enter' && e.stopPropagation()
                    },
                  }
                : {}),
              style: {
                ...inputProps?.style,
                cursor: freeSolo || isSearchable ? 'text' : 'pointer',
              },
            }}
            InputProps={InputProps}
          />
        )}
        renderOption={({ className, ...optionProps }, option) => (
          <li
            {...optionProps}
            data-cy={getOptionDataCy(dataCy, option)}
            className={[className, 'dropdown-menu-option']
              .filter(Boolean)
              .join(' ')}
          >
            {option?.startIcon && (
              <span className="dropdown-option-starticon">
                {renderIcon(option.startIcon)}
              </span>
            )}
            <span className="dropdown-option-text">
              {getTranslatedOptionText(option)}
            </span>
            {option?.endIcon && (
              <span className="dropdown-option-endicon">
                {renderIcon(option.endIcon)}
              </span>
            )}
          </li>
        )}
        {...(menuTitle && {
          groupBy: () => translate(menuTitle),
          renderGroup: (params) => (
            <li key={params.key}>
              <ListSubheader
                ref={menuTitleRef}
                className="dropdown-menutitle-text"
              >
                {params.group}
              </ListSubheader>
              <Divider className="dropdown-menutitle-divider" />
              <ul className="dropdown-options-list" ref={menuItemRef}>
                {params.children}
              </ul>
            </li>
          ),
        })}
      />
    )
  }
)

Dropdown.propTypes = {
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  hint: PropTypes.string,
  tooltip: PropTypes.any,
  label: PropTypes.string,
  menuTitle: PropTypes.string,
  isDefaultOpen: PropTypes.bool,
  isOutlined: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  isSearchable: PropTypes.bool,
  isDisableEnter: PropTypes.bool,
  disableCloseOnSelect: PropTypes.bool,
  freeSolo: PropTypes.bool,
  onInputChange: PropTypes.func,
  options: PropTypes.array,
  filterOptions: PropTypes.func,
  dataCy: PropTypes.string,
  initialValue: PropTypes.any,
  isMultipleSelectable: PropTypes.bool,
  rowsDisplayed: PropTypes.number,
  endIcon: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  startIcon: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  PopperComponent: PropTypes.elementType,
}

Dropdown.displayName = 'Dropdown'
