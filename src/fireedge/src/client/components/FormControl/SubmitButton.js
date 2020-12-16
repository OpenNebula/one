import * as React from 'react'
import PropTypes from 'prop-types'

import {
  makeStyles, CircularProgress, Button, IconButton
} from '@material-ui/core'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
import clsx from 'clsx'

const useStyles = makeStyles(() => ({
  root: {
    transition: 'disabled 0.5s ease',
    boxShadow: 'none'
  }
}))

const ButtonComponent = ({ icon, children, ...props }) => icon ? (
  <IconButton {...props}>{children}</IconButton>
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
  ({ isSubmitting, label, icon, color, size, className, ...props }) => {
    const classes = useStyles()

    return (
      <ButtonComponent
        className={clsx(classes.root, className)}
        color={color}
        disabled={isSubmitting}
        icon={icon}
        size={size}
        {...props}
      >
        {isSubmitting && <CircularProgress color="secondary" size={24} />}
        {!isSubmitting && (label ?? Tr(T.Submit))}
      </ButtonComponent>
    )
  },
  (prev, next) =>
    prev.isSubmitting === next.isSubmitting &&
    prev.label === next.label &&
    prev.onClick === next.onClick
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
  color: 'default'
}

export default SubmitButton
