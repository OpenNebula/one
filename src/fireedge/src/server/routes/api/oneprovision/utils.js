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

const { v4 } = require('uuid')
const { dirname, basename } = require('path')
// eslint-disable-next-line node/no-deprecated-api
const { parse } = require('url')
const { Document, scalarOptions, stringify } = require('yaml')
const {
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
  mkdirsSync,
  renameSync,
  moveSync,
} = require('fs-extra')
const { getFireedgeConfig, getProvisionConfig } = require('server/utils/yml')
const { messageTerminal } = require('server/utils/general')
const { defaultError } = require('server/utils/server')

/**
 * Create folder with files.
 *
 * @param {string} path - path to create files
 * @param {Array} files - files to create
 * @param {string} filename - return name
 * @returns {object} object with files created
 */
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
      files.forEach((file) => {
        if (file && file.name && file.ext) {
          rtn.files.push({
            name: file.name,
            ext: file.ext,
            path: `${internalPath}/${file.name}.${file.ext}`,
          })
          createTemporalFile(
            internalPath,
            file.ext,
            (file && file.content) || '',
            file.name
          )
        }
      })
    }
  } catch (error) {
    messageTerminal(defaultError(error && error.message))
  }

  return rtn
}

/**
 * Create a temporal file.
 *
 * @param {string} path - path of temporal file
 * @param {string} ext - extension of the temporal file
 * @param {string} content - content of the temporal file
 * @param {string} filename - name of the temporal file
 * @returns {object} if file is created
 */
const createTemporalFile = (
  path = '',
  ext = '',
  content = '',
  filename = ''
) => {
  let rtn
  const name = filename || v4().replace(/-/g, '').toUpperCase()
  const file = `${path}/${name}.${ext}`
  try {
    if (!existsSync(path)) {
      mkdirsSync(path)
    }
    writeFileSync(file, content)
    rtn = { name, path: file }
  } catch (error) {
    messageTerminal(defaultError(error && error.message))
  }

  return rtn
}

/**
 * Parse content of yaml to json.
 *
 * @param {string} content - content yaml
 * @returns {string} data yaml in json
 */
const createYMLContent = (content = '') => {
  let rtn
  try {
    const doc = new Document()
    doc.directivesEndMarker = true
    scalarOptions.str.defaultType = 'QUOTE_SINGLE'
    if (content) {
      doc.contents = content || undefined
    } else {
      doc.contents = undefined
    }
    rtn = stringify(doc.contents)
  } catch (error) {
    messageTerminal(defaultError(error && error.message))
  }

  return rtn
}

/**
 * Rename folder.
 *
 * @param {string} path - path of folder
 * @param {string} name - new name of folder
 * @param {string} type - must be "prepend", "append" or "replace"
 * @param {Function} callback - function that runs before renaming the folder
 * @returns {string} if the folder name was changed
 */
const renameFolder = (path = '', name = '', type = 'replace', callback) => {
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
        if (callback && typeof callback === 'function') {
          callback(path)
        }
        renameSync(internalPath, newPath)
        rtn = newPath
      }
    } catch (error) {
      messageTerminal(defaultError(error && error.message))
    }
  }

  return rtn
}

/**
 * Move file to path.
 *
 * @param {string} path - path of file
 * @param {string} relative - relative path
 * @returns {boolean} check if file is moved
 */
const moveToFolder = (path = '', relative = '/../') => {
  let rtn = false
  if (path && relative) {
    try {
      moveSync(path, `${dirname(path + relative)}/${basename(path)}`)
      rtn = true
    } catch (error) {
      messageTerminal(defaultError(error && error.message))
    }
  }

  return rtn
}

/**
 * Add command optional params from fireedge server config.
 *
 * @returns {Array} command optional params
 */
const addOptionalCreateCommand = () => {
  const optionalCreateCommand = getSpecificConfig(
    'oneprovision_optional_create_command'
  )

  return [optionalCreateCommand].filter(Boolean) // return array position valids, no undefined or nulls
}

/**
 * Get recursive folder from a directory.
 *
 * @param {string} path - path to create files
 * @param {string} finder - finder path
 * @param {boolean} rtn - return of function (recursive)
 * @returns {string} paths
 */
const findRecursiveFolder = (path = '', finder = '', rtn = false) => {
  let search = rtn

  if (path && finder) {
    try {
      const dirs = readdirSync(path)

      dirs.forEach((dir) => {
        const name = `${path}/${dir}`

        if (statSync(name).isDirectory()) {
          if (basename(name) === finder) {
            search = name
          } else {
            search = findRecursiveFolder(name, finder, search)
          }
        }
      })
    } catch (error) {
      messageTerminal(defaultError(error && error.message))
    }
  }

  return search
}

/**
 * Get the xmlrpc connection endpoint.
 *
 * @returns {Array} array endpoint xmlrpc connection
 */
const getEndpoint = () => {
  let rtn = []
  const appConfig = getFireedgeConfig()
  if (appConfig && appConfig.one_xmlrpc) {
    const parseUrl = parse(appConfig.one_xmlrpc)
    const protocol = parseUrl.protocol || ''
    const host = parseUrl.host || ''
    rtn = ['--endpoint', `${protocol}//${host}`]
  }

  return rtn
}

/**
 * Get provision config. (this if for v6.2).
 *
 * @param {string} key - key get
 * @returns {string} value of config item
 */
const getSpecificConfig = (key) => {
  if (!key) return ''

  const provisionConfig = getProvisionConfig()
  if (Object.hasOwnProperty.call(provisionConfig, key)) {
    return provisionConfig[key]
  }
}

const functionRoutes = {
  getEndpoint,
  createYMLContent,
  createTemporalFile,
  createFolderWithFiles,
  renameFolder,
  moveToFolder,
  findRecursiveFolder,
  addOptionalCreateCommand,
  getSpecificConfig,
}

module.exports = functionRoutes
