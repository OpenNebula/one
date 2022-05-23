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
import { Fragment, useMemo, ReactElement } from 'react'
import PropTypes from 'prop-types'

import { Stack, Button } from '@mui/material'
import { Filter } from 'iconoir-react'
import { TableInstance, UseTableInstanceProps } from 'react-table'

import HeaderPopover from 'client/components/Header/Popover'
import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * Render all selected sorters.
 *
 * @param {object} props - Props
 * @param {string} [props.className] - Class name for the container
 * @param {TableInstance} props.useTableProps - Table props
 * @returns {ReactElement} Component JSX
 */
const GlobalFilter = ({ className, useTableProps }) => {
  /** @type {UseTableInstanceProps} */
  const { rows, columns, setAllFilters } = useTableProps

  const columnsCanFilter = useMemo(
    () => columns.filter(({ canFilter }) => canFilter),
    [columns]
  )

  return !columnsCanFilter.length ? null : (
    <Stack className={className} direction="row" gap="0.5em" flexWrap="wrap">
      <HeaderPopover
        id="filter-by-button"
        icon={<Filter />}
        buttonLabel={T.FilterBy}
        buttonProps={{
          'data-cy': 'filter-by-button',
          variant: 'outlined',
          color: 'secondary',
          disabled: rows?.length === 0,
        }}
        popperProps={{ placement: 'bottom-end' }}
      >
        {() => (
          <Stack sx={{ width: { xs: '100%', md: 500 }, p: 2 }}>
            {columnsCanFilter.map((column, idx) => (
              <Fragment key={idx}>{column.render('Filter')}</Fragment>
            ))}
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setAllFilters([])}
              sx={{ mt: 2, alignSelf: 'flex-end' }}
            >
              <Translate word={T.Clear} />
            </Button>
          </Stack>
        )}
      </HeaderPopover>
    </Stack>
  )
}

GlobalFilter.propTypes = {
  className: PropTypes.string,
  useTableProps: PropTypes.object.isRequired,
}

export default GlobalFilter
