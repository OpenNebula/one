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
const { v4 } = require('uuid')
const { Document } = require('yaml')
const { writeFileSync, removeSync, readdirSync, statSync } = require('fs-extra')
const { spawnSync } = require('child_process')
const { messageTerminal } = require('server/utils/general')

const pathFiles = []

const getFiles = (dir = '', ext = '') => {
  if (dir && ext) {
    const exp = new RegExp('\\w*\\.' + ext + '+$\\b', 'gi')
    try {
      const files = readdirSync(dir)
      files.forEach(file => {
        const name = `${dir}/${file}`
        if (statSync(name).isDirectory()) {
          getFiles(name)
        } else {
          if (name.match(exp)) {
            pathFiles.push(name)
          }
        }
      })
    } catch (error) {
      const config = {
        color: 'red',
        message: 'Error: %s',
        type: (error && error.message) || ''
      }
      messageTerminal(config)
    }
  }
  return pathFiles
}

const createTemporalFile = (path = '', ext = '', content = '') => {
  let rtn
  const filename = `${path + v4().replace(/-/g, '').toUpperCase() + ext}`
  try {
    writeFileSync(filename, content)
    rtn = filename
  } catch (error) {
    const config = {
      color: 'red',
      message: 'Error: %s',
      type: (error && error.message) || ''
    }
    messageTerminal(config)
  }
  return rtn
}

const createYMLContent = (content = '') => {
  let rtn
  if (content) {
    try {
      const doc = new Document({})
      doc.directivesEndMarker = true
      doc.contents = content
      rtn = doc
    } catch (error) {
      const config = {
        color: 'red',
        message: 'Error: %s',
        type: (error && error.message) || ''
      }
      messageTerminal(config)
    }
  }
  return rtn
}

const removeFile = (path = '') => {
  if (path) {
    try {
      removeSync(path, { force: true })
    } catch (error) {
      const config = {
        color: 'red',
        message: 'Error: %s',
        type: (error && error.message) || ''
      }
      messageTerminal(config)
    }
  }
}

const executeCommand = (command = '', resource = '') => {
  const rsc = Array.isArray(resource) ? resource : [resource]
  const rtn = { success: false, data: null }
  const execute = spawnSync(command, [...rsc])
  if (execute) {
    if (execute.stdout) {
      rtn.success = true
      rtn.data = execute.stdout.toString()
    }
    if (execute.stderr && execute.stderr.length > 0) {
      rtn.data = execute.stderr.toString()
      const config = {
        color: 'red',
        message: 'Error command: %s',
        type: execute.stderr.toString()
      }
      messageTerminal(config)
    }
  }
  return rtn
}

const functionRoutes = {
  createYMLContent,
  executeCommand,
  createTemporalFile,
  removeFile,
  getFiles
}

module.exports = functionRoutes
