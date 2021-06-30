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

const { env } = require('process')
const { parse } = require('yaml')
const { defaultConfigFile, defaultWebpackMode } = require('./constants/defaults')
const { existsFile } = require('server/utils/server')
const { messageTerminal } = require('server/utils/general')

const getConfig = () => {
  const path = env && env.NODE_ENV === defaultWebpackMode
    ? `${__dirname}/../../../etc/${defaultConfigFile}`
    : global.FIREEDGE_CONFIG

  let rtn = {}

  if (path) {
    existsFile(path, filedata => {
      rtn = parse(filedata)
    }, err => {
      const config = {
        color: 'red',
        message: 'Error: %s',
        error: err.message || ''
      }
      messageTerminal(config)
    })
  }
  return rtn
}

module.exports = {
  getConfig
}
