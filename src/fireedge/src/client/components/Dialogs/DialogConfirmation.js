import React, { memo } from 'react'
import PropTypes from 'prop-types'

import {
  useMediaQuery,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@material-ui/core'

import SubmitButton from 'client/components/FormControl/SubmitButton'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const DialogConfirmation = memo(
  ({
    open,
    title,
    contentProps,
    handleAccept,
    acceptButtonProps,
    handleCancel,
    cancelButtonProps,
    handleEntering,
    children
  }) => {
    const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'))

    return (
      <Dialog
        fullScreen={isMobile}
        onEntering={handleEntering}
        open={open}
        onClose={handleCancel}
        maxWidth="lg"
        scroll="paper"
        PaperProps={{
          style: {
            height: isMobile ? '100%' : '80%',
            width: isMobile ? '100%' : '80%'
          }
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers {...contentProps}>
          {children}
        </DialogContent>
        {(handleCancel || handleAccept) && (
          <DialogActions>
            {handleCancel && (
              <Button
                onClick={handleCancel}
                data-cy="dg-cancel-button"
                color="primary"
                {...cancelButtonProps}
              >
                {Tr(T.Cancel)}
              </Button>
            )}
            {handleAccept && (
              <SubmitButton
                color='primary'
                data-cy="dg-accept-button"
                onClick={handleAccept}
                label={Tr(T.Accept)}
                {...acceptButtonProps}
              />
            )}
          </DialogActions>
        )}
      </Dialog>
    )
  }
)

DialogConfirmation.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
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
