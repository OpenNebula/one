/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
const {
  genPathResources,
  getRequestParameters,
  getRequestFiles,
  removeFile,
} = require('server/utils/server')
const {
  defaultWebpackMode,
  defaultConfigErrorMessage,
  defaultTmpPath,
  from: fromData,
} = require('server/utils/constants/defaults')
const { writeInLogger } = require('server/utils/logger')
const { getSunstoneConfig } = require('server/utils/yml')

genPathResources()
const { postBody } = fromData

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
  'host',
  'files',
  'image',
  'logo',
  'marketapp',
  'oneflow',
  'vm',
  'vmpool',
  'zendesk',
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
                  oneConnection,
                  req
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
                serverDataSource[postBody] = req.body

                const isImageUpload =
                  req.files &&
                  req.files.length &&
                  route?.path === '/image/upload'
                const uploadedFiles = isImageUpload
                  ? req.files.map((uploadedFile) => ({
                      path: uploadedFile?.path,
                      destination: uploadedFile?.destination,
                    }))
                  : []

                if (!isImageUpload && req.files && req.files.length) {
                  req.files.forEach((requestFile) => {
                    try {
                      if (
                        requestFile?.path &&
                        requestFile?.destination === optsMulter.dest
                      ) {
                        removeFile(requestFile.path)
                      }
                    } catch {}
                  })
                }

                action(
                  res,
                  next,
                  getRequestParameters(params, serverDataSource),
                  oneUser,
                  oneConnection,
                  req
                )

                if (isImageUpload) {
                  res.once('finish', () => {
                    const fileToCleanup = uploadedFiles.find(
                      (uploadFile) =>
                        uploadFile?.path &&
                        uploadFile?.destination === optsMulter.dest
                    )?.path

                    if (!fileToCleanup) return

                    const oneConnect = oneConnection(
                      oneUser.user,
                      oneUser.password
                    )
                    let attempts = 0
                    const maxAttempts = 120

                    const poll = () => {
                      attempts += 1

                      oneConnect({
                        action: 'imagepool.info',
                        parameters: [-2, -1, -1],
                        callback: (_err, result) => {
                          if (_err) {
                            if (attempts >= maxAttempts) {
                              try {
                                removeFile(fileToCleanup)
                              } catch {}
                            } else {
                              setTimeout(poll, 1000)
                            }

                            return
                          }

                          try {
                            const xml = typeof result === 'string' ? result : ''
                            const fileInUse = xml.includes(
                              `<PATH>${fileToCleanup}</PATH>`
                            )

                            if (fileInUse) {
                              const imageMatch = xml.match(
                                new RegExp(
                                  `<IMAGE>.*?<PATH>${fileToCleanup.replace(
                                    /[.*+?^${}()|[\]\\]/g,
                                    '\\$&'
                                  )}</PATH>.*?<STATE>(\\d+)</STATE>.*?</IMAGE>`,
                                  's'
                                )
                              )
                              const state = imageMatch
                                ? parseInt(imageMatch[1], 10)
                                : undefined

                              if (state !== 4) {
                                try {
                                  removeFile(fileToCleanup)
                                } catch {}

                                return
                              }
                            } else {
                              try {
                                removeFile(fileToCleanup)
                              } catch {}

                              return
                            }
                          } catch {
                            try {
                              removeFile(fileToCleanup)
                            } catch {}

                            return
                          }

                          if (attempts < maxAttempts) {
                            setTimeout(poll, 1000)
                          } else {
                            try {
                              removeFile(fileToCleanup)
                            } catch {}
                          }
                        },
                        fillHookResource: false,
                        parseXML: false,
                      })
                    }

                    setTimeout(poll, 2000)
                  })
                }
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
