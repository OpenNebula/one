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
import { useRef, useEffect, RefObject } from 'react'
import { WebSocketTunnel, Tunnel, Client } from 'guacamole-common-js'

import { useGeneralApi } from 'client/features/General'
import { useGuacamole, useGuacamoleApi } from 'client/features/Guacamole'
import { getConnectString, clientStateToString } from 'client/models/Guacamole'
import { fakeDelay, isDevelopment } from 'client/utils'
import {
  GuacamoleSession, // eslint-disable-line no-unused-vars
  SOCKETS,
  GUACAMOLE_STATES_STR,
  T,
} from 'client/constants'

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
 * @returns {GuacamoleClientType} Guacamole client props
 */
const GuacamoleClient = ({ id, display }) => {
  const guac = useRef(createGuacamoleClient()).current

  // Automatically update the client thumbnail
  // guac.client.onsync = () => handleUpdateThumbnail()

  const { enqueueError, enqueueInfo, enqueueSuccess } = useGeneralApi()
  const { token, ...session } = useGuacamole(id)
  const {
    setConnectionState,
    setTunnelUnstable,
    setMultiTouchSupport,
    // updateThumbnail,
  } = useGuacamoleApi(id)

  const handleConnect = (width, height, force = false) => {
    if (!session?.isUninitialized && !session.isDisconnected && !force) return

    isDevelopment() && console.log(`connect ${id}  🔵`)

    const options = { token, display, width, height }
    const connectString = getConnectString(options)

    guac.client.connect(connectString)
  }

  const handleDisconnect = () => {
    try {
      isDevelopment() && console.log(`disconnect ${id}  🔴`)
      guac.client?.disconnect()
    } catch {}
  }

  const handleReconnect = async (width, height) => {
    session?.isConnected && handleDisconnect()

    // sleep to avoid quick reconnection
    await fakeDelay(1500)
    handleConnect(width, height, true)
  }

  /**
   * Store the thumbnail of the given managed client within the connection
   * history under its associated ID. If the client is not connected, this
   * function has no effect.
   */
  /* const handleUpdateThumbnail = () => {
    const nowTimestamp = new Date().getTime()
    const lastTimestamp = session?.thumbnail?.timestamp

    if (
      lastTimestamp &&
      nowTimestamp - lastTimestamp < THUMBNAIL_UPDATE_FREQUENCY
    )
      return

    const clientDisplay = guac.client?.getDisplay()

    if (clientDisplay?.getWidth() <= 0 || clientDisplay?.getHeight() <= 0)
      return

    // Get screenshot
    const canvas = clientDisplay.flatten()

    // Calculate scale of thumbnail (max 320x240, max zoom 100%)
    const scale = Math.min(320 / canvas.width, 240 / canvas.height, 1)

    // Create thumbnail canvas
    const thumbnail = document.createElement('canvas')
    thumbnail.width = canvas.width * scale
    thumbnail.height = canvas.height * scale

    // Scale screenshot to thumbnail
    const context = thumbnail.getContext('2d')
    context.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      0,
      0,
      thumbnail.width,
      thumbnail.height
    )

    thumbnail.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const newThumbnail = { timestamp: nowTimestamp, canvas: url }
      updateThumbnail({ thumbnail: newThumbnail })
    }, 'image/webp')
  } */

  useEffect(() => {
    guac.tunnel.onerror = (status) => {
      setConnectionState({ state: TUNNEL_ERROR, statusCode: status.code })
    }

    guac.tunnel.onstatechange = (state) => {
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

    guac.client.onstatechange = (state) => {
      const stateString = clientStateToString(state)
      const isDisconnect = [DISCONNECTING, DISCONNECTED].includes(stateString)
      const isDisconnected = DISCONNECTED === stateString
      const isConnected = CONNECTED === stateString

      isConnected && enqueueSuccess(T.SuccessConnectionEstablished)
      isDisconnected && enqueueInfo(T.InfoDisconnected)

      !isDisconnect && setConnectionState({ state: stateString })
    }

    guac.client.onerror = (status) => {
      enqueueError(status.message)
      setConnectionState({ state: CLIENT_ERROR, statusCode: status.code })
    }

    guac.client.onmultitouch = (layer, touches) => {
      setMultiTouchSupport({ touches })
    }

    return () => {
      handleDisconnect()
    }
  }, [id])

  useEffect(() => {
    session?.isError && handleDisconnect()
  }, [session?.isError])

  useEffect(() => {
    !session.isConnected && handleConnect()
  }, [token])

  return { token, ...session, ...guac, handleReconnect }
}

const createGuacamoleClient = () => {
  const { protocol, host } = window.location
  const websocketProtocol = protocol === 'https:' ? 'wss:' : 'ws:'
  const guacamoleWs = `${websocketProtocol}//${host}/fireedge/${SOCKETS.GUACAMOLE}`

  const tunnel = new WebSocketTunnel(guacamoleWs)
  const client = new Client(tunnel)

  return { client, tunnel }
}

export default GuacamoleClient
