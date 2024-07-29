/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
/* eslint-disable jsdoc/require-jsdoc */
import { useEffect } from 'react'
import PropTypes from 'prop-types'

import { useSnackbar } from 'notistack'
import { IconButton } from '@mui/material'
import { Cancel as CloseIcon } from 'iconoir-react'

import { useGeneral, useGeneralApi } from 'client/features/General'
import { Translate } from 'client/components/HOC'

const CloseButton = ({ handleClick }) => (
  <IconButton onClick={handleClick} component="span">
    <CloseIcon />
  </IconButton>
)

let displayed = []

const Notifier = () => {
  const { notifications } = useGeneral()
  const { deleteSnackbar } = useGeneralApi()

  const { enqueueSnackbar, closeSnackbar } = useSnackbar()

  const storeDisplayed = (id) => {
    displayed = [...displayed, id]
  }

  const removeDisplayed = (id) => {
    displayed = [...displayed.filter((key) => id !== key)]
  }

  useEffect(() => {
    notifications.forEach(
      ({ key, message, options = {}, dismissed = false, values }) => {
        if (dismissed) {
          closeSnackbar(key)

          return
        }

        if (displayed.includes(key)) return

        enqueueSnackbar(<Translate word={message} values={values} />, {
          key,
          ...options,
          action: CloseButton({ handleClick: () => closeSnackbar(key) }),
          onExited: (_, myKey) => {
            deleteSnackbar(myKey)
            removeDisplayed(myKey)
          },
        })

        // keep track of snackBars that we've displayed
        storeDisplayed(key)
      }
    )
  }, [notifications, closeSnackbar, enqueueSnackbar, deleteSnackbar])

  return null
}

CloseButton.propTypes = {
  handleClick: PropTypes.func,
}

CloseButton.defaultProps = {
  handleClick: undefined,
}

export default Notifier
