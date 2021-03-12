import React, { memo } from 'react'
import PropTypes from 'prop-types'

import {
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  makeStyles
} from '@material-ui/core'
import { Close as CloseIcon } from '@material-ui/icons'

import { SubmitButton } from 'client/components/FormControl'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: theme.palette.background.default,
    width: '80%',
    height: '80%',
    [theme.breakpoints.only('xs')]: {
      width: '100%',
      height: '100%'
    }
  },
  closeButton: {
    position: 'absolute',
    right: '0.5em',
    top: '0.5em'
  }
}))

const DialogConfirmation = memo(
  ({
    open,
    title,
    subheader,
    contentProps,
    handleAccept,
    acceptButtonProps,
    handleCancel,
    cancelButtonProps,
    handleEntering,
    children
  }) => {
    const classes = useStyles()
    const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'))

    return (
      <Dialog
        fullScreen={isMobile}
        onEntering={handleEntering}
        open={open}
        onClose={handleCancel}
        maxWidth='lg'
        scroll='paper'
        classes={{
          paper: classes.root
        }}
      >
        <DialogTitle disableTypography>
          <Typography variant='h6'>{title}</Typography>
          {subheader && <Typography variant='subtitle1'>{subheader}</Typography>}
          {handleCancel && (
            <IconButton
              aria-label="close"
              className={classes.closeButton}
              onClick={handleCancel}
              data-cy='dg-cancel-button'
              {...cancelButtonProps}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent dividers {...contentProps}>
          {children}
        </DialogContent>
        {handleAccept && (
          <DialogActions>
            <SubmitButton
              color='secondary'
              data-cy='dg-accept-button'
              onClick={handleAccept}
              label={Tr(T.Accept)}
              {...acceptButtonProps}
            />
          </DialogActions>
        )}
      </Dialog>
    )
  }
)

DialogConfirmation.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  subheader: PropTypes.string,
  contentProps: PropTypes.objectOf(PropTypes.any),
  handleAccept: PropTypes.func,
  acceptButtonProps: PropTypes.objectOf(PropTypes.any),
  handleCancel: PropTypes.func,
  cancelButtonProps: PropTypes.objectOf(PropTypes.any),
  handleEntering: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
}

DialogConfirmation.defaultProps = {
  open: true,
  title: 'Confirmation dialog',
  subheader: undefined,
  contentProps: undefined,
  handleAccept: undefined,
  acceptButtonProps: undefined,
  handleCancel: undefined,
  cancelButtonProps: undefined,
  handleEntering: undefined,
  children: undefined
}

DialogConfirmation.displayName = 'DialogConfirmation'

export default DialogConfirmation
