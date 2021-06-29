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

const jwt = require('jwt-simple')
const { messageTerminal } = require('./general')

const createToken = (
  { id: iss, user: aud, token: jti },
  iat = '',
  exp = ''
) => {
  let rtn = null
  if (iss && aud && jti && iat && exp && global && global.FIREEDGE_KEY) {
    const payload = {
      iss,
      aud,
      jti,
      iat,
      exp
    }
    rtn = jwt.encode(payload, global.FIREEDGE_KEY)
  }
  return rtn
}

const validateAuth = req => {
  let rtn = false
  if (req && req.headers && req.headers.authorization) {
    const authorization = req.headers.authorization
    const removeBearer = new RegExp('^Bearer ', 'i')
    const token = authorization.replace(removeBearer, '')
    const fireedgeKey = global && global.FIREEDGE_KEY
    if (token && fireedgeKey) {
      try {
        const payload = jwt.decode(token, fireedgeKey)
        if (
          payload &&
          'iss' in payload &&
          'aud' in payload &&
          'jti' in payload &&
          'iat' in payload &&
          'exp' in payload
        ) {
          const { iss, aud, jti, iat, exp } = payload
          rtn = {
            iss,
            aud,
            jti,
            iat,
            exp
          }
        }
      } catch (error) {
      }
    } else {
      const messageError = (!token && 'jwt') || (!fireedgeKey && 'fireedge_key')
      if (messageError) {
        messageTerminal({
          color: 'red',
          message: 'invalid: %s',
          error: messageError
        })
      }
    }
  }
  return rtn
}

module.exports = {
  createToken,
  validateAuth
}
