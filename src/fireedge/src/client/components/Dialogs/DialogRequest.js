import React, { useEffect } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Backdrop, CircularProgress } from '@material-ui/core'

import { useFetch } from 'client/hooks'
import { DialogConfirmation } from 'client/components/Dialogs'
import clsx from 'clsx'

const useStyles = makeStyles(theme => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: theme.palette.common.white
  },
  withTabs: {
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  }
}))

const DialogRequest = ({ withTabs, request, dialogProps, children }) => {
  const classes = useStyles()
  const methods = useFetch(request)
  const { data, fetchRequest, loading, error } = methods

  useEffect(() => { fetchRequest() }, [])

  error && dialogProps?.handleCancel()

  if (!data || loading) {
    return (
      <Backdrop open className={classes.backdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    )
  }

  if (withTabs) {
    const { className, ...contentProps } = dialogProps.contentProps ?? {}

    dialogProps.contentProps = {
      className: clsx(classes.withTabs, className),
      ...contentProps
    }
  }

  return (
    <DialogConfirmation {...dialogProps}>
      {children(methods)}
    </DialogConfirmation>
  )
}

DialogRequest.propTypes = {
  withTabs: PropTypes.bool,
  request: PropTypes.func.isRequired,
  dialogProps: PropTypes.shape({
    title: PropTypes.string.isRequired,
    contentProps: PropTypes.objectOf(PropTypes.any),
    handleAccept: PropTypes.func,
    acceptButtonProps: PropTypes.objectOf(PropTypes.any),
    handleCancel: PropTypes.func,
    cancelButtonProps: PropTypes.objectOf(PropTypes.any),
    handleEntering: PropTypes.func
  }),
  children: PropTypes.func
}

DialogRequest.defaultProps = {
  withTabs: false,
  request: () => undefined,
  dialogProps: {
    title: undefined,
    contentProps: {},
    handleAccept: undefined,
    acceptButtonProps: undefined,
    handleCancel: undefined,
    cancelButtonProps: undefined,
    handleEntering: undefined
  },
  children: () => undefined
}

DialogRequest.displayName = 'DialogRequest'

export default DialogRequest
