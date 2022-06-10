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
import { ReactElement, useState, memo, useMemo } from 'react'
import PropTypes from 'prop-types'

import SettingsIcon from 'iconoir-react/dist/Settings'
import { Stack } from '@mui/material'
import { UseFiltersInstanceProps } from 'react-table'

import FilterByLabel from 'client/components/Tables/Enhanced/Utils/GlobalLabel/Filter'
import HeaderPopover from 'client/components/Header/Popover'
import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

export const LABEL_COLUMN_ID = 'label'

const getLabels = (rows) =>
  rows
    ?.map((row) => row.values[LABEL_COLUMN_ID]?.split(','))
    .filter(Boolean)
    .flat()
    .sort((a, b) => a.localeCompare(b))

/**
 * Button to filter rows by label or assign labels to selected rows.
 *
 * @returns {ReactElement} Button component
 */
const GlobalLabel = memo(
  (tableProps) => {
    const [pendingValue, setPendingValue] = useState([])

    /** @type {UseFiltersInstanceProps} */
    const { setFilter, preFilteredRows, state } = tableProps

    const labels = useMemo(
      () => [...new Set(getLabels(preFilteredRows))],
      [preFilteredRows]
    )

    const filters = useMemo(
      () =>
        state.filters
          .filter(({ id }) => id === LABEL_COLUMN_ID)
          .map(({ value }) => value),
      [state.filters]
    )

    if (labels.length === 0) {
      return null
    }

    return (
      <Stack direction="row" gap="0.5em" flexWrap="wrap">
        <HeaderPopover
          id="filter-by-label"
          icon={<SettingsIcon />}
          headerTitle={<Translate word={T.FilterByLabel} />}
          buttonLabel={<Translate word={T.Label} />}
          buttonProps={{
            'data-cy': 'filter-by-label',
            disableElevation: true,
            variant: filters?.length > 0 ? 'contained' : 'outlined',
            color: 'secondary',
            disabled: preFilteredRows?.length === 0,
            onClick: () => setPendingValue(filters),
          }}
          popperProps={{ placement: 'bottom-end' }}
          onClickAway={() => setFilter(LABEL_COLUMN_ID, pendingValue)}
        >
          {({ handleClose }) => (
            <FilterByLabel
              currentValue={pendingValue}
              labels={labels}
              filters={filters}
              handleChange={(event, newValue, reason) => {
                if (
                  event.type === 'keydown' &&
                  event.key === 'Backspace' &&
                  reason === 'removeOption'
                ) {
                  return
                }

                setPendingValue(newValue)
              }}
              handleClose={(event, reason) => {
                reason === 'escape' && handleClose()
              }}
            />
          )}
        </HeaderPopover>
      </Stack>
    )
  },
  (next, prev) =>
    next.preFilteredRows === prev.preFilteredRows &&
    next.state.filters === prev.state.filters
)

GlobalLabel.propTypes = {
  preFilteredRows: PropTypes.array,
  state: PropTypes.object,
}

GlobalLabel.displayName = 'GlobalLabel'

export default GlobalLabel
