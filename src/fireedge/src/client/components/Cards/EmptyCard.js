import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Card, CardHeader, Fade, makeStyles } from '@material-ui/core'
import { Tr } from 'client/components/HOC/Translate'

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%'
  },
  content: {
    height: '100%',
    minHeight: 140,
    padding: theme.spacing(1),
    textAlign: 'center'
  }
}))

const EmptyCard = memo(({ title }) => {
  const classes = useStyles()

  return (
    <Fade in unmountOnExit>
      <Card className={classes.root} variant="outlined">
        <CardHeader
          subheader={title ?? Tr('empty')}
          className={classes.content}
        />
      </Card>
    </Fade>
  )
})

EmptyCard.propTypes = {
  title: PropTypes.string
}

EmptyCard.defaultProps = {
  title: undefined
}

EmptyCard.displayName = 'EmptyCard'

export default EmptyCard
