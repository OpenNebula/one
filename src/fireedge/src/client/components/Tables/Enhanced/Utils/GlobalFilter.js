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
import { ReactElement, Fragment, memo, useMemo } from 'react'
import PropTypes from 'prop-types'

import { Stack } from '@mui/material'
import { Filter } from 'iconoir-react'
import { UseFiltersInstanceProps, UseFiltersState } from 'react-table'

import { LABEL_COLUMN_ID } from 'client/components/Tables/Enhanced/Utils/GlobalLabel'
import HeaderPopover from 'client/components/Header/Popover'
import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * Render all selected filters.
 *
 * @returns {ReactElement} Component JSX
 */
const GlobalFilter = memo(
  (tableProps) => {
    /** @type {UseFiltersInstanceProps} */
    const { rows, columns, state } = tableProps

    /** @type {UseFiltersState} */
    const { filters } = state

    const columnsCanFilter = useMemo(
      () => columns.filter(({ canFilter }) => canFilter),
      []
    )

    if (columnsCanFilter.length === 0) {
      return null
    }

    const filtersAreNotLabel = useMemo(
      () => filters?.filter(({ id }) => id !== LABEL_COLUMN_ID),
      [filters]
    )

    return (
      <Stack direction="row" gap="0.5em" flexWrap="wrap">
        <HeaderPopover
          id="filter-by-button"
          icon={<Filter />}
          headerTitle={<Translate word={T.FilterBy} />}
          buttonLabel={<Translate word={T.Filter} />}
          buttonProps={{
            'data-cy': 'filter-by-button',
            disableElevation: true,
            variant: filtersAreNotLabel.length > 0 ? 'contained' : 'outlined',
            color: 'secondary',
            disabled: rows?.length === 0,
          }}
          popperProps={{ placement: 'bottom-end' }}
        >
          {() => (
            <Stack sx={{ width: { xs: '100%', md: 500 } }}>
              {columnsCanFilter.map((column, idx) => (
                <Fragment key={idx}>{column.render('Filter')}</Fragment>
              ))}
            </Stack>
          )}
        </HeaderPopover>
      </Stack>
    )
  },
  (next, prev) =>
    next.rows === prev.rows && next.state.filters === prev.state.filters
)

GlobalFilter.propTypes = {
  preFilteredRows: PropTypes.array,
  state: PropTypes.object,
}

GlobalFilter.displayName = 'GlobalFilter'

export default GlobalFilter
