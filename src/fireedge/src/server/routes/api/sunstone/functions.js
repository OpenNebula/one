/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
const { getSunstoneConfig } = require('server/utils/yml')
const { defaults, httpCodes } = require('server/utils/constants')
const { existsFile, httpResponse, getFiles } = require('server/utils/server')
const { Actions: ActionsUser } = require('server/utils/constants/commands/user')
const {
  Actions: ActionsGroup,
} = require('server/utils/constants/commands/group')

const { defaultEmptyFunction } = defaults
const { ok, internalServerError, notFound } = httpCodes
const httpInternalError = httpResponse(internalServerError, '', '')

/**
 * Get information of opennebula group.
 *
 * @param {Function} oneConnect - xmlrpc function
 * @param {string} idGroup - id of group
 * @param {Function} callback - run function when have group information
 */
const getInfoGroup = (
  oneConnect = defaultEmptyFunction,
  idGroup,
  callback = defaultEmptyFunction
) => {
  oneConnect({
    action: ActionsGroup.GROUP_INFO,
    parameters: [parseInt(idGroup, 10), false],
    callback,
    fillHookResource: false,
  })
}

/**
 * Response http request.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} httpCode - object http code
 */
const responseHttp = (res = {}, next = defaultEmptyFunction, httpCode) => {
  if (res && res.locals && res.locals.httpCode && httpCode) {
    res.locals.httpCode = httpCode
    next()
  }
}

/**
 * Get sunstone-server views.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 * @param {Function} oneConnection - xmlrpc function
 */
const getViews = (
  res = {},
  next = () => undefined,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  const { user, password } = userData
  if (
    user &&
    password &&
    global &&
    global.paths &&
    global.paths.SUNSTONE_VIEWS &&
    global.paths.SUNSTONE_PATH
  ) {
    const oneConnect = oneConnection(user, password)
    oneConnect({
      action: ActionsUser.USER_INFO,
      parameters: [-1, false],
      callback: (err = {}, dataUser = {}) => {
        if (dataUser && dataUser.USER && dataUser.USER.GID) {
          getInfoGroup(
            oneConnect,
            dataUser.USER.GID,
            (err = {}, vmgroupData = {}) => {
              if (vmgroupData && vmgroupData.GROUP && vmgroupData.GROUP.NAME) {
                existsFile(
                  global.paths.SUNSTONE_VIEWS,
                  (filedata) => {
                    const jsonFileData = parse(filedata) || {}
                    if (
                      jsonFileData &&
                      jsonFileData.groups &&
                      jsonFileData.default
                    ) {
                      const views =
                        jsonFileData.groups[vmgroupData.GROUP.NAME] ||
                        jsonFileData.default
                      const rtn = {}
                      views.forEach((view) => {
                        getFiles(
                          `${global.paths.SUNSTONE_PATH}${view}`
                        ).forEach((viewPath) => {
                          existsFile(viewPath, (viewData = '') => {
                            if (!rtn[view]) {
                              rtn[view] = []
                            }
                            const jsonViewData = parse(viewData) || {}
                            if (jsonViewData && jsonViewData.resource_name) {
                              rtn[view].push(jsonViewData)
                            }
                          })
                        })
                      })
                      responseHttp(res, next, httpResponse(ok, rtn))
                    }
                  },
                  () => {
                    responseHttp(res, next, notFound)
                  }
                )
              } else {
                responseHttp(res, next, httpInternalError)
              }
            }
          )
        } else {
          responseHttp(res, next, httpInternalError)
        }
      },
      fillHookResource: false,
    })
  } else {
    responseHttp(res, next, httpInternalError)
  }
}

/**
 * Get sunstone-server config.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const getConfig = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  let error

  const config = getSunstoneConfig({
    onError: (err) => (error = err),
  })

  responseHttp(
    res,
    next,
    error ? httpResponse(notFound, error) : httpResponse(ok, config)
  )
}

const sunstoneApi = {
  getViews,
  getConfig,
}
module.exports = sunstoneApi
