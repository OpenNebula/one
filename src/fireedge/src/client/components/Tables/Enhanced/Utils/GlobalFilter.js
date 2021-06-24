import React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, fade, debounce, InputBase } from '@material-ui/core'
import { Search as SearchIcon } from 'iconoir-react'

const useStyles = makeStyles(({ spacing, palette, shape, breakpoints }) => ({
  search: {
    position: 'relative',
    borderRadius: shape.borderRadius,
    backgroundColor: fade(palette.divider, 0.15),
    '&:hover': {
      backgroundColor: fade(palette.divider, 0.25)
    },
    width: '100%',
    [breakpoints.up('sm')]: {
      marginLeft: spacing(1),
      width: 'auto'
    }
  },
  searchIcon: {
    padding: spacing(0, 2),
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
    padding: spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${spacing(4)}px)`,
    width: '100%'
  }
}))

const GlobalFilter = props => {
  /**
   * @type {import('react-table').UseGlobalFiltersInstanceProps &
   * import('react-table').UseGlobalFiltersState}
   */
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

  /* <Box className={classes.search}>
      <Box className={classes.searchIcon}>
        <SearchIcon />
      </Box>
      <InputBase
        type='search'
        onChange={searchProps.handleChange}
        fullWidth
        placeholder={`${T.Search}...`}
        classes={{
          root: classes.inputRoot,
          input: classes.inputInput
        }}
      />
    </Box> */

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
        placeholder={'Search...'}
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
