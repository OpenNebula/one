import * as React from 'react'
import PropTypes from 'prop-types'

import {
  makeStyles, CircularProgress, Button, Fab, IconButton
} from '@material-ui/core'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const useStyles = makeStyles(() => ({
  root: {
    transition: 'disabled 0.5s ease',
    boxShadow: 'none'
  }
}))

const ButtonComponent = ({ icon, children, ...props }) => icon ? (
  <IconButton {...props}>
    {children}
  </IconButton>
) : (
  <Button type="submit" variant="contained" {...props}>
    {children}
  </Button>
)

ButtonComponent.propTypes = {
  icon: PropTypes.bool,
  children: PropTypes.any
}

const SubmitButton = React.memo(
  ({ isSubmitting, label, ...props }) => {
    const classes = useStyles()

    return (
      <ButtonComponent
        className={classes.root}
        disabled={isSubmitting}
        {...props}
      >
        {isSubmitting && <CircularProgress size={24} />}
        {!isSubmitting && (label ?? Tr(T.Submit))}
      </ButtonComponent>
    )
  },
  (prev, next) => prev.isSubmitting === next.isSubmitting
)

SubmitButton.propTypes = {
  icon: PropTypes.bool,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  isSubmitting: PropTypes.bool,
  className: PropTypes.string,
  color: PropTypes.oneOf(['default', 'inherit', 'primary', 'secondary']),
  size: PropTypes.oneOf(['large', 'medium', 'small'])
}

SubmitButton.defaultProps = {
  icon: false,
  label: undefined,
  isSubmitting: false,
  className: undefined,
  color: 'primary',
  variant: 'contained'
}

export default SubmitButton
