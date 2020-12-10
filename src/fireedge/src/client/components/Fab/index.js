import * as React from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import { makeStyles, Fab } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  root: {
    transition: '0.5s ease',
    zIndex: theme.zIndex.appBar,
    position: 'absolute',
    bottom: 60,
    right: theme.spacing(5)
  }
}))

const FloatingActionButton = React.memo(
  ({ icon, className, ...props }) => {
    const classes = useStyles()

    return (
      <Fab className={clsx(classes.root, className)} {...props}>
        {icon}
      </Fab>
    )
  }
)

FloatingActionButton.propTypes = {
  icon: PropTypes.node.isRequired,
  className: PropTypes.string,
  color: PropTypes.oneOf(['default', 'inherit', 'primary', 'secondary']),
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['large', 'medium', 'small']),
  variant: PropTypes.oneOf(['extended', 'round'])
}

FloatingActionButton.defaultProps = {
  icon: undefined,
  className: undefined,
  color: 'primary',
  disabled: false,
  size: 'large',
  variant: 'round'
}

FloatingActionButton.displayName = 'FloatingActionButton'

export default FloatingActionButton
