import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Button } from '@material-ui/core'
import { Filter as FilterIcon } from 'iconoir-react'

import GlobalFilter from 'client/components/Tables/Enhanced/Utils/GlobalFilter'
import GlobalSort from 'client/components/Tables/Enhanced/Utils/GlobalSort'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const useToolbarStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
    gap: '1em'
  },
  filterWrapper: {
    flexGrow: 1,
    display: 'flex',
    gap: '1em'
  },
  filterButton: {
    minWidth: 123,
    textAlign: 'left'
  }
}))

const Toolbar = ({ useTableProps }) => {
  const classes = useToolbarStyles()

  /**
   * @type {import('react-table').UseGlobalFiltersInstanceProps &
   *        import('react-table').UseSortByInstanceProps &
   *        import('react-table').TableInstance &
   * { state: import('react-table').UseGlobalFiltersState &
   *          import('react-table').TableState
   *          import('react-table').UseSortByState }}
   */
  const {
    headers,
    preGlobalFilteredRows,
    setGlobalFilter,
    preSortedRows,
    setSortBy,
    state: { globalFilter, sortBy }
  } = useTableProps

  // const numSelected = Object.keys(selectedRowIds).length

  return (
    <div className={classes.root}>
      <div className={classes.filterWrapper}>
        <Button variant='outlined'
          color='inherit'
          startIcon={<FilterIcon />}
          className={classes.filterButton}
        >
          {Tr(T.Filter)}
        </Button>
        <GlobalFilter
          preGlobalFilteredRows={preGlobalFilteredRows}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
        />
      </div>
      <GlobalSort
        headers={headers}
        preSortedRows={preSortedRows}
        sortBy={sortBy}
        setSortBy={setSortBy}
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
