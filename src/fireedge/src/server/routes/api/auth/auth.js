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
const { Map } = require('immutable')
const {
  authenticate,
  getUser,
  getPass,
  setUser,
  setPass,
  setTfaToken,
  setExtended,
  setNext,
  setReq,
  setRes,
  setNodeConnect,
  setDates,
  getRelativeTime,
  connectOpennebula,
  updaterResponse
} = require('./functions')
const { internalServerError } = require('server/utils/constants/http-codes')
const {
  httpMethod,
  defaultMethodLogin
} = require('server/utils/constants/defaults')
const {
  responseOpennebula,
  checkOpennebulaCommand
} = require('server/utils/opennebula')
const { from } = require('server/utils/constants/defaults')

const { POST } = httpMethod

const auth = (req, res, next, connect) => {
  if (req && res && connect) {
    setReq(req)
    setRes(res)
    setNext(next)
    updaterResponse(Map(internalServerError).toObject())
    const getOpennebulaMethod = checkOpennebulaCommand(
      defaultMethodLogin,
      POST
    )
    if (getOpennebulaMethod) {
      setUser(
        (req &&
          from.postBody &&
          req[from.postBody] &&
          req[from.postBody].user) ||
          ''
      )
      setPass(
        (req &&
          from.postBody &&
          req[from.postBody] &&
          req[from.postBody].token) ||
          ''
      )
      setTfaToken(
        (req && req[from.postBody] && req[from.postBody].token2fa) || ''
      )
      setExtended(
        (req && req[from.postBody] && req[from.postBody].extended) || ''
      )
      setNodeConnect(connect)
      if (getUser() && getPass()) {
        setDates()
        const relativeTime = getRelativeTime()
        const oneConnect = connectOpennebula()
        const dataSourceWithExpirateDate = Map(req).toObject()
        // add expire time unix for opennebula creation token
        dataSourceWithExpirateDate[from.postBody].expire = relativeTime
        oneConnect(
          defaultMethodLogin,
          getOpennebulaMethod(dataSourceWithExpirateDate),
          (err, value) => {
            responseOpennebula(updaterResponse, err, value, authenticate, next)
          }
        )
      }
    } else {
      next()
    }
  } else {
    next()
  }
}

const authApi = {
  auth
}
module.exports = authApi
