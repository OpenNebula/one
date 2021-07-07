import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, List as MList, ListItem, Typography, Paper } from '@material-ui/core'

import { Tr } from 'client/components/HOC'

const useStyles = makeStyles(theme => ({
  title: {
    fontWeight: theme.typography.fontWeightBold,
    borderBottom: `1px solid ${theme.palette.divider}`
  },
  item: {
    '& > $typo': {
      width: '50%'
    }
  },
  typo: {
    ...theme.typography.body2
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
          <ListItem key={`${key}-${idx}`} className={classes.item}>
            <Typography className={classes.typo} noWrap title={key}>
              {Tr(key)}
            </Typography>
            <Typography
              noWrap
              className={classes.typo}
              title={typeof value === 'string' ? value : undefined}
            >
              {value}
            </Typography>
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
    value: PropTypes.any
  }))
}

List.displayName = 'List'

export default List
