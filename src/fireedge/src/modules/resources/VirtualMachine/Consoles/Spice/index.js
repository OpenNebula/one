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

import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { ReactElement, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

export * from '@modules/resources/VirtualMachine/Consoles/Spice/buttons'

const getWebsocketUri = (endpoint) => {
  const url = new URL(endpoint, window.location.origin)
  url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

  return url.toString()
}

/**
 * SPICE display backed by the official spice-html5 client.
 *
 * @param {object} props - Component props
 * @param {object} props.session - Ephemeral session returned by FireEdge
 * @param {Function} props.onStatusChange - Connection status callback
 * @returns {ReactElement} SPICE canvas container
 */
export const SpiceDisplay = ({ session, onStatusChange }) => {
  const [connectionState, setConnectionState] = useState('connecting')
  const instanceId = useRef(
    `spice-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )
  const screenId = `${instanceId.current}-screen`
  const messageId = `${instanceId.current}-message`
  const dumpId = `${instanceId.current}-dump`

  useEffect(() => {
    let cancelled = false
    let connection

    const connect = async () => {
      try {
        setConnectionState('connecting')
        onStatusChange({ state: 'connecting', error: '' })
        const { SpiceMainConn } = await import(
          '@spice-project/spice-html5/src/main.js'
        )

        if (cancelled) return

        connection = new SpiceMainConn({
          uri: getWebsocketUri(session.websocket),
          password: session.password,
          screen_id: screenId,
          message_id: messageId,
          dump_id: dumpId,
          onsuccess: () => {
            if (!cancelled) {
              setConnectionState('connected')
              onStatusChange({ state: 'connected', error: '' })
            }
          },
          onerror: (error) => {
            if (!cancelled) {
              setConnectionState('error')
              onStatusChange({
                state: 'error',
                error: error?.message ?? String(error),
              })
            }
          },
        })
      } catch (error) {
        if (!cancelled) {
          setConnectionState('error')
          onStatusChange({
            state: 'error',
            error: error?.message ?? String(error),
          })
        }
      }
    }

    connect()

    return () => {
      cancelled = true
      try {
        connection?.stop?.()
      } catch {}

      const screen = document.getElementById(screenId)
      screen?.replaceChildren()
    }
  }, [
    session.websocket,
    session.password,
    screenId,
    messageId,
    dumpId,
    onStatusChange,
  ])

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '16rem',
        overflow: 'auto',
        bgcolor: '#202124',
        borderRadius: 1,
      }}
    >
      <Box
        id={screenId}
        sx={{
          width: '100%',
          minHeight: '16rem',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          '& canvas': {
            maxWidth: '100%',
            height: 'auto',
            outline: 'none',
          },
        }}
      />
      <Box id={messageId} sx={{ display: 'none' }} />
      <Box id={dumpId} sx={{ display: 'none' }} />
      {connectionState === 'connecting' && (
        <Stack
          className="spice-connecting"
          position="absolute"
          inset={0}
          alignItems="center"
          justifyContent="center"
          spacing={2}
          sx={{ pointerEvents: 'none' }}
        >
          <CircularProgress color="inherit" />
          <Typography color="common.white">Connecting to SPICE…</Typography>
        </Stack>
      )}
    </Box>
  )
}

SpiceDisplay.propTypes = {
  session: PropTypes.shape({
    websocket: PropTypes.string.isRequired,
    password: PropTypes.string,
  }).isRequired,
  onStatusChange: PropTypes.func.isRequired,
}
