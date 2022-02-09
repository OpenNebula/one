/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { useEffect, useMemo, JSXElementConstructor } from 'react'
import PropTypes from 'prop-types'

import {
  List,
  ListSubheader,
  ListItemButton,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material'
import { Cancel } from 'iconoir-react'
import { UseFiltersInstanceProps } from 'react-table'

import { Tr, Translate } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * Render category filter to table.
 *
 * @param {object} props - Props
 * @param {string} props.title - Title category
 * @param {UseFiltersInstanceProps} props.column - Column to filter by
 * @param {string} [props.accessorOption] - Name of property option
 * @param {boolean} [props.multiple] - If `true`, can be more than one filter
 * @returns {JSXElementConstructor} Component JSX
 */
const CategoryFilter = ({
  title,
  column,
  accessorOption,
  multiple = false,
}) => {
  const {
    setFilter,
    id,
    preFilteredRows,
    filterValue = multiple ? [] : undefined,
  } = column

  useEffect(() => () => setFilter(undefined), [])

  // Calculate the options for filtering using the preFilteredRows
  const options = useMemo(() => {
    const filteredOptions = {}

    preFilteredRows?.forEach((row) => {
      const value = row.values[id]

      if (!value) return

      const count = filteredOptions[value[accessorOption] ?? value] || 0
      filteredOptions[value[accessorOption] ?? value] = count + 1
    })

    return filteredOptions
  }, [id, preFilteredRows])

  const handleSelect = (value) => {
    setFilter(multiple ? [...filterValue, value] : value)
  }

  const handleUnselect = (value) => {
    setFilter(multiple ? filterValue.filter((v) => v !== value) : undefined)
  }

  const handleClear = () => setFilter(multiple ? [] : undefined)

  const isFiltered = useMemo(
    () => (multiple ? filterValue?.length > 0 : filterValue !== undefined),
    [filterValue]
  )

  if (Object.keys(options).length === 0) {
    return null
  }

  return (
    <List>
      {title && (
        <ListSubheader
          disableSticky
          disableGutters
          title={Tr(title)}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          {Tr(title)}
          {isFiltered && (
            <Tooltip title={<Translate word={T.Clear} />}>
              <IconButton disableRipple size="small" onClick={handleClear}>
                <Cancel />
              </IconButton>
            </Tooltip>
          )}
        </ListSubheader>
      )}

      {Object.entries(options).map(([option, count], i) => {
        const value = option[accessorOption] ?? option

        const isSelected = multiple
          ? filterValue?.includes?.(value)
          : value === filterValue

        return (
          <ListItemButton
            key={i}
            selected={isSelected}
            onClick={() =>
              isSelected ? handleUnselect(value) : handleSelect(value)
            }
          >
            <Typography noWrap variant="subtitle2" title={value}>
              {`${value} (${count})`}
            </Typography>
          </ListItemButton>
        )
      })}
    </List>
  )
}

CategoryFilter.propTypes = {
  column: PropTypes.object,
  accessorOption: PropTypes.string,
  icon: PropTypes.node,
  title: PropTypes.string,
  multiple: PropTypes.bool,
}

export default CategoryFilter
