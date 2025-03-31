/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import { Fragment, memo, ReactElement, useMemo } from 'react'

import { Stack } from '@mui/material'
import { Filter } from 'iconoir-react'
import {
  UseFiltersInstanceProps,
  UseFiltersState,
} from 'opennebula-react-table'

import { T, STYLE_BUTTONS } from '@ConstantsModule'
import HeaderPopover from '@modules/components/Header/Popover'
import { Translate } from '@modules/components/HOC'
import { LABEL_COLUMN_ID } from '@modules/components/Tables/Enhanced/Utils/GlobalLabel'

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
            active: filtersAreNotLabel.length > 0,
            disabled: rows?.length === 0,
            importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type:
              filtersAreNotLabel.length > 0
                ? STYLE_BUTTONS.TYPE.OUTLINED
                : STYLE_BUTTONS.TYPE.FILLED,
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
