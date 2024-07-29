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
const { resolve, extname, parse, sep } = require('path')
const { global } = require('window-or-global')
const { jwtDecode } = require('server/utils/jwt')
const { existsSync, mkdirsSync, moveSync } = require('fs-extra')

const { defaults, httpCodes } = require('server/utils/constants')

const { Actions: ActionUser } = require('server/utils/constants/commands/user')

const {
  httpResponse,
  checkValidApp,
  getFiles,
  existsFile,
  removeFile,
} = require('server/utils/server')

const { defaultEmptyFunction } = defaults

const { ok, internalServerError, badRequest } = httpCodes

const httpBadRequest = httpResponse(badRequest, '', '')
const groupAdministrator = ['0']

/**
 * Check if user is a administrator.
 *
 * @param {Function} oneConnection - one connection function
 * @param {string} id - user ID
 * @param {Function} success - callback success
 * @param {Function} error - callback error
 */
const checkUserAdmin = (
  oneConnection = defaultEmptyFunction,
  id = '',
  success = defaultEmptyFunction,
  error = defaultEmptyFunction
) => {
  if (
    typeof oneConnection === 'function' &&
    id &&
    typeof success === 'function' &&
    typeof error === 'function'
  ) {
    oneConnection({
      action: ActionUser.USER_INFO,
      parameters: [parseInt(id, 10)],
      callback: (err, value) => {
        if (
          !err &&
          value &&
          value.USER &&
          value.USER.GROUPS &&
          value.USER.GROUPS.ID
        ) {
          let admin = false
          const groups = Array.isArray(value.USER.GROUPS.ID)
            ? value.USER.GROUPS.ID
            : [value.USER.GROUPS.ID]
          for (const group of groups) {
            if (groupAdministrator.includes(group)) {
              admin = true
              break
            }
          }
          success(admin)
        } else {
          error(err)
        }
      },
      fillHookResource: false,
    })
  } else {
    error()
  }
}
/**
 * Parse File path.
 *
 * @param {string} file - filename
 * @returns {Array | undefined} - if user is the file owner
 */
const parseFilePath = (file = '') => {
  const parsedFile = parse(file)
  if (parsedFile && parsedFile.dir) {
    return parsedFile.dir.split(sep)
  }
}

/**
 * Check if file no have owner, but have app.
 *
 * @param {string} file - filename
 * @returns {boolean} - if user is the file owner
 */
const validateFileWithoutOwner = (file = '') => {
  const parsedFile = parseFilePath(file)

  return (
    Array.isArray(parsedFile) &&
    parsedFile[0] &&
    checkValidApp(parsedFile[0]) &&
    !parsedFile[1]
  )
}

/**
 * Check if user is a file owner.
 *
 * @param {string} file - filename
 * @param {number} id - user id
 * @returns {boolean} - if user is the file owner
 */
const validateFileWithOwner = (file = '', id = '') => {
  const parsedFile = parseFilePath(file)

  return (
    Array.isArray(parsedFile) &&
    parsedFile[0] &&
    checkValidApp(parsedFile[0]) &&
    parsedFile[1] &&
    parsedFile[1] === id
  )
}

/**
 * Upload File.
 *
 * @param {object} res - response http
 * @param {Function} next - express stepper
 * @param {string} params - data response http
 * @param {object} userData - user of http request
 * @param {Function} oneConnection - xmlrpc connection
 */
const upload = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  const { app, files, public: publicFile } = params
  const { id, user, password } = userData
  if (
    !(
      global.paths.CPI &&
      app &&
      checkValidApp(app) &&
      files &&
      id &&
      user &&
      password
    )
  ) {
    res.locals.httpCode = httpBadRequest
    next()
  }

  const oneConnect = oneConnection(user, password)
  checkUserAdmin(
    oneConnect,
    id,
    (admin = false) => {
      const pathUserData = publicFile && admin ? `${app}` : `${app}${sep}${id}`
      const pathUser = `${global.paths.CPI}${sep}${pathUserData}`
      if (!existsSync(pathUser)) {
        mkdirsSync(pathUser)
      }
      let method = ok
      let message = ''
      const data = []
      for (const file of files) {
        if (file && file.originalname && file.path && file.filename) {
          const extFile = extname(file.originalname)
          try {
            const filenameApi = `${pathUserData}${sep}${file.filename}${extFile}`
            const filename = `${pathUser}${sep}${file.filename}${extFile}`
            moveSync(file.path, filename)
            data.push(filenameApi)
          } catch (error) {
            method = internalServerError
            message = error && error.message
            break
          }
        }
      }
      res.locals.httpCode = httpResponse(
        method,
        data.length ? data : '',
        message
      )
      next()
    },
    () => {
      res.locals.httpCode = internalServerError
      next()
    }
  )
}

/**
 * Get default files for app.
 *
 * @param {string} app - app
 * @param {boolean} multiple - find multiple files
 * @param {string} defaultFile - default file
 * @returns {Array | string} - file
 */
const getDefaultFilesforApps = (
  app = '',
  multiple = false,
  defaultFile = ''
) => {
  let rtn = ''
  switch (app) {
    case 'sunstone':
      if (global.paths.SUNSTONE_IMAGES) {
        const path = global.paths.SUNSTONE_IMAGES
        if (multiple) {
          rtn = getFiles(path, true).map((file) =>
            file.replace(`${path}${sep}`, '')
          )
        } else {
          rtn = `${path}${sep}${defaultFile}`
        }
      }
      break
    case 'provision':
      break
    default:
      break
  }

  return rtn
}

/**
 * List files by user.
 *
 * @param {object} res - response http
 * @param {Function} next - express stepper
 * @param {string} params - data response http
 * @param {object} userData - user of http request
 */
const list = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password, id } = userData
  const { app } = params
  const rtn = httpBadRequest
  if (app && checkValidApp(app) && user && password && id) {
    const path = `${global.paths.CPI}${sep}`
    const userPath = `${app}${sep}${id}`

    let data = []

    // get defaulf files for app
    data = data.concat(getDefaultFilesforApps(app, true))

    // find root files
    const rootPath = `${path}${app}`
    data = data.concat(
      getFiles(rootPath, false).map((file) => file.replace(path, ''))
    )

    // find user files
    const pathUser = `${path}${userPath}`
    data = data.concat(
      getFiles(pathUser, true).map((file) => file.replace(path, ''))
    )
    res.locals.httpCode = httpResponse(ok, data)
    next()
  } else {
    res.locals.httpCode = rtn
    next()
  }
}

/**
 * Show file.
 *
 * @param {object} res - response http
 * @param {Function} next - express stepper
 * @param {string} params - data response http
 */
const show = (res = {}, next = defaultEmptyFunction, params = {}) => {
  const rtn = httpBadRequest
  const { file, token, app } = params
  const userData = jwtDecode(token)
  if (token && file && app && checkValidApp(app) && userData) {
    let pathFile = getDefaultFilesforApps(app, false, file)
    if (
      validateFileWithOwner(file, userData.iss) ||
      validateFileWithoutOwner(file)
    ) {
      pathFile = `${global.paths.CPI}${sep}${file}`
    }
    existsFile(
      pathFile,
      () => {
        res.locals.httpCode = httpResponse(ok, '', '', resolve(pathFile))
        next()
      },
      () => {
        res.locals.httpCode = httpResponse(internalServerError, '', '')
        next()
      }
    )
  } else {
    res.locals.httpCode = rtn
    next()
  }
}

/**
 * Delete File.
 *
 * @param {object} res - response http
 * @param {Function} next - express stepper
 * @param {string} params - data response http
 * @param {object} userData - user of http request
 */
const deleteFile = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { file } = params
  const { id } = userData
  const rtn = httpBadRequest
  if (global.paths.CPI && file && id && validateFileWithOwner(file, id)) {
    const pathFile = `${global.paths.CPI}${sep}${file}`
    existsFile(
      pathFile,
      () => {
        res.locals.httpCode = httpResponse(
          removeFile(pathFile) ? ok : internalServerError,
          '',
          ''
        )
        next()
      },
      () => {
        res.locals.httpCode = httpResponse(internalServerError, '', '')
        next()
      }
    )
  } else {
    res.locals.httpCode = rtn
    next()
  }
}

/**
 * Update File.
 *
 * @param {object} res - response http
 * @param {Function} next - express stepper
 * @param {string} params - data response http
 * @param {object} userData - user of http request
 */
const update = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const rtn = httpBadRequest
  const { files, name } = params
  const { id } = userData
  if (
    global.paths.CPI &&
    name &&
    files &&
    id &&
    validateFileWithOwner(name, id)
  ) {
    const pathFile = `${global.paths.CPI}${sep}${name}`
    existsFile(
      pathFile,
      () => {
        let method = ok
        let data = ''
        let message = ''
        for (const file of params.files) {
          if (file && file.originalname && file.path && file.filename) {
            try {
              moveSync(file.path, pathFile, { overwrite: true })
              data = name
            } catch (error) {
              method = internalServerError
              message = error && error.message
              break
            }
          }
        }
        res.locals.httpCode = httpResponse(
          method,
          data.length ? data : '',
          message
        )
        next()
      },
      () => {
        res.locals.httpCode = httpResponse(internalServerError, '', '')
        next()
      }
    )
  } else {
    res.locals.httpCode = rtn
    next()
  }
}

const functionRoutes = {
  upload,
  deleteFile,
  update,
  show,
  list,
}
module.exports = functionRoutes
