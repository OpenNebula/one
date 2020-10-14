/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

import React, { useState, useEffect } from 'react'
import io from 'socket.io-client'
import { findStorageData } from 'client/utils'
import constants from 'client/constants'
import { defaultPort } from 'server/utils/constants/defaults'

const { jwtName } = constants

const ENDPOINT = `http://127.0.0.1:${defaultPort}`

const Webconsole = () => {
  const [response, setResponse] = useState({})

  useEffect(() => {
    const socket = io(ENDPOINT, {
      path: '/zeromq',
      query: {
        token: findStorageData(jwtName)
      }
    })
    socket.on('zeroMQ', data => {
      setResponse(data)
    })
  }, [])
  console.log('-->', response)
  return <p />
}
export default Webconsole
