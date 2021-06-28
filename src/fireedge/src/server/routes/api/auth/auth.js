/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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
  login,
  getUser,
  getPass,
  setUser,
  setPass,
  setType,
  setTfaToken,
  setExtended,
  setNext,
  setReq,
  setRes,
  setNodeConnect,
  connectOpennebula,
  updaterResponse
} = require('./functions')
const { internalServerError } = require('server/utils/constants/http-codes')
const {
  httpMethod,
  defaultMethodLogin,
  defaultMethodUserInfo
} = require('server/utils/constants/defaults')
const {
  paramsDefaultByCommandOpennebula,
  responseOpennebula,
  checkOpennebulaCommand
} = require('server/utils/opennebula')
const { from } = require('server/utils/constants/defaults')

const { POST, GET } = httpMethod

const auth = (req, res, next, connect) => {
  if (req && res && connect) {
    setReq(req)
    setRes(res)
    setNext(next)
    updaterResponse(new Map(internalServerError).toObject())
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
      setType(
        (req &&
          from.postBody &&
          req[from.postBody] &&
          req[from.postBody].type &&
          req[from.postBody].type.toLowerCase()) ||
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
        const oneConnect = connectOpennebula()
        oneConnect(
          defaultMethodUserInfo,
          paramsDefaultByCommandOpennebula(defaultMethodUserInfo, GET),
          (err, value) => {
            responseOpennebula(updaterResponse, err, value, login, next)
          },
          false
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
