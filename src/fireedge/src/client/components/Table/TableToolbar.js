import * as React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

import {
  makeStyles,
  lighten,
  Toolbar,
  Typography,
  Tooltip,
  IconButton
} from '@material-ui/core'

import GlobalFilter from 'client/components/Table/Filters/GlobalFilter'

const useToolbarStyles = makeStyles(theme => ({
  root: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(1)
  },
  highlight:
    theme.palette.type === 'light'
      ? {
        color: theme.palette.secondary.main,
        backgroundColor: lighten(theme.palette.secondary.light, 0.85)
      }
      : {
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.secondary.dark
      },
  title: {
    flex: '1 1 100%'
  }
}))

const TableToolbar = props => {
  const classes = useToolbarStyles()

  const {
    title,
    numSelected,
    actions,
    preGlobalFilteredRows,
    setGlobalFilter,
    globalFilter
  } = props

  return (
    <Toolbar
      className={clsx(classes.root, {
        [classes.highlight]: numSelected > 0
      })}
    >
      {numSelected > 0 ? (
        <Typography className={classes.title} color='inherit' variant='subtitle1'>
          {numSelected} selected
        </Typography>
      ) : (
        <Typography className={classes.title} variant='h6' id='tableTitle'>
          {title}
        </Typography>
      )}

      {numSelected > 0 ? (
        actions?.map(({ title, icon: Icon, handleClick }) => (
          <Tooltip key={title} title={title}>
            <IconButton aria-label={title} onClick={handleClick}>
              <Icon />
            </IconButton>
          </Tooltip>
        ))
      ) : (
        <GlobalFilter
          preGlobalFilteredRows={preGlobalFilteredRows}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
        />
      )}
    </Toolbar>
  )
}

TableToolbar.propTypes = {
  title: PropTypes.string.isRequired,
  numSelected: PropTypes.number.isRequired,
  actions: PropTypes.array,
  setGlobalFilter: PropTypes.func.isRequired,
  preGlobalFilteredRows: PropTypes.array.isRequired,
  globalFilter: PropTypes.string
}

export default TableToolbar
