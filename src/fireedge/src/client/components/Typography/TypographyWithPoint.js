import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Typography } from '@material-ui/core'

const useStateStyles = makeStyles(theme => ({
  root: {
    color: theme.palette.text.secondary,
    '&::before': {
      content: "''",
      marginRight: '0.5rem',
      display: 'inline-flex',
      height: '0.7rem',
      width: '0.7rem',
      background: ({ color }) => color,
      borderRadius: '50%'
    }
  }
}))

const TypographyWithPoint = ({ pointColor, children, ...props }) => {
  const classes = useStateStyles({ color: pointColor })
  return (
    <Typography noWrap className={classes.root} {...props}>
      {children}
    </Typography>
  )
}

TypographyWithPoint.propTypes = {
  pointColor: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.element
  ])
}

TypographyWithPoint.defaultProps = {
  pointColor: undefined,
  children: undefined
}

TypographyWithPoint.displayName = 'TypographyWithPoint'

export default TypographyWithPoint
