/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
const { extname, isAbsolute, relative, resolve, sep } = require('path')
const { global } = require('window-or-global')
const {
  existsSync,
  mkdirsSync,
  moveSync,
  realpathSync,
  statSync,
} = require('fs-extra')

const { defaults, httpCodes } = require('server/utils/constants')

const { Actions: ActionUser } = require('server/utils/constants/commands/user')

const {
  httpResponse,
  checkValidApp,
  getFiles,
  removeFile,
} = require('server/utils/server')

const { defaultEmptyFunction } = defaults

const { ok, internalServerError, badRequest, notFound } = httpCodes

const httpBadRequest = httpResponse(badRequest, '', '')
const httpNotFound = httpResponse(notFound, '', '')
const groupAdministrator = ['0']

const isOutsideRoot = (path = '') =>
  path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path)

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
 * Resolve an existing file without allowing it to escape its root.
 *
 * @param {string} root - allowed root directory
 * @param {string|string[]} path - path relative to the root
 * @param {boolean} recursive - allow files below child directories
 * @returns {string|undefined} canonical path to the file
 */
const resolveFileInRoot = (root = '', path = [], recursive = true) => {
  const segments = [].concat(path)

  if (
    !root ||
    !segments.length ||
    segments.some(
      (part) => typeof part !== 'string' || !part || isAbsolute(part)
    )
  ) {
    return
  }

  try {
    const resolvedRoot = realpathSync(root)
    const resolvedFile = realpathSync(resolve(resolvedRoot, ...segments))
    const pathFromRoot = relative(resolvedRoot, resolvedFile)

    if (
      pathFromRoot &&
      !isOutsideRoot(pathFromRoot) &&
      (recursive || !pathFromRoot.includes(sep)) &&
      statSync(resolvedFile).isFile()
    ) {
      return resolvedFile
    }
  } catch {}
}

/**
 * Resolve a CPI directory without trusting symlinked app or user directories.
 *
 * @param {...string} path - directory path relative to CPI
 * @returns {string|undefined} canonical path to the directory
 */
const resolveCpiDirectory = (...path) => {
  try {
    const directory = resolve(realpathSync(global.paths.CPI), ...path)

    if (realpathSync(directory) === directory) return directory
  } catch {}
}

/**
 * Resolve a CPI file owned by the user or, when requested, a public file.
 *
 * @param {string} file - filename
 * @param {number} id - user id
 * @param {boolean} allowPublic - allow files directly under the app directory
 * @param {string} expectedApp - app requested by the caller
 * @returns {string|undefined} canonical path to the file
 */
const resolveCpiFile = (
  file = '',
  id = '',
  allowPublic = false,
  expectedApp = ''
) => {
  if (
    typeof file !== 'string' ||
    id === '' ||
    id == null ||
    !global?.paths?.CPI
  ) {
    return
  }

  const userId = `${id}`
  if (!/^\d+$/.test(userId)) return

  const [app, owner, ...path] = file.split(/[\\/]/)
  if (!checkValidApp(app) || (expectedApp && app !== expectedApp)) return

  if (owner === userId && path.length) {
    return resolveFileInRoot(resolveCpiDirectory(app, userId), path)
  }

  if (allowPublic && owner && !path.length) {
    return resolveFileInRoot(resolveCpiDirectory(app), owner, false)
  }
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
 * Get the default files path for an app.
 *
 * @param {string} app - app
 * @returns {string|undefined} default files path
 */
const getDefaultFilesPath = (app = '') =>
  app === 'sunstone' ? global?.paths?.SUNSTONE_IMAGES : undefined

/**
 * Get default files for an app.
 *
 * @param {string} app - app
 * @returns {Array} files relative to the default files path
 */
const getDefaultFilesforApps = (app = '') => {
  const path = getDefaultFilesPath(app)

  return path
    ? getFiles(path, true).map((file) => file.replace(`${path}${sep}`, ''))
    : []
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
    data = data.concat(getDefaultFilesforApps(app))

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
 * @param {object} userData - authenticated user
 * @returns {undefined} undefined
 */
const show = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { file, app } = params
  const { id } = userData

  if (
    typeof file !== 'string' ||
    typeof app !== 'string' ||
    !checkValidApp(app) ||
    id === '' ||
    id == null
  ) {
    res.locals.httpCode = httpBadRequest

    return next()
  }

  const pathFile =
    resolveCpiFile(file, id, true, app) ||
    resolveFileInRoot(getDefaultFilesPath(app), file)

  res.locals.httpCode = pathFile
    ? httpResponse(ok, '', '', pathFile)
    : httpNotFound
  next()
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
  const pathFile = resolveCpiFile(file, id)
  if (pathFile) {
    res.locals.httpCode = httpResponse(
      removeFile(pathFile) ? ok : internalServerError,
      '',
      ''
    )
  } else {
    res.locals.httpCode = rtn
  }
  next()
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
  const pathFile = resolveCpiFile(name, id)
  if (pathFile && files) {
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
    res.locals.httpCode = httpResponse(method, data.length ? data : '', message)
  } else {
    res.locals.httpCode = rtn
  }
  next()
}

const functionRoutes = {
  upload,
  deleteFile,
  update,
  show,
  list,
}
module.exports = functionRoutes
