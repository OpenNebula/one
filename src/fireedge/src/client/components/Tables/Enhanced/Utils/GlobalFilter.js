import * as React from 'react'
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

const GlobalFilter = ({ useTableProps }) => {
  const classes = useStyles()

  /**
   * @type {import('react-table').UseGlobalFiltersInstanceProps &
   * { state: import('react-table').UseGlobalFiltersState }}
   */
  const { setGlobalFilter, state: { globalFilter } } = useTableProps

  const [value, setValue] = React.useState(globalFilter)

  const handleChange = React.useCallback(
    // Set undefined to remove the filter entirely
    debounce(value => { setGlobalFilter(value || undefined) }, 200)
  )

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
  useTableProps: PropTypes.object.isRequired
}

export default GlobalFilter
