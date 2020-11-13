import React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, CircularProgress, Button, Fab } from '@material-ui/core'

import { Submit } from 'client/constants/translates'
import { Tr } from 'client/components/HOC'

const useStyles = makeStyles(() => ({
  root: {
    transition: 'disabled 0.5s ease',
    boxShadow: 'none'
  }
}))

const ButtonComponent = ({ fab, children, ...props }) => fab ? (
  <Fab color="primary" size="small" {...props}>{children}</Fab>
) : (
  <Button color="primary" type="submit" variant="contained" {...props}>
    {children}
  </Button>
)

ButtonComponent.propTypes = {
  fab: PropTypes.bool,
  children: PropTypes.any
}

const SubmitButton = ({ isSubmitting, label, fab, ...props }) => {
  const classes = useStyles()

  return (
    <ButtonComponent
      color="primary"
      className={classes.root}
      disabled={isSubmitting}
      fab={fab}
      {...props}
    >
      {isSubmitting && <CircularProgress size={24} />}
      {!isSubmitting && (label ?? Tr(Submit))}
    </ButtonComponent>
  )
}

SubmitButton.propTypes = {
  fab: PropTypes.bool,
  isSubmitting: PropTypes.bool,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
}

SubmitButton.defaultProps = {
  fab: false,
  isSubmitting: false,
  label: undefined
}

export default SubmitButton
