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
const { dirname, basename } = require('path')
const events = require('events')
const { Document } = require('yaml')
const {
  writeFileSync,
  removeSync,
  readdirSync,
  statSync,
  existsSync,
  mkdirsSync,
  renameSync,
  moveSync
} = require('fs-extra')
const { spawnSync, spawn } = require('child_process')
const { messageTerminal } = require('server/utils/general')

const eventsEmitter = new events.EventEmitter()
const defaultError = (err = '', message = 'Error: %s') => ({
  color: 'red',
  message,
  type: err
})

const publish = (eventName = '', message = {}) => {
  if (eventName && message) {
    eventsEmitter.emit(eventName, message)
  }
}

const subscriber = (eventName = '', callback = () => undefined) => {
  if (eventName &&
    callback &&
    typeof callback === 'function' &&
    eventsEmitter.listenerCount(eventName) < 1
  ) {
    eventsEmitter.on(
      eventName,
      message => {
        callback(message)
      }
    )
  }
}

const getFiles = (dir = '', ext = '', errorCallback = () => undefined) => {
  const pathFiles = []
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
      const errorMsg = (error && error.message) || ''
      messageTerminal(defaultError(errorMsg))
      errorCallback(errorMsg)
    }
  }
  return pathFiles
}

const createFolderWithFiles = (path = '', files = [], filename = '') => {
  const rtn = { name: '', files: [] }
  const name = filename || v4().replace(/-/g, '').toUpperCase()
  const internalPath = `${path}/${name}`
  try {
    if (!existsSync(internalPath)) {
      mkdirsSync(internalPath)
    }
    rtn.name = name
    if (files && Array.isArray(files)) {
      files.forEach(file => {
        if (file && file.name && file.ext) {
          const filePath = `${internalPath}/${file.name}.${file.ext}`
          rtn.files.push({ name: file.name, ext: file.ext, path: filePath })
          writeFileSync(filePath, (file && file.content) || '')
        }
      })
    }
  } catch (error) {
    messageTerminal(defaultError((error && error.message) || ''))
  }
  return rtn
}

const createTemporalFile = (path = '', ext = '', content = '') => {
  let rtn
  const name = v4().replace(/-/g, '').toUpperCase()
  const file = `${path}/${name}.${ext}`
  try {
    if (!existsSync(path)) {
      mkdirsSync(path)
    }
    writeFileSync(file, content)
    rtn = { name, path: file }
  } catch (error) {
    messageTerminal(defaultError((error && error.message) || ''))
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
      messageTerminal(defaultError((error && error.message) || ''))
    }
  }
  return rtn
}

const removeFile = (path = '') => {
  if (path) {
    try {
      removeSync(path, { force: true })
    } catch (error) {
      messageTerminal(defaultError((error && error.message) || ''))
    }
  }
}

const renameFolder = (path = '', name = '', type = 'replace') => {
  let rtn = false
  if (path) {
    let internalPath = path
    try {
      if (statSync(path).isFile()) {
        internalPath = dirname(path)
      }
      if (name && type && ['replace', 'prepend', 'append'].includes(type)) {
        const base = dirname(internalPath)
        let newPath = `${base}/${name}`
        switch (type) {
          case 'prepend':
            newPath = `${base}/${name + basename(internalPath)}`
            break
          case 'append':
            newPath = `${base}/${basename(internalPath) + name}`
            break
          default:
            break
        }
        renameSync(internalPath, newPath)
        rtn = newPath
      }
    } catch (error) {
      messageTerminal(defaultError((error && error.message) || ''))
    }
  }
  return rtn
}

const moveToFolder = (path = '', relative = '/../') => {
  let rtn = false
  if (path && relative) {
    try {
      moveSync(path, `${dirname(path + relative)}/${basename(path)}`)
      rtn = true
    } catch (error) {
      messageTerminal(defaultError((error && error.message) || ''))
    }
  }
  return rtn
}

const executeCommandAsync = (
  command = '',
  resource = '',
  callbacks = {
    err: () => undefined,
    out: () => undefined,
    close: () => undefined
  }
) => {
  const err = callbacks && callbacks.err && typeof callbacks.err === 'function' ? callbacks.err : () => undefined
  const out = callbacks && callbacks.out && typeof callbacks.out === 'function' ? callbacks.out : () => undefined
  const close = callbacks && callbacks.close && typeof callbacks.close === 'function' ? callbacks.close : () => undefined

  const rsc = Array.isArray(resource) ? resource : [resource]

  const execute = spawn(command, [...rsc])
  if (execute) {
    execute.stdout.on('data', (data) => {
      out(data)
    })

    execute.stderr.on('data', (data) => {
      err(data)
    })

    execute.on('error', error => {
      messageTerminal(defaultError((error && error.message) || '', 'Error command: %s'))
    })

    execute.on('close', (code) => {
      if (close) {
        // code === 0 is success command
        close(code === 0)
      }
    })
  }

}

const executeCommand = (command = '', resource = '') => {
  const rsc = Array.isArray(resource) ? resource : [resource]
  let rtn = { success: false, data: null }
  const execute = spawnSync(command, [...rsc])
  if (execute) {
    if (execute.stdout) {
      rtn = { success: true, data: execute.stdout.toString() }
    }
    if (execute.stderr && execute.stderr.length > 0) {
      rtn = { success: false, data: execute.stderr.toString() }
      messageTerminal(defaultError(execute.stderr.toString(), 'Error command: %s'))
    }
  }
  return rtn
}

const findRecursiveFolder = (path = '', finder = '', rtn = false) => {
  if (path && finder) {
    const dirs = readdirSync(path)
    dirs.forEach(dir => {
      const name = `${path}/${dir}`
      if (statSync(name).isDirectory()) {
        if (basename(name) === finder) {
          rtn = name
          return
        } else {
          rtn = findRecursiveFolder(name, finder, rtn)
        }
      }
    })
  }
  return rtn
}

const functionRoutes = {
  createYMLContent,
  executeCommand,
  createTemporalFile,
  createFolderWithFiles,
  removeFile,
  renameFolder,
  moveToFolder,
  getFiles,
  executeCommandAsync,
  findRecursiveFolder,
  publish,
  subscriber
}

module.exports = functionRoutes
