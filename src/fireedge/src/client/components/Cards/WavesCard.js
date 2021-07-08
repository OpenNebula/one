/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import * as React from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import { Paper, Typography, makeStyles, lighten, darken } from '@material-ui/core'

import { addOpacityToColor } from 'client/utils'
import { SCHEMES } from 'client/constants'

const useStyles = makeStyles(theme => {
  const getBackgroundColor = theme.palette.type === SCHEMES.DARK ? darken : lighten
  const getContrastBackgroundColor = theme.palette.type === SCHEMES.LIGHT ? darken : lighten

  return {
    root: {
      padding: '2em',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: ({ bgColor }) => getBackgroundColor(bgColor, 0.3),
      [theme.breakpoints.only('xs')]: {
        display: 'inline-flex',
        alignItem: 'baseline',
        gap: '1em'
      }
    },
    icon: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: '100%',
      height: '100%',
      textAlign: 'end',
      '& > svg': {
        color: addOpacityToColor(theme.palette.common.white, 0.2),
        height: '100%',
        width: '30%'
      }
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
      {Icon && (
        <span className={classes.icon}>
          <Icon />
        </span>
      )}
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
