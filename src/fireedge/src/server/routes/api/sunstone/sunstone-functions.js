/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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

const { parse } = require('yaml')
const { defaultEmptyFunction } = require('server/utils/constants/defaults')
const { existsFile, httpResponse, getFiles } = require('server/utils/server')
const { Actions: ActionsUser } = require('server/utils/constants/commands/user')
const { Actions: ActionsGroup } = require('server/utils/constants/commands/group')

const {
  ok,
  internalServerError,
  notFound
} = require('server/utils/constants/http-codes')

const httpInternalError = httpResponse(internalServerError, '', '')

const getInfoZone = (connect = defaultEmptyFunction, idZone, callback = defaultEmptyFunction) => {
  connect(
    ActionsGroup.GROUP_INFO,
    [parseInt(idZone, 10), false],
    callback,
    false
  )
}

const responseHttp = (res = {}, next = defaultEmptyFunction, httpCode) => {
  if (res && res.locals && res.locals.httpCode && httpCode) {
    res.locals.httpCode = httpCode
    next()
  }
}

const getViews = (res = {}, next = () => undefined, params = {}, userData = {}, oneConnection = defaultEmptyFunction) => {
  const { user, password } = userData
  if (user && password && global && global.SUNSTONE_VIEWS && global.SUNSTONE_PATH) {
    const connect = oneConnection(user, password)
    // get user data
    connect(
      ActionsUser.USER_INFO,
      [-1, false],
      (err = {}, userData = {}) => {
        if (userData && userData.USER && userData.USER.GID) {
          // get group data for user
          getInfoZone(
            connect,
            userData.USER.GID,
            (err = {}, vmgroupData = {}) => {
              if (vmgroupData && vmgroupData.GROUP && vmgroupData.GROUP.NAME) {
                // get info for file sunstone-views.yamls
                existsFile(
                  global.SUNSTONE_VIEWS,
                  filedata => {
                    const jsonFileData = parse(filedata) || {}
                    if (jsonFileData && jsonFileData.groups && jsonFileData.default) {
                      // get info for views
                      const views = jsonFileData.groups[vmgroupData.GROUP.NAME] || jsonFileData.default
                      const rtn = {}
                      views.forEach(view => {
                        // aca se tiene que ir armando la respuesta del http
                        getFiles(
                          `${global.SUNSTONE_PATH}${view}`
                        ).forEach(viewPath => {
                          existsFile(
                            viewPath,
                            (viewData = '') => {
                              // get file content of view
                              const jsonViewData = parse(viewData) || {}
                              if (jsonViewData && jsonViewData.resource_name) {
                                rtn[view] = jsonViewData
                              }
                            }
                          )
                        })
                      })
                      responseHttp(
                        res,
                        next,
                        httpResponse(ok, rtn)
                      )
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
      false
    )
  } else {
    responseHttp(res, next, httpInternalError)
  }
}

const getConfig = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  if (global && global.SUNSTONE_CONFIG) {
    existsFile(
      global.SUNSTONE_CONFIG,
      filedata => {
        const jsonFileData = parse(filedata) || {}
        responseHttp(
          res,
          next,
          httpResponse(ok, jsonFileData)
        )
      },
      () => {
        responseHttp(res, next, notFound)
      }
    )
  } else {
    responseHttp(res, next, httpInternalError)
  }
}

const sunstoneApi = {
  getViews,
  getConfig
}
module.exports = sunstoneApi
