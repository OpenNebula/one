import * as React from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import { Paper, Typography, makeStyles, lighten, darken } from '@material-ui/core'

import { addOpacityToColor } from 'client/utils'

const useStyles = makeStyles(theme => {
  const getBackgroundColor = theme.palette.type === 'dark' ? darken : lighten
  const getContrastBackgroundColor = theme.palette.type === 'light' ? darken : lighten

  return {
    root: {
      padding: '2em',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: ({ bgColor }) => getBackgroundColor(bgColor, 0.3)
    },
    icon: {
      position: 'absolute',
      top: 0,
      right: 0,
      fontSize: '10em',
      fill: addOpacityToColor(theme.palette.common.white, 0.2)
    },
    wave: {
      display: 'block',
      position: 'absolute',
      opacity: 0.4,
      top: '-5%',
      left: '50%',
      width: 220,
      height: 220,
      borderRadius: '43%'
    },
    wave1: {
      backgroundColor: ({ bgColor }) => getContrastBackgroundColor(bgColor, 0.3),
      animation: '$drift 7s infinite linear'
    },
    wave2: {
      backgroundColor: ({ bgColor }) => getContrastBackgroundColor(bgColor, 0.5),
      animation: '$drift 5s infinite linear'
    },
    '@keyframes drift': {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' }
    }
  }
})

const WavesCard = React.memo(({ text, value, bgColor, icon: Icon }) => {
  const classes = useStyles({ bgColor })

  return (
    <Paper className={classes.root}>
      <Typography variant='h6'>{text}</Typography>
      <Typography variant='h4'>{value}</Typography>
      <span className={clsx(classes.wave, classes.wave1)} />
      <span className={clsx(classes.wave, classes.wave2)} />
      {Icon && <Icon className={classes.icon} />}
    </Paper>
  )
}, (prev, next) => prev.value === next.value)

WavesCard.propTypes = {
  text: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.element
  ]),
  bgColor: PropTypes.string,
  icon: PropTypes.any
}

WavesCard.defaultProps = {
  text: undefined,
  value: undefined,
  bgColor: '#ffffff00',
  icon: undefined
}

WavesCard.displayName = 'WavesCard'

export default WavesCard
