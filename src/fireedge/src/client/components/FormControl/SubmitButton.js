import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, CircularProgress, Button, IconButton } from '@material-ui/core'
import clsx from 'clsx'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const useStyles = makeStyles(theme => ({
  root: {
    transition: 'disabled 0.5s ease',
    boxShadow: 'none'
  },
  disabled: {
    '& svg': {
      color: theme.palette.action.disabled
    }
  }
}))

const ButtonComponent = ({ icon, children, ...props }) => icon ? (
  <IconButton {...props}>{children}</IconButton>
) : (
  <Button type='submit' variant='contained' {...props}>
    {children}
  </Button>
)

ButtonComponent.propTypes = {
  icon: PropTypes.bool,
  children: PropTypes.any
}

const SubmitButton = React.memo(
  ({ isSubmitting, disabled, label, icon, color, size, className, ...props }) => {
    const classes = useStyles()

    return (
      <ButtonComponent
        className={clsx(classes.root, className, {
          [classes.disabled]: disabled
        })}
        color={color}
        disabled={disabled || isSubmitting}
        icon={icon}
        size={size}
        {...props}
      >
        {isSubmitting && <CircularProgress color='secondary' size={24} />}
        {!isSubmitting && (label ?? Tr(T.Submit))}
      </ButtonComponent>
    )
  },
  (prev, next) =>
    prev.isSubmitting === next.isSubmitting &&
    prev.disabled === next.disabled &&
    prev.label === next.label &&
    prev.onClick === next.onClick
)

SubmitButton.propTypes = {
  icon: PropTypes.bool,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  isSubmitting: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  color: PropTypes.oneOf(['default', 'inherit', 'primary', 'secondary']),
  size: PropTypes.oneOf(['large', 'medium', 'small'])
}

SubmitButton.defaultProps = {
  icon: false,
  label: undefined,
  isSubmitting: false,
  disabled: false,
  className: undefined,
  color: 'default'
}

export default SubmitButton
