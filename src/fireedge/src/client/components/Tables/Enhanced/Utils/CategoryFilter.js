/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { useMemo, ReactElement } from 'react'
import PropTypes from 'prop-types'

import { styled, TextField, Popper, Chip } from '@mui/material'
import Autocomplete, { autocompleteClasses } from '@mui/material/Autocomplete'
import { UseFiltersInstanceProps } from 'react-table'

import { Tr } from 'client/components/HOC'

const StyledAutocompletePopper = styled(Popper)(
  ({ theme: { palette, zIndex } }) => ({
    [`& .${autocompleteClasses.paper}`]: {
      boxShadow: 'none',
      margin: 0,
      color: 'inherit',
      fontSize: '0.75rem',
      border: `1px solid  ${palette.secondary[palette.mode]}`,
    },
    [`& .${autocompleteClasses.listbox}`]: {
      padding: 0,
      backgroundColor: palette.background.default,
      [`& .${autocompleteClasses.option}`]: {
        minHeight: 'auto',
        alignItems: 'flex-start',
        padding: '0.7em',
        '&[aria-selected="true"]': {
          backgroundColor: 'transparent',
        },
        '&[data-focus="true"], &[data-focus="true"][aria-selected="true"]': {
          backgroundColor: palette.action.hover,
        },
        [`&:not(:last-child)`]: {
          borderBottom: `1px solid  ${palette.divider}`,
        },
      },
    },
    [`&.${autocompleteClasses.popper}`]: {
      zIndex: zIndex.modal + 2,
    },
  })
)

/**
 * Render category filter to table.
 *
 * @param {object} props - Props
 * @param {UseFiltersInstanceProps} props.column - Props
 * @returns {ReactElement} Component JSX
 */
const CategoryFilter = ({
  column: { Header, filterValue = [], setFilter, preFilteredRows, id },
}) => {
  // Calculate the options for filtering using the preFilteredRows
  const options = useMemo(() => {
    const uniqueOptions = new Set()

    preFilteredRows?.forEach((row) => {
      const rowValue = row.values[id]

      // If the row value is an array, we get all the values of the array
      rowValue !== undefined &&
        (Array.isArray(rowValue)
          ? rowValue.forEach((value) => uniqueOptions.add(value))
          : uniqueOptions.add(rowValue))
    })

    return [...uniqueOptions.values()]
  }, [id, preFilteredRows])

  if (options.length === 0) {
    return null
  }

  return (
    <Autocomplete
      fullWidth
      multiple
      disableCloseOnSelect
      limitTags={2}
      color="secondary"
      value={filterValue}
      sx={{ minWidth: 300, position: 'relative' }}
      options={options}
      onChange={(_, newValue) => setFilter(newValue)}
      PopperComponent={StyledAutocompletePopper}
      renderInput={({ inputProps, ...inputParams }) => (
        <TextField
          label={Tr(Header)}
          ref={inputParams.InputProps.ref}
          inputProps={{ ...inputProps, 'data-cy': id }}
          {...inputParams}
        />
      )}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => {
          const { key, ...tagProps } = getTagProps({ index })

          return (
            <Chip
              key={key}
              variant="outlined"
              size="small"
              label={option}
              onClick={tagProps.onDelete}
              {...tagProps}
            />
          )
        })
      }
    />
  )
}

CategoryFilter.propTypes = {
  column: PropTypes.object,
}

export default CategoryFilter
