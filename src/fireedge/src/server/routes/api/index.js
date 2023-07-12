/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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

const { env } = require('process')
const multer = require('multer')
const { messageTerminal } = require('server/utils/general')
const { getRequestParameters, getRequestFiles } = require('server/utils/server')
const {
  defaultWebpackMode,
  defaultConfigErrorMessage,
  defaultTmpPath,
} = require('server/utils/constants/defaults')
const { writeInLogger } = require('server/utils/logger')
const { getSunstoneConfig } = require('server/utils/yml')

const appConfig = getSunstoneConfig()
const optsMulter = { dest: appConfig.tmpdir || defaultTmpPath }
if (appConfig && appConfig.max_upload_file_size) {
  optsMulter.limits = { fileSize: appConfig.max_upload_file_size }
}

const upload = multer(optsMulter)

const routes = [
  '2fa',
  'auth',
  'cluster',
  'files',
  'image',
  'marketapp',
  'oneflow',
  'vcenter',
  'vm',
  'zendesk',
  'oneprovision',
  'sunstone',
  'system',
  'support',
  'vdc',
]

const serverRoutes = []

/**
 * Parse files for actions.
 *
 * @param {Array} files - files
 * @returns {Array} files
 */
const parseFiles = (files = []) => {
  let rtn
  if (files && Array.isArray(files)) {
    rtn = {}
    files.forEach((file) => {
      if (file.fieldname) {
        rtn[file.fieldname]
          ? rtn[file.fieldname].push(file)
          : (rtn[file.fieldname] = [file])
      }
    })
  }

  return rtn
}

routes.forEach((file) => {
  try {
    // eslint-disable-next-line global-require
    const fileInfo = require(`./${file}`)

    if (fileInfo && Array.isArray(fileInfo) && fileInfo.length) {
      serverRoutes.push(
        ...fileInfo.map((route) => {
          const { action, params } = route
          if (action) {
            route.action = (req, res, next, oneConnection, oneUser) => {
              const { serverDataSource } = req
              const uploadFiles = getRequestFiles(params)
              if (!(uploadFiles && uploadFiles.length)) {
                return action(
                  res,
                  next,
                  getRequestParameters(params, serverDataSource),
                  oneUser,
                  oneConnection
                )
              }

              /** Request with files */
              const files = upload.array(uploadFiles)
              files(req, res, (err) => {
                if (err) {
                  const errorData = (err && err.message) || ''
                  writeInLogger(errorData)
                  messageTerminal({
                    color: 'red',
                    message: 'Error: %s',
                    error: errorData,
                  })
                }
                serverDataSource.files = parseFiles(req && req.files)

                return action(
                  res,
                  next,
                  getRequestParameters(params, serverDataSource),
                  oneUser,
                  oneConnection
                )
              })
            }
          }

          return route
        })
      )
    }
  } catch (error) {
    if (env.NODE_ENV === defaultWebpackMode) {
      messageTerminal({
        color: 'red',
        message: 'error: %s',
        error,
      })
    }

    if (error instanceof Error && error.code === 'MODULE_NOT_FOUND') {
      const config = defaultConfigErrorMessage
      config.error = error.message
      messageTerminal(config)
    }
  }
})

module.exports = serverRoutes
