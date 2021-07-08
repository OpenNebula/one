/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Button } from '@material-ui/core'
import { Filter as FilterIcon } from 'iconoir-react'

import GlobalFilter from 'client/components/Tables/Enhanced/Utils/GlobalFilter'

const useToolbarStyles = makeStyles(theme => ({
  filterWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '1em'
  },
  filterButton: {
    ...theme.typography.body1,
    fontWeight: theme.typography.fontWeightBold,
    textTransform: 'none'
  }
}))

const Toolbar = ({ useTableProps }) => {
  const classes = useToolbarStyles()

  /** @type {import('react-table').UseGlobalFiltersInstanceProps} */
  const { preGlobalFilteredRows, setGlobalFilter, state } = useTableProps

  /** @type {import('react-table').UseFiltersState} */
  const { globalFilter } = state

  return (
    <div className={classes.filterWrapper}>
      <Button startIcon={<FilterIcon />}
        className={classes.filterButton}
      >
        Filters
      </Button>
      <GlobalFilter
        preGlobalFilteredRows={preGlobalFilteredRows}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
    </div>
  )
}

Toolbar.propTypes = {
  useTableProps: PropTypes.object
}

Toolbar.defaultProps = {
  useTableProps: {}
}

export default Toolbar
