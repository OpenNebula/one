import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Button } from '@material-ui/core'
import { Filter as FilterIcon } from 'iconoir-react'

// import GlobalFilter from 'client/components/Table/Filters/GlobalFilter'

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
  // const { preGlobalFilteredRows, setGlobalFilter, state } = useTableProps

  // const { selectedRowIds, globalFilter } = state
  // const numSelected = Object.keys(selectedRowIds).length

  return (
    <div className={classes.filterWrapper}>
      <Button
        variant='outlined'
        startIcon={<FilterIcon size='1rem' />}
        className={classes.filterButton}
      >
          Filters
      </Button>
      <span>No filters selected</span>
    </div>
  )

  /* numSelected > 0 && (
        <Typography className={classes.title} color='inherit' variant='subtitle1'>
          {numSelected} selected
        </Typography>
      ) */

  /* <GlobalFilter
        preGlobalFilteredRows={preGlobalFilteredRows}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      /> */
}

Toolbar.propTypes = {
  useTableProps: PropTypes.object
}

Toolbar.defaultProps = {
  useTableProps: {}
}

export default Toolbar
