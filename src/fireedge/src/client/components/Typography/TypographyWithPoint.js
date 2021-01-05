import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Typography } from '@material-ui/core'

const useStateStyles = makeStyles(theme => ({
  root: {
    color: theme.palette.text.secondary,
    width: 'max-content',
    '&::before': {
      content: "''",
      display: 'inline-flex',
      marginRight: '0.5rem',
      backgroundColor: ({ color }) => color,
      height: '0.7rem',
      width: '0.7rem',
      borderRadius: '50%'
    }
  }
}))

const TypographyWithPoint = ({ pointColor, children }) => {
  const classes = useStateStyles({ color: pointColor })
  return (
    <Typography className={classes.root}>
      {children}
    </Typography>
  )
}

TypographyWithPoint.propTypes = {
  pointColor: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.element])
}

TypographyWithPoint.defaultProps = {
  pointColor: undefined,
  children: undefined
}

TypographyWithPoint.displayName = 'TypographyWithPoint'

export default TypographyWithPoint
