/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { Client, Tunnel, WebSocketTunnel } from 'guacamole-common-js'
import { RefObject, useEffect, useRef, useState } from 'react'

import {
  GUACAMOLE_STATES_STR,
  GuacamoleSession, // eslint-disable-line no-unused-vars
  SOCKETS,
  T,
} from '@ConstantsModule'
import {
  useGeneralApi,
  useGuacamole,
  useGuacamoleApi,
  useSystemData,
} from '@FeaturesModule'
import { clientStateToString, getConnectString } from '@ModelsModule'
import { fakeDelay } from '@UtilsModule'

const {
  CONNECTING,
  CONNECTED,
  DISCONNECTING,
  DISCONNECTED,
  CLIENT_ERROR,
  TUNNEL_ERROR,
} = GUACAMOLE_STATES_STR

// eslint-disable-next-line jsdoc/valid-types
/**
 * @typedef {GuacamoleSession & {
 * handleConnect: Function,
 * handleDisconnect: Function,
 * handleReconnect: function():Promise,
 * }} GuacamoleClientType
 */

/**
 * @param {object} options - Client options
 * @param {string} options.id - Session includes type and VM id. Eg: '6-vnc'
 * @param {RefObject} options.display - Session display. Only exists if display plugins is enabled
 * @param {string} options.zone - zone id
 * @param {boolean} options.externalZone - is a external zone
 * @returns {GuacamoleClientType} Guacamole client props
 */
const GuacamoleClient = ({ id, display, zone, externalZone }) => {
  const { oneConfig } = useSystemData()
  let rangeports
  if (oneConfig?.VNC_PORTS) {
    const lastPort = oneConfig.VNC_PORTS.RESERVED
      ? oneConfig.VNC_PORTS.RESERVED.split(':')[1]
      : '65535'
    const startPort = oneConfig.VNC_PORTS.START
      ? oneConfig.VNC_PORTS.START
      : '5900'
    rangeports = `${startPort}:${lastPort}`
  }

  const [changeConnection, setChangeConnection] = useState(false)
  const firstZone = useRef(zone).current
  const guac = useRef(createGuacamoleClient(externalZone))
  const displayRef = useRef(null)

  if (`${firstZone}` !== `${zone}` && !changeConnection) {
    guac.current = createGuacamoleClient(externalZone)
    setChangeConnection(true)
  }

  const { enqueueError, enqueueInfo, enqueueSuccess } = useGeneralApi()
  const { token, ...session } = useGuacamole(id)
  const { setConnectionState, setTunnelUnstable, setMultiTouchSupport } =
    useGuacamoleApi(id)

  const handleConnect = ({
    width,
    height,
    force = false,
    readOnly = false,
    command,
    colorSchema,
    fontName,
    fontSize,
  } = {}) => {
    if (!session?.isUninitialized && !session.isDisconnected && !force) return

    const options = { token, display, width, height }

    zone && (options.zone = zone)
    readOnly && (options['read-only'] = true)
    command && (options.command = command)
    colorSchema && (options['color-schema'] = colorSchema)
    fontName && (options['font-name'] = fontName)
    fontSize && (options['font-size'] = fontSize)
    rangeports && (options.rangeports = rangeports)

    const connectString = getConnectString(options)

    guac.current.client.connect(connectString)
  }

  const handleDisconnect = () => {
    try {
      guac.current.client?.disconnect()
    } catch {}
  }

  const handleReconnect = async (params = {}) => {
    session?.isConnected && handleDisconnect()

    // sleep to avoid quick reconnection
    await fakeDelay(1500)
    handleConnect(params)
  }

  useEffect(() => {
    guac.current.tunnel.onerror = (status) => {
      setConnectionState({ state: TUNNEL_ERROR, statusCode: status.code })
    }

    guac.current.tunnel.onstatechange = (state) => {
      ;({
        [Tunnel.State.CONNECTING]: () => {
          setConnectionState({ state: CONNECTING })
        },
        [Tunnel.State.OPEN]: () => {
          setTunnelUnstable({ unstable: false })
        },
        [Tunnel.State.UNSTABLE]: () => {
          setTunnelUnstable({ unstable: true })
        },
        [Tunnel.State.CLOSED]: () => {
          setConnectionState({ state: DISCONNECTED })
        },
      }[state]?.())
    }

    guac.current.client.onstatechange = (state) => {
      const stateString = clientStateToString(state)
      const isDisconnect = [DISCONNECTING, DISCONNECTED].includes(stateString)
      const isDisconnected = DISCONNECTED === stateString
      const isConnected = CONNECTED === stateString

      isConnected && enqueueSuccess(T.SuccessConnectionEstablished)
      isDisconnected && enqueueInfo(T.InfoDisconnected)

      !isDisconnect && setConnectionState({ state: stateString })
    }

    guac.current.client.onerror = (status) => {
      enqueueError(status.message)
      setConnectionState({ state: CLIENT_ERROR, statusCode: status.code })
    }

    guac.current.client.onmultitouch = (layer, touches) => {
      setMultiTouchSupport({ touches })
    }

    return () => {
      handleDisconnect()
    }
  }, [id, zone, externalZone, changeConnection])

  useEffect(() => {
    session?.isError && handleDisconnect()
  }, [session?.isError])

  useEffect(() => {
    !session.isConnected && handleConnect()
  }, [token])

  return {
    token,
    displayRef,
    ...session,
    ...guac.current,
    handleReconnect,
  }
}

const createGuacamoleClient = (externalZone) => {
  const { protocol, host } = window.location
  const websocketProtocol = protocol === 'https:' ? 'wss:' : 'ws:'
  const endpoint = externalZone ? SOCKETS.EXTERNAL_GUACAMOLE : SOCKETS.GUACAMOLE
  const guacamoleWs = `${websocketProtocol}//${host}/fireedge/${endpoint}`

  const tunnel = new WebSocketTunnel(guacamoleWs)
  const client = new Client(tunnel)

  return { client, tunnel }
}

export default GuacamoleClient
