import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Card, CardHeader, Fade, makeStyles } from '@material-ui/core'
import { Tr } from 'client/components/HOC/Translate'
import { T } from 'client/constants'

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
          subheader={Tr(title ?? T.Empty)}
          className={classes.content}
        />
      </Card>
    </Fade>
  )
})

EmptyCard.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.array])
}

EmptyCard.defaultProps = {
  title: undefined
}

EmptyCard.displayName = 'EmptyCard'

export default EmptyCard
