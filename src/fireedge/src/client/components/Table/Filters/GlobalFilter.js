import React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, fade, debounce, InputBase } from '@material-ui/core'
import { Search as SearchIcon } from 'iconoir-react'

const useStyles = makeStyles(theme => ({
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25)
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(3),
      width: 'auto'
    }
  },
  searchIcon: {
    width: theme.spacing(7),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  inputRoot: {
    color: 'inherit'
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 7),
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: 200
    }
  }
}))

const GlobalFilter = props => {
  const { preGlobalFilteredRows, globalFilter, setGlobalFilter } = props

  const classes = useStyles()
  const count = preGlobalFilteredRows.length

  const [value, setValue] = React.useState(globalFilter)

  const handleChange = React.useCallback(
    // Set undefined to remove the filter entirely
    debounce(value => { setGlobalFilter(value || undefined) }, 200)
  )

  // Global filter only works with pagination from the first page.
  // This may not be a problem for server side pagination when
  // only the current page is downloaded.

  return (
    <div className={classes.search}>
      <div className={classes.searchIcon}>
        <SearchIcon />
      </div>
      <InputBase
        value={value ?? ''}
        onChange={event => {
          setValue(event.target.value)
          handleChange(event.target.value)
        }}
        placeholder={`${count} records...`}
        classes={{
          root: classes.inputRoot,
          input: classes.inputInput
        }}
        inputProps={{ 'aria-label': 'search' }}
      />
    </div>
  )
}

GlobalFilter.propTypes = {
  preGlobalFilteredRows: PropTypes.array.isRequired,
  globalFilter: PropTypes.string,
  setGlobalFilter: PropTypes.func.isRequired
}

export default GlobalFilter
