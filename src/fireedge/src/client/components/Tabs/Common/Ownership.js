import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, List, ListItem, Typography, Paper, Divider } from '@material-ui/core'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const useStyles = makeStyles(theme => ({
  list: {
    '& p': {
      ...theme.typography.body2,
      width: '50%'
    }
  },
  title: {
    fontWeight: theme.typography.fontWeightBold
  }
}))

const Ownership = React.memo(({ userName, groupName }) => {
  const classes = useStyles()

  return (
    <Paper variant='outlined'>
      <List className={classes.list}>
        <ListItem className={classes.title}>
          <Typography noWrap>{Tr(T.Ownership)}</Typography>
        </ListItem>
        <Divider />
        <ListItem>
          <Typography noWrap>{Tr(T.Owner)}</Typography>
          <Typography noWrap>{userName}</Typography>
        </ListItem>
        <ListItem>
          <Typography>{Tr(T.Group)}</Typography>
          <Typography>{groupName}</Typography>
        </ListItem>
      </List>
    </Paper>
  )
})

Ownership.propTypes = {
  userName: PropTypes.string.isRequired,
  groupName: PropTypes.string.isRequired
}

Ownership.displayName = 'Ownership'

export default Ownership
