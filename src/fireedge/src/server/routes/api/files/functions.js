/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
const {
  existsSync,
  mkdirsSync,
  moveSync
} = require('fs-extra')

const {
  defaultEmptyFunction
} = require('server/utils/constants/defaults')

const {
  ok,
  internalServerError,
  badRequest
} = require('server/utils/constants/http-codes')
const { Actions: ActionUser } = require('server/utils/constants/commands/user')
const { httpResponse, checkValidApp, getFiles, existsFile, removeFile } = require('server/utils/server')

const httpBadRequest = httpResponse(badRequest, '', '')
const groupAdministrator = ['0', '1']

/**
 * Check if user is a administrator.
 *
 * @param {*} oneConnection - one connection function
 * @param {*} id - user ID
 * @param {*} success - callback success
 * @param {*} error - callback error
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
    oneConnection(
      ActionUser.USER_INFO,
      [parseInt(id, 10)],
      (err, value) => {
        if (!err && value && value.USER && value.USER.GROUPS && value.USER.GROUPS.ID) {
          let admin = false
          const groups = Array.isArray(value.USER.GROUPS.ID) ? value.USER.GROUPS.ID : [value.USER.GROUPS.ID]
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
      false
    )
  } else {
    error()
  }
}

/**
 * Upload File.
 *
 * @param {object} res - response http
 * @param {Function} next - express stepper
 * @param {string} params - data response http
 * @param {object} userData - user of http request
 */
const upload = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  let rtn = httpBadRequest
  if (
    global.paths.CPI &&
    params &&
    params.app &&
    checkValidApp(params.app) &&
    params.files &&
    userData &&
    userData.id
  ) {
    const pathUserData = `${params.app}/${userData.id}`
    const pathUser = `${global.paths.CPI}/${pathUserData}`
    if (!existsSync(pathUser)) {
      mkdirsSync(pathUser)
    }
    let method = ok
    let message = ''
    const data = []
    for (const file of params.files) {
      if (file && file.originalname && file.path && file.filename) {
        const extFile = extname(file.originalname)
        try {
          const filenameApi = `${pathUserData}/${file.filename}${extFile}`
          const filename = `${pathUser}/${file.filename}${extFile}`
          moveSync(file.path, filename)
          data.push(filenameApi)
        } catch (error) {
          method = internalServerError
          message = error && error.message
          break
        }
      }
    }
    rtn = httpResponse(method, data.length ? data : '', message)
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * List files by user.
 *
 * @param {object} res - response http
 * @param {Function} next - express stepper
 * @param {string} params - data response http
 * @param {object} userData - user of http request
 * @param {Function} oneConnection - one connection XMLRPC
 */
const list = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}, oneConnection = defaultEmptyFunction) => {
  const { user, password, id } = userData
  const rtn = httpBadRequest
  if (
    params &&
    params.app &&
    checkValidApp(params.app) &&
    user &&
    password &&
    id
  ) {
    const oneConnect = oneConnection(user, password)
    checkUserAdmin(
      oneConnect,
      id,
      (admin = false) => {
        let data = []
        let pathUserData = `${params.app}/${id}`
        if (admin) {
          pathUserData = `${params.app}`
        }
        const pathUser = `${global.paths.CPI}/${pathUserData}`
        data = getFiles(pathUser, true).map(
          file => file.replace(`${global.paths.CPI}/`, '')
        )
        res.locals.httpCode = httpResponse(ok, data)
        next()
      },
      () => {
        res.locals.httpCode = internalServerError
        next()
      }
    )
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
 * @param {object} userData - user of http request
 */
const show = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  const rtn = httpBadRequest
  const { file, token } = params
  if (token && file && jwtDecode(token)) {
    if (file) {
      const pathFile = `${global.paths.CPI}/${file}`
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
    }
  } else {
    res.locals.httpCode = rtn
    next()
  }
}

/**
 * Check if user is a file owner.
 *
 * @param {string} file - filename
 * @param {number} id - user id
 * @returns {boolean} - if user is the file owner
 */
const checkFile = (file = '', id = '') => {
  let rtn = false
  if (file) {
    const parsedFile = parse(file)
    if (parsedFile && parsedFile.dir) {
      const splitParsedFile = parsedFile.dir.split(sep)
      if (Array.isArray(splitParsedFile) && checkValidApp(splitParsedFile[0]) && splitParsedFile[1] === id) {
        rtn = true
      }
    }
  }
  return rtn
}

/**
 * Delete File.
 *
 * @param {object} res - response http
 * @param {Function} next - express stepper
 * @param {string} params - data response http
 * @param {object} userData - user of http request
 */
const deleteFile = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  const rtn = httpBadRequest
  if (
    global.paths.CPI &&
    params &&
    params.file &&
    userData &&
    userData.id &&
    checkFile(params.file, userData.id)
  ) {
    const pathFile = `${global.paths.CPI}/${params.file}`
    existsFile(
      pathFile,
      () => {
        res.locals.httpCode = httpResponse(removeFile(pathFile) ? ok : internalServerError, '', '')
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
const update = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  const rtn = httpBadRequest
  if (
    global.paths.CPI &&
    params &&
    params.name &&
    params.files &&
    userData &&
    userData.id &&
    checkFile(params.name, userData.id)
  ) {
    const nameFile = params.name
    const pathFile = `${global.paths.CPI}/${nameFile}`
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
              data = nameFile
            } catch (error) {
              method = internalServerError
              message = error && error.message
              break
            }
          }
        }
        res.locals.httpCode = httpResponse(method, data.length ? data : '', message)
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
  list
}
module.exports = functionRoutes
