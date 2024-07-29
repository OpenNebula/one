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
import { useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import WMKS from 'opennebula-wmks'

import { isDevelopment } from 'client/utils'
import { SOCKETS } from 'client/constants'

const ERROR = 'Error'
const UNINITIALIZED = 'Uninitialized'
const CONNECTED = 'Connected'

const compareStrings = (a, b) =>
  `${a}`.toLocaleLowerCase() === `${b}`.toLocaleLowerCase()

/**
 * @param {object} options - Client options
 * @param {string} options.token - Session token
 * @returns {{
 * status: string,
 * wmks: object,
 * handleReconnect: Function
 * }} WebMKS client props
 */
const WebMKSClient = ({ token }) => {
  const wmks = useRef({})
  const [status, setStatus] = useState(UNINITIALIZED)

  const handleConnect = () => {
    try {
      if (!token) return

      isDevelopment() && console.log(`connect VMRC  🔵`)
      wmks.current?.connect(createWebsocketClient(token))
      updateLayout()
    } catch {}
  }

  const handleDisconnect = () => {
    try {
      isDevelopment() && console.log(`disconnect VMRC 🔴`)
      wmks.current?.disconnect()
    } catch {}
  }

  const updateLayout = () => {
    !wmks.current?.isFullScreen() && wmks.current?.updateScreen()
  }

  useEffect(() => {
    if (!token || status !== UNINITIALIZED) return

    wmks.current = WMKS.createWMKS('wmksContainer', {})
      .register(
        WMKS.CONST.Events.CONNECTION_STATE_CHANGE,
        (_, { state = 'Not state' } = {}) => setStatus(state)
      )
      .register(WMKS.CONST.Events.ERROR, (_, data) => {
        isDevelopment() && console.log('VMRC Error: ' + data.errorType)
        setStatus(ERROR)
      })
      .register(WMKS.CONST.Events.REMOTE_SCREEN_SIZE_CHANGE, updateLayout)
    // .register(WMKS.CONST.Events.COPY, console.log)
    // .register(WMKS.CONST.Events.KEYBOARD_LEDS_CHANGE, console.log)

    window.addEventListener('resize', updateLayout)
    handleConnect()

    return () => {
      handleDisconnect()
      wmks?.current?.unregister()
      window.removeEventListener('resize', updateLayout)
    }
  }, [token])

  return {
    wmks: wmks.current,
    status,
    isUninitialized: compareStrings(status, UNINITIALIZED),
    isError: compareStrings(status, ERROR),
    isConnected: compareStrings(status, CONNECTED),
    displayElement: (
      <Box
        sx={{
          backgroundColor: '#222431',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          placeContent: 'center',
        }}
      >
        <Box
          id="wmksContainer"
          position="relative"
          height={1}
          width={1}
          my="1em"
        />
      </Box>
    ),
  }
}

const createWebsocketClient = (token) => {
  const { protocol, host } = window.location
  const websocketProtocol = protocol === 'https:' ? 'wss:' : 'ws:'

  return `${websocketProtocol}//${host}/fireedge/${SOCKETS.VMRC}/${token}`
}

WebMKSClient.propTypes = {
  token: PropTypes.string,
}

export default WebMKSClient
