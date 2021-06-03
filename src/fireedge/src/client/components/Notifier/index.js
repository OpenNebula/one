import React, { useEffect } from 'react'
import PropTypes from 'prop-types'

import { useSnackbar } from 'notistack'
import { IconButton } from '@material-ui/core'
import { Cancel as CloseIcon } from 'iconoir-react'

import { useGeneral, useGeneralApi } from 'client/features/General'

const CloseButton = ({ handleClick }) => (
  <IconButton onClick={handleClick} component="span">
    <CloseIcon size='1em' />
  </IconButton>
)

let displayed = []

const Notifier = () => {
  const { notifications } = useGeneral()
  const { deleteSnackbar } = useGeneralApi()

  const { enqueueSnackbar, closeSnackbar } = useSnackbar()

  const storeDisplayed = id => {
    displayed = [...displayed, id]
  }

  const removeDisplayed = id => {
    displayed = [...displayed.filter(key => id !== key)]
  }

  useEffect(() => {
    notifications.forEach(
      ({ key, message, options = {}, dismissed = false }) => {
        if (dismissed) {
          closeSnackbar(key)
          return
        }

        if (displayed.includes(key)) return

        enqueueSnackbar(message, {
          key,
          ...options,
          action: CloseButton({ handleClick: () => closeSnackbar(key) }),
          onExited: (_, myKey) => {
            deleteSnackbar(myKey)
            removeDisplayed(myKey)
          }
        })

        // keep track of snackbars that we've displayed
        storeDisplayed(key)
      }
    )
  }, [notifications, closeSnackbar, enqueueSnackbar, deleteSnackbar])

  return null
}

CloseButton.propTypes = {
  handleClick: PropTypes.func
}

CloseButton.defaultProps = {
  handleClick: undefined
}

export default Notifier
