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
import { memo, useCallback, useState, ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Refresh, Maximize, Camera } from 'iconoir-react'
import {
  Tooltip,
  Typography,
  Button,
  IconButton,
  CircularProgress,
} from '@mui/material'

import { Translate } from 'client/components/HOC'
import { downloadFile } from 'client/utils'
import { T, GuacamoleSession } from 'client/constants'

const GuacamoleCtrlAltDelButton = memo(
  /**
   * @param {GuacamoleSession} session - Guacamole session
   * @returns {ReactElement} Button to perform Control+Alt+Delete action
   */
  (session) => {
    const { id, client } = session

    const handleClick = useCallback(() => {
      if (!client) return

      const ctrlKey = 65507
      const altKey = 65513
      const delKey = 65535

      client?.sendKeyEvent(1, ctrlKey)
      client?.sendKeyEvent(1, altKey)
      client?.sendKeyEvent(1, delKey)
      client?.sendKeyEvent(0, delKey)
      client?.sendKeyEvent(0, altKey)
      client?.sendKeyEvent(0, ctrlKey)
    }, [client])

    return (
      <Button
        data-cy={`${id}-ctrl-alt-del-button`}
        onClick={handleClick}
        disableElevation
        variant="outlined"
        color="error"
      >
        <Translate word={T.CtrlAltDel} />
      </Button>
    )
  }
)

/**
 * @param {GuacamoleSession} session - Guacamole session
 * @returns {ReactElement} Button to perform reconnect action
 */
const GuacamoleReconnectButton = (session) => {
  const { id, isLoading, handleReconnect } = session
  const [reconnecting, setReconnecting] = useState(false)

  const handleReconnectSession = async () => {
    if (isLoading) return

    setReconnecting(true)
    await handleReconnect()
    setReconnecting(false)
  }

  return (
    <Tooltip
      arrow
      placement="bottom"
      title={
        <Typography variant="subtitle2">
          <Translate word={T.Reconnect} />
        </Typography>
      }
    >
      <IconButton
        data-cy={`${id}-reconnect-button`}
        onClick={handleReconnectSession}
      >
        {reconnecting || isLoading ? (
          <CircularProgress color="secondary" size={20} />
        ) : (
          <Refresh />
        )}
      </IconButton>
    </Tooltip>
  )
}

const GuacamoleFullScreenButton = memo(
  /**
   * @param {GuacamoleSession} session - Guacamole session
   * @returns {ReactElement} Button to full screen
   */
  (session) => {
    const { id, viewport } = session

    const handleClick = useCallback(() => {
      // If the document is not in full screen mode make the video full screen
      if (!document.fullscreenElement && document.fullscreenEnabled) {
        viewport?.requestFullscreen?.()
      } else if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }, [viewport])

    return (
      <Tooltip
        arrow
        placement="bottom"
        title={
          <Typography variant="subtitle2">
            <Translate word={T.FullScreen} />
          </Typography>
        }
      >
        <IconButton data-cy={`${id}-fullscreen-button`} onClick={handleClick}>
          <Maximize />
        </IconButton>
      </Tooltip>
    )
  }
)

const GuacamoleScreenshotButton = memo(
  /**
   * @param {GuacamoleSession} session - Guacamole session
   * @returns {ReactElement} Button to make screenshot form current session
   */
  (session) => {
    const { id, client } = session

    const handleClick = useCallback(() => {
      if (!client) return

      const canvas = client.getDisplay().getDefaultLayer().getCanvas()

      canvas.toBlob((blob) => {
        downloadFile(new File([blob], 'screenshot.png'))
      }, 'image/png')
    }, [client])

    return (
      <Tooltip
        arrow
        placement="bottom"
        title={
          <Typography variant="subtitle2">
            <Translate word={T.Screenshot} />
          </Typography>
        }
      >
        <IconButton data-cy={`${id}-screenshot-button`} onClick={handleClick}>
          <Camera />
        </IconButton>
      </Tooltip>
    )
  }
)

const ButtonPropTypes = {
  client: PropTypes.object,
  viewport: PropTypes.object,
}

GuacamoleCtrlAltDelButton.displayName = 'GuacamoleCtrlAltDelButton'
GuacamoleCtrlAltDelButton.propTypes = ButtonPropTypes
GuacamoleReconnectButton.displayName = 'GuacamoleReconnectButton'
GuacamoleReconnectButton.propTypes = ButtonPropTypes
GuacamoleFullScreenButton.displayName = 'GuacamoleFullScreenButton'
GuacamoleFullScreenButton.propTypes = ButtonPropTypes
GuacamoleScreenshotButton.displayName = 'GuacamoleScreenshotButton'
GuacamoleScreenshotButton.propTypes = ButtonPropTypes

export {
  GuacamoleCtrlAltDelButton,
  GuacamoleReconnectButton,
  GuacamoleFullScreenButton,
  GuacamoleScreenshotButton,
}
