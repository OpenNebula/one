/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { Box, CircularProgress, useTheme } from '@mui/material'
import {
  Camera,
  CloudDownload,
  Code,
  Lock,
  Maximize,
  NoLock as UnLock,
  Refresh,
} from 'iconoir-react'
import PropTypes from 'prop-types'
import { ReactElement, useCallback, useMemo, useState } from 'react'
import { object, string } from 'yup'

import { GuacamoleSession, INPUT_TYPES, T, VM_ACTIONS } from '@ConstantsModule'
import { VmAPI, useModalsApi } from '@FeaturesModule'
import { createForm, downloadFile, getValidationFromFields } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'
import { ButtonGroup, ToggleGroup } from '@ComponentsV2Module'

const ICON_SIZE = '16px'
const LOADING_SIZE = 20

const getIconProps = () => ({
  width: ICON_SIZE,
  height: ICON_SIZE,
})

const useStyles = (theme) => ({
  actionsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: `${theme?.scale?.[500] ?? 16}px`,
  },
  actionGroup: {
    flex: '0 1 auto',
    alignItems: 'stretch',
  },
})

const SSH_COMMAND_FIELDS = [
  {
    name: 'command',
    label: T.SSHCommand,
    type: INPUT_TYPES.TEXT,
    validation: string().trim().default(''),
    grid: { md: 12 },
  },
  {
    name: 'colorSchema',
    label: T.Schema,
    type: INPUT_TYPES.TEXT,
    multiline: true,
    validation: string().trim().default(''),
    grid: { md: 12 },
  },
  {
    name: 'fontName',
    label: T.FontName,
    type: INPUT_TYPES.TEXT,
    validation: string().trim().default(''),
    grid: { md: 12 },
  },
  {
    name: 'fontSize',
    label: T.FontSize,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    validation: string().trim().default(''),
    grid: { md: 12 },
  },
]

const SshCommandForm = createForm(
  object(getValidationFromFields(SSH_COMMAND_FIELDS)),
  SSH_COMMAND_FIELDS
)

const getSshCommandForm = (initialValues) => {
  const formConfig = SshCommandForm({}, initialValues)

  const SshCommandModalForm = ({ onSubmit, children }) =>
    children({ ...formConfig, onSubmit })

  SshCommandModalForm.displayName = 'SshCommandModalForm'
  SshCommandModalForm.propTypes = {
    children: PropTypes.func,
    onSubmit: PropTypes.func,
  }

  return SshCommandModalForm
}

/**
 * @param {GuacamoleSession} session - Guacamole session
 * @returns {ReactElement} Grouped Guacamole console action buttons
 */
const GuacamoleActionButtons = (session) => {
  const { translate } = useTranslation()
  const {
    id,
    vmID,
    client,
    viewport,
    isLoading,
    handleReconnect,
    typeConnection,
  } = session
  const { showModal } = useModalsApi()
  const [getSession] = VmAPI.useLazyGetGuacamoleSessionFileQuery()
  const [reconnecting, setReconnecting] = useState(false)
  const [readOnlyReconnecting, setReadOnlyReconnecting] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [sshReconnecting, setSshReconnecting] = useState(false)
  const [command, setCommand] = useState('')
  const [colorSchema, setColorSchema] = useState('')
  const [fontName, setFontName] = useState('')
  const [fontSize, setFontSize] = useState('')

  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])

  const isVnc = typeConnection === VM_ACTIONS.VNC
  const isSsh = typeConnection === VM_ACTIONS.SSH
  const isDownloadable = [VM_ACTIONS.VNC, VM_ACTIONS.RDP].includes(
    typeConnection
  )

  const handleCtrlAltDel = useCallback(() => {
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

  const handleReconnectSession = useCallback(async () => {
    if (isLoading || reconnecting || !handleReconnect) return

    setReconnecting(true)
    try {
      await handleReconnect({ force: true })
    } finally {
      setReconnecting(false)
    }
  }, [handleReconnect, isLoading, reconnecting])

  const handleLockSession = useCallback(async () => {
    if (isLoading || readOnlyReconnecting || !handleReconnect || isReadOnly) {
      return
    }

    setReadOnlyReconnecting(true)
    try {
      await handleReconnect({ readOnly: true })
      setIsReadOnly(true)
    } finally {
      setReadOnlyReconnecting(false)
    }
  }, [handleReconnect, isLoading, isReadOnly, readOnlyReconnecting])

  const handleUnlockSession = useCallback(async () => {
    if (isLoading || readOnlyReconnecting || !handleReconnect || !isReadOnly) {
      return
    }

    setReadOnlyReconnecting(true)
    try {
      await handleReconnect({})
      setIsReadOnly(false)
    } finally {
      setReadOnlyReconnecting(false)
    }
  }, [handleReconnect, isLoading, isReadOnly, readOnlyReconnecting])

  const handleReconnectSSHSession = useCallback(
    async ({
      command: formCommand = '',
      colorSchema: formColorSchema = '',
      fontName: formFontName = '',
      fontSize: formFontSize = '',
    } = {}) => {
      if (isLoading || sshReconnecting || !handleReconnect) return false

      setSshReconnecting(true)
      try {
        setCommand(formCommand)
        setColorSchema(formColorSchema)
        setFontName(formFontName)
        setFontSize(formFontSize)

        const requestOptions = { force: true }
        formCommand && (requestOptions.command = formCommand)
        formColorSchema && (requestOptions.colorSchema = formColorSchema)
        formFontName && (requestOptions.fontName = formFontName)
        formFontSize && (requestOptions.fontSize = formFontSize)

        Object.keys(requestOptions).length > 0 &&
          (await handleReconnect(requestOptions))
      } finally {
        setSshReconnecting(false)
      }
    },
    [handleReconnect, isLoading, sshReconnecting]
  )

  const handleOpenSshParamsForm = useCallback(
    () =>
      showModal({
        id: `${id}-ssh-params`,
        cy: `${id}-ssh-params`,
        name: T.SSHCommand,

        dialogProps: {
          title: T.SSHCommand,
          dataCy: `${id}-ssh-params-modal`,
          validateOn: 'onSubmit',
          fixedHeight: false,
        },

        onSubmit: handleReconnectSSHSession,

        form: getSshCommandForm({
          command,
          colorSchema,
          fontName,
          fontSize,
        }),
      }),
    [
      colorSchema,
      command,
      fontName,
      fontSize,
      handleReconnectSSHSession,
      id,
      showModal,
    ]
  )

  const handleFullScreen = useCallback(() => {
    if (!document.fullscreenElement && document.fullscreenEnabled) {
      viewport?.requestFullscreen?.()
    } else if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }, [viewport])

  const handleDownloadConnection = useCallback(async () => {
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
  }, [client, getSession, id, typeConnection, vmID])

  const handleScreenshot = useCallback(() => {
    if (!client) return

    const canvas = client.getDisplay().getDefaultLayer().getCanvas()

    canvas.toBlob((blob) => {
      downloadFile(new File([blob], 'screenshot.png'))
    }, 'image/png')
  }, [client])

  const downloadTooltip = useMemo(
    () => (
      <>
        {translate(T.DownloadConecctionFile)}
        <br />
        {translate(
          typeConnection === VM_ACTIONS.RDP
            ? T.DownloadConnectionRDP
            : T.DownloadConnectionVNC
        )}
      </>
    ),
    [typeConnection, translate]
  )

  const statusButtons = useMemo(
    () => [
      {
        startIcon: <Lock {...getIconProps()} />,
        onClick: handleLockSession,
        value: 'lock',
        tooltip: translate(T.Lock),
        isDisabled: isReadOnly || !handleReconnect,
      },
      {
        startIcon: <UnLock {...getIconProps()} />,
        onClick: handleUnlockSession,
        value: 'unlock',
        tooltip: translate(T.Unlock),
        isDisabled: !isReadOnly || !handleReconnect,
      },
    ],
    [
      handleLockSession,
      handleUnlockSession,
      handleReconnect,
      isReadOnly,
      translate,
    ]
  )

  const toggleOptions = useMemo(
    () =>
      [
        [
          {
            startIcon:
              reconnecting || isLoading ? (
                <CircularProgress size={LOADING_SIZE} />
              ) : (
                <Refresh {...getIconProps()} />
              ),
            onClick: handleReconnectSession,
            value: 'reconnect',
            tooltip: translate(T.Reconnect),
            isDisabled: isLoading || reconnecting || !handleReconnect,
            'data-cy': `${id}-reconnect-button`,
          },
          ...(isDownloadable
            ? [
                {
                  startIcon: <CloudDownload {...getIconProps()} />,
                  onClick: handleDownloadConnection,
                  value: 'download',
                  title: downloadTooltip,
                  'aria-label': translate(T.DownloadConecctionFile),
                  isDisabled: !client,
                  'data-cy': `${id}-download-button`,
                },
              ]
            : []),
        ],
        [
          ...(isSsh
            ? [
                {
                  startIcon:
                    sshReconnecting || isLoading ? (
                      <CircularProgress size={LOADING_SIZE} />
                    ) : (
                      <Code {...getIconProps()} />
                    ),
                  onClick: handleOpenSshParamsForm,
                  value: 'ssh-params',
                  tooltip: translate(T.SSHCommand),
                  isDisabled: isLoading || sshReconnecting,
                  'data-cy': `${id}-edit-params-ssh`,
                },
              ]
            : []),
          {
            startIcon: <Camera {...getIconProps()} />,
            onClick: handleScreenshot,
            value: 'screenshot',
            tooltip: translate(T.Screenshot),
            isDisabled: !client,
            'data-cy': `${id}-screenshot-button`,
          },
          {
            startIcon: <Maximize {...getIconProps()} />,
            onClick: handleFullScreen,
            value: 'fullscreen',
            tooltip: translate(T.FullScreen),
            isDisabled: !viewport,
            'data-cy': `${id}-fullscreen-button`,
          },
        ],
        [
          {
            text: translate(T.CtrlAltDel),
            onClick: handleCtrlAltDel,
            value: 'ctrl-alt-del',
            tooltip: translate(T.CtrlAltDel),
            isDisabled: !client,
            'data-cy': `${id}-ctrl-alt-del-button`,
          },
        ],
      ].filter(({ length }) => length > 0),
    [
      client,
      downloadTooltip,
      handleCtrlAltDel,
      handleDownloadConnection,
      handleFullScreen,
      handleReconnect,
      handleReconnectSession,
      handleOpenSshParamsForm,
      handleScreenshot,
      id,
      isDownloadable,
      isLoading,
      isSsh,
      reconnecting,
      sshReconnecting,
      viewport,
      translate,
    ]
  )

  return (
    <Box sx={classes.actionsContainer}>
      {isVnc && !readOnlyReconnecting && !isLoading && (
        <ButtonGroup
          selected={[isReadOnly ? 'lock' : 'unlock']}
          buttons={statusButtons}
        />
      )}
      <ToggleGroup
        size="medium"
        isSelectable={false}
        options={toggleOptions}
        sx={classes.actionGroup}
      />
    </Box>
  )
}

const ButtonPropTypes = {
  id: PropTypes.string,
  vmID: PropTypes.string,
  client: PropTypes.object,
  viewport: PropTypes.object,
  isLoading: PropTypes.bool,
  handleReconnect: PropTypes.func,
  typeConnection: PropTypes.string,
}

GuacamoleActionButtons.displayName = 'GuacamoleActionButtons'
GuacamoleActionButtons.propTypes = ButtonPropTypes

export { GuacamoleActionButtons }
