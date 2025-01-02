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
import {
  Button,
  CircularProgress,
  IconButton,
  Popper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { css } from '@emotion/css'
import {
  Camera,
  CloudDownload,
  Code,
  Edit,
  Lock,
  Maximize,
  Refresh,
} from 'iconoir-react'
import PropTypes from 'prop-types'
import {
  ReactElement,
  useMemo,
  memo,
  useCallback,
  useRef,
  useState,
} from 'react'

import { Translate } from '@modules/components/HOC'
import { GuacamoleSession, T } from '@ConstantsModule'
import { downloadFile } from '@UtilsModule'
import { VmAPI } from '@FeaturesModule'

const useStyles = ({ palette }) => ({
  customPopper: css({
    backgroundColor: palette.background.default,
    padding: '16px',
    borderRadius: '8px',
    zIndex: 1,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  }),
  customScheme: css({
    width: '100%',
  }),
  customSubmitButton: css({
    width: '100%',
    marginTop: '1rem',
  }),
})

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
    await handleReconnect({ force: true })
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

/**
 * @param {GuacamoleSession} session - Guacamole session
 * @returns {ReactElement} Button to perform reconnect action
 */
const GuacamoleReconnectReadOnlyButton = (session) => {
  const { id, isLoading, handleReconnect } = session
  const [reconnecting, setReconnecting] = useState(false)
  const [enabled, setEnabled] = useState(true)

  const handleReconnectSession = async () => {
    if (isLoading) return

    setReconnecting(true)
    const reconectParams = enabled ? { readOnly: true } : {}
    await handleReconnect(reconectParams)
    setEnabled(!enabled)
    setReconnecting(false)
  }

  return (
    <Tooltip
      arrow
      placement="bottom"
      title={
        <Typography variant="subtitle2">
          <Translate word={enabled ? T.Lock : T.Unlock} />
        </Typography>
      }
    >
      <IconButton
        data-cy={`${id}-read-only-button`}
        onClick={handleReconnectSession}
      >
        {reconnecting || isLoading ? (
          <CircularProgress color="secondary" size={20} />
        ) : enabled ? (
          <Lock />
        ) : (
          <Edit />
        )}
      </IconButton>
    </Tooltip>
  )
}

const FormData = ({
  command,
  setCommand,
  colorSchema,
  setColorSchema,
  fontName,
  setFontName,
  fontSize,
  setFontSize,
}) => {
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])

  return (
    <>
      <Stack
        direction="column"
        alignItems="center"
        style={{ justifyContent: 'center' }}
        gap="1em"
      >
        <TextField
          value={command}
          label={T.SSHCommand}
          onChange={(event) => {
            setCommand(event.target.value)
          }}
        />
        <TextField
          value={colorSchema}
          label={T.Schema}
          multiline
          rows={4}
          className={classes.customScheme}
          onChange={(event) => {
            setColorSchema(event.target.value)
          }}
        />
        <TextField
          value={fontName}
          label={T.FontName}
          onChange={(event) => {
            setFontName(event.target.value)
          }}
        />
        <TextField
          value={fontSize}
          label={T.FontSize}
          type="number"
          onChange={(event) => {
            setFontSize(event.target.value)
          }}
        />
      </Stack>
    </>
  )
}
FormData.displayName = 'FormData'
FormData.propTypes = {
  command: PropTypes.string,
  setCommand: PropTypes.func,
  colorSchema: PropTypes.string,
  setColorSchema: PropTypes.func,
  fontName: PropTypes.string,
  setFontName: PropTypes.func,
  fontSize: PropTypes.number,
  setFontSize: PropTypes.func,
}

/**
 * @param {GuacamoleSession} session - Guacamole session
 * @returns {ReactElement} Button to perform reconnect action
 */
const GuacamoleSSHParams = (session) => {
  const buttonRef = useRef(null)
  const { id, isLoading, handleReconnect } = session
  const [reconnecting, setReconnecting] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [command, setCommand] = useState('')
  const [colorSchema, setColorSchema] = useState('')
  const [fontName, setFontName] = useState('')
  const [fontSize, setFontSize] = useState('')

  const classes = useStyles()

  const handleReconnectSession = async () => {
    if (isLoading) return

    setReconnecting(true)
    const requestOptions = { force: true }
    command && (requestOptions.command = command)
    colorSchema && (requestOptions.colorSchema = colorSchema)
    fontName && (requestOptions.fontName = fontName)
    fontSize && (requestOptions.fontSize = fontSize)

    Object.keys(requestOptions).length > 0 &&
      (await handleReconnect(requestOptions))

    setEnabled(false)
    setReconnecting(false)
  }

  return (
    <>
      {reconnecting || isLoading ? (
        <CircularProgress color="secondary" size={20} />
      ) : (
        <>
          <IconButton
            ref={buttonRef}
            data-cy={`${id}-edit-params-ssh`}
            onClick={() => setEnabled(!enabled)}
          >
            <Code />
          </IconButton>
          <Popper
            open={enabled}
            anchorEl={buttonRef.current}
            placement="bottom"
            className={classes.customPopper}
            modifiers={[
              {
                name: 'preventOverflow',
                options: {
                  padding: 8,
                },
              },
            ]}
          >
            <FormData
              command={command}
              setCommand={setCommand}
              colorSchema={colorSchema}
              setColorSchema={setColorSchema}
              fontName={fontName}
              setFontName={setFontName}
              fontSize={fontSize}
              setFontSize={setFontSize}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleReconnectSession}
              data-cy={`${id}-ssh-command-button`}
              className={classes.customSubmitButton}
            >
              <Translate word={T.Submit} />
            </Button>
          </Popper>
        </>
      )}
    </>
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

const GuacamoleDownloadConButton = memo(
  /**
   * @param {GuacamoleSession} session - Guacamole session
   * @returns {ReactElement} Button to make screenshot form current session
   */
  (session) => {
    const [getSession] = VmAPI.useLazyGetGuacamoleSessionFileQuery()
    const { id, vmID, client, typeConnection } = session
    const handleClick = useCallback(async () => {
      if (!client) return

      const res = await getSession({
        id: vmID,
        type: typeConnection,
        download: true,
      }).unwrap()

      if (res) {
        const blob = new Blob([atob(res)], { type: 'text/plain' })
        downloadFile(new File([blob], `${id}.${typeConnection}`))
      }
    }, [client])

    return (
      <Tooltip
        arrow
        placement="bottom"
        title={
          <Typography variant="subtitle2">
            <Translate word={T.DownloadConecctionFile} />
            <br />
            <Translate
              word={
                typeConnection === 'rdp'
                  ? T.DownloadConnectionRDP
                  : T.DownloadConnectionVNC
              }
            />
          </Typography>
        }
      >
        <IconButton data-cy={`${id}-download-button`} onClick={handleClick}>
          <CloudDownload />
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
GuacamoleReconnectReadOnlyButton.displayName =
  'GuacamoleReconnectReadOnlyButton'
GuacamoleReconnectReadOnlyButton.propTypes = ButtonPropTypes
GuacamoleFullScreenButton.displayName = 'GuacamoleFullScreenButton'
GuacamoleFullScreenButton.propTypes = ButtonPropTypes
GuacamoleScreenshotButton.displayName = 'GuacamoleScreenshotButton'
GuacamoleScreenshotButton.propTypes = ButtonPropTypes
GuacamoleSSHParams.displayName = 'GuacamoleSSHParams'
GuacamoleSSHParams.propTypes = ButtonPropTypes
GuacamoleDownloadConButton.displayName = 'GuacamoleDownloadConButton'
GuacamoleDownloadConButton.propTypes = ButtonPropTypes

export {
  GuacamoleCtrlAltDelButton,
  GuacamoleDownloadConButton,
  GuacamoleFullScreenButton,
  GuacamoleReconnectButton,
  GuacamoleReconnectReadOnlyButton,
  GuacamoleSSHParams,
  GuacamoleScreenshotButton,
}
