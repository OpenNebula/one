import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, List as MList, ListItem, Typography, Paper } from '@material-ui/core'

import { Tr } from 'client/components/HOC'

const useStyles = makeStyles(theme => ({
  list: {
    ...theme.typography.body2,
    '& > * > *': {
      width: '50%'
    }
  },
  title: {
    fontWeight: theme.typography.fontWeightBold,
    borderBottom: `1px solid ${theme.palette.divider}`
  }
}))

const List = ({ title, list = [], ...props }) => {
  const classes = useStyles()

  return (
    <Paper variant='outlined' {...props}>
      <MList className={classes.list}>
        {/* TITLE */}
        {title && (
          <ListItem className={classes.title}>
            <Typography noWrap>{Tr(title)}</Typography>
          </ListItem>
        )}
        {/* LIST */}
        {list.map(({ key, value }, idx) => (
          <ListItem key={`${key}-${idx}`}>
            <Typography noWrap title={key}>{Tr(key)}</Typography>
            <Typography noWrap title={value}>{value}</Typography>
          </ListItem>
        ))}
      </MList>
    </Paper>
  )
}

List.propTypes = {
  title: PropTypes.string,
  list: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.node
    ])
  }))
}

List.displayName = 'List'

export default List
