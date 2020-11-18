import React, { useEffect } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Backdrop, CircularProgress } from '@material-ui/core'

import useFetch from 'client/hooks/useFetch'
import { DialogConfirmation } from 'client/components/Dialogs'

const useStyles = makeStyles(theme => ({
  backdrop: {
    zIndex: theme.zIndex.appBar,
    color: theme.palette.common.white
  }
}))

const DialogRequest = ({ request, dialogProps, children }) => {
  const classes = useStyles()
  const { data, fetchRequest, loading, error } = useFetch(request)

  useEffect(() => { fetchRequest() }, [])

  error && dialogProps?.handleCancel()

  if (!data || loading) {
    return (
      <Backdrop open className={classes.backdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    )
  }

  return (
    <DialogConfirmation {...dialogProps}>
      {children({ data })}
    </DialogConfirmation>
  )
}

DialogRequest.propTypes = {
  request: PropTypes.func.isRequired,
  dialogProps: PropTypes.shape({
    title: PropTypes.string.isRequired,
    handleAccept: PropTypes.func,
    acceptButtonProps: PropTypes.objectOf(PropTypes.any),
    handleCancel: PropTypes.func,
    cancelButtonProps: PropTypes.objectOf(PropTypes.any),
    handleEntering: PropTypes.func
  }),
  children: PropTypes.func
}

DialogRequest.defaultProps = {
  request: () => undefined,
  dialogProps: {
    title: undefined,
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
