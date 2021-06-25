import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Button } from '@material-ui/core'
import { Filter as FilterIcon } from 'iconoir-react'

import GlobalFilter from 'client/components/Table/Filters/GlobalFilter'

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
