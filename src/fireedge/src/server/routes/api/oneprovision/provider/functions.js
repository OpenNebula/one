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

const { parse } = require('yaml')
const { basename } = require('path')
const { defaults, httpCodes } = require('server/utils/constants')
const {
  httpResponse,
  parsePostData,
  getFilesbyEXT,
  existsFile,
  executeCommand,
  removeFile,
} = require('server/utils/server')
const {
  createTemporalFile,
  createYMLContent,
  getEndpoint,
  getSpecificConfig,
} = require('server/routes/api/oneprovision/utils')

const {
  defaultFolderTmpProvision,
  defaultCommandProvider,
  defaultHideCredentials,
  defaultHideCredentialReplacer,
  defaultEmptyFunction,
  defaultProvidersConfigPath,
} = defaults
const { ok, internalServerError } = httpCodes
const httpInternalError = httpResponse(internalServerError, '', '')

/**
 * Get provision Config.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const getProviderConfig = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const path = `${global.paths.PROVISION_PATH}${defaultProvidersConfigPath}`
  const extFiles = 'yaml'
  let response = internalServerError
  let message = ''

  /**
   * Fill Providers.
   *
   * @param {string} content - content of provider
   * @param {string} name - name of provider
   */
  const fillProviders = (content = '', name = '') => {
    if (content && name) {
      try {
        message[name] = parse(content)
      } catch (error) {}
    }
  }
  /**
   * Fill Error Message.
   *
   * @param {string} error - error path
   */
  const fillErrorMessage = (error = '') => {
    message = error
  }

  const files = getFilesbyEXT(path, extFiles, fillErrorMessage)

  if (files.length) {
    response = ok
    files.forEach((file) => {
      existsFile(file, (content) => {
        if (typeof message === 'string') {
          message = {}
        }
        fillProviders(content, basename(file, `.${extFiles}`))
      })
    })
  }

  res.locals.httpCode = httpResponse(response, message)
  next()
}

/**
 * Get connection providers.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const getConnectionProviders = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (user && password) {
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    if (params && params.id) {
      const paramsCommand = [
        'show',
        `${params.id}`.toLowerCase(),
        ...authCommand,
        ...endpoint,
        '--json',
      ]
      const executedCommand = executeCommand(
        defaultCommandProvider,
        paramsCommand,
        getSpecificConfig('oneprovision_prepend_command')
      )
      try {
        const response = executedCommand.success ? ok : internalServerError
        const data = JSON.parse(executedCommand.data)
        if (
          data &&
          data.DOCUMENT &&
          data.DOCUMENT.TEMPLATE &&
          data.DOCUMENT.TEMPLATE.PROVISION_BODY &&
          data.DOCUMENT.TEMPLATE.PROVISION_BODY.connection
        ) {
          res.locals.httpCode = httpResponse(
            response,
            data.DOCUMENT.TEMPLATE.PROVISION_BODY.connection
          )
          next()

          return
        }
      } catch (error) {
        rtn = httpResponse(internalServerError, '', executedCommand.data)
      }
    }
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Get list providers.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const getListProviders = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (user && password) {
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    let paramsCommand = ['list', ...authCommand, ...endpoint, '--json']
    if (params && params.id) {
      paramsCommand = [
        'show',
        `${params.id}`.toLowerCase(),
        ...authCommand,
        ...endpoint,
        '--json',
      ]
    }
    const executedCommand = executeCommand(
      defaultCommandProvider,
      paramsCommand,
      getSpecificConfig('oneprovision_prepend_command')
    )
    try {
      const response = executedCommand.success ? ok : internalServerError
      const data = JSON.parse(executedCommand.data)

      /**
       * Parse provision.TEMPLATE.PLAIN to JSON.
       *
       * @param {object} provision - provision
       * @returns {object} provision with TEMPLATE.PLAIN in JSON
       */
      const parseTemplatePlain = (provision) => {
        if (provision && provision.TEMPLATE && provision.TEMPLATE.PLAIN) {
          provision.TEMPLATE.PLAIN = JSON.parse(provision.TEMPLATE.PLAIN)
        }

        return provision
      }

      if (data && data.DOCUMENT_POOL && data.DOCUMENT_POOL.DOCUMENT) {
        data.DOCUMENT_POOL.DOCUMENT = Array.isArray(data.DOCUMENT_POOL.DOCUMENT)
          ? data.DOCUMENT_POOL.DOCUMENT.map(parseTemplatePlain)
          : parseTemplatePlain(data.DOCUMENT_POOL.DOCUMENT)
      }
      // hide connections
      if (
        params &&
        params.id &&
        defaultHideCredentials &&
        data &&
        data.DOCUMENT &&
        data.DOCUMENT.TEMPLATE &&
        data.DOCUMENT.TEMPLATE.PROVISION_BODY &&
        data.DOCUMENT.TEMPLATE.PROVISION_BODY.connection
      ) {
        const encryptedData = {}
        Object.keys(data.DOCUMENT.TEMPLATE.PROVISION_BODY.connection).forEach(
          (key) => {
            encryptedData[key] = defaultHideCredentialReplacer
          }
        )
        data.DOCUMENT.TEMPLATE.PROVISION_BODY.connection = encryptedData
      }

      // if exists params.id
      if (data && data.DOCUMENT) {
        parseTemplatePlain(data.DOCUMENT)
      }
      res.locals.httpCode = httpResponse(response, data)
      next()

      return
    } catch (error) {
      rtn = httpResponse(internalServerError, '', executedCommand.data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Create provider.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const createProviders = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const rtn = httpInternalError
  if (params && params.data && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const endpoint = getEndpoint()
    const resource = parsePostData(params.data)
    const content = createYMLContent(resource)

    if (content) {
      const file = createTemporalFile(
        `${global.paths.CPI}/${defaultFolderTmpProvision}`,
        'yaml',
        content
      )
      if (file && file.name && file.path) {
        const paramsCommand = ['create', file.path, ...authCommand, ...endpoint]
        const executedCommand = executeCommand(
          defaultCommandProvider,
          paramsCommand
        )
        res.locals.httpCode = httpResponse(internalServerError)
        if (executedCommand && executedCommand.data) {
          if (executedCommand.success) {
            const data = executedCommand.data
            const dataInternal =
              data && Array.isArray(data.match('\\d+'))
                ? data.match('\\d+').join()
                : data
            res.locals.httpCode = httpResponse(ok, dataInternal)
          } else {
            res.locals.httpCode = httpResponse(
              internalServerError,
              '',
              executedCommand.data
            )
          }
        }
        removeFile(file.path)
        next()

        return
      }
    }
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Update provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const updateProviders = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const rtn = httpInternalError
  if (params && params.data && params.id && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const endpoint = getEndpoint()
    const resource = parsePostData(params.data)
    const file = createTemporalFile(
      `${global.paths.CPI}/${defaultFolderTmpProvision}`,
      'json',
      JSON.stringify(resource)
    )
    if (file && file.name && file.path) {
      const paramsCommand = [
        'update',
        params.id,
        file.path,
        ...authCommand,
        ...endpoint,
      ]
      const executedCommand = executeCommand(
        defaultCommandProvider,
        paramsCommand
      )
      res.locals.httpCode = httpResponse(internalServerError)
      if (executedCommand && executedCommand.success) {
        res.locals.httpCode = httpResponse(ok)
      }
      removeFile(file.path)
      next()

      return
    }
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Delete provider.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const deleteProvider = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.id && user && password) {
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = [
      'delete',
      `${params.id}`.toLowerCase(),
      ...authCommand,
      ...endpoint,
    ]
    const executedCommand = executeCommand(
      defaultCommandProvider,
      paramsCommand,
      getSpecificConfig('oneprovision_prepend_command')
    )
    const data = executedCommand.data || ''
    try {
      if (executedCommand && executedCommand.success) {
        res.locals.httpCode = httpResponse(ok)
      } else {
        res.locals.httpCode = httpResponse(
          internalServerError,
          '',
          executedCommand.data
        )
      }
      next()

      return
    } catch (error) {
      rtn = httpResponse(internalServerError, '', data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

const providerFunctionsApi = {
  getProviderConfig,
  getConnectionProviders,
  getListProviders,
  createProviders,
  updateProviders,
  deleteProvider,
}
module.exports = providerFunctionsApi
