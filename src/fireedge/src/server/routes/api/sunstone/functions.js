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
const { getSunstoneConfig } = require('server/utils/yml')
const { defaults, httpCodes } = require('server/utils/constants')
const {
  existsFile,
  httpResponse,
  getFiles,
  getDirectories,
} = require('server/utils/server')
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
 * Create a response with the info of the view files that are in global.paths.SUNSTONE_PATH/{view name}.
 *
 * @param {Array} views - The name of the views
 * @param {object} rtn - Response
 */
const fillViewsInfo = (views, rtn) => {
  // Iterate over each name view
  views.forEach((view) => {
    // Get all the files in global.paths.SUNSTONE_PATH/{view name} folder
    getFiles(`${global.paths.SUNSTONE_PATH}${view}`).forEach((viewPath) => {
      // Get the content of each file
      existsFile(viewPath, (viewData = '') => {
        // Create array in the response object for a view
        if (!rtn[view]) {
          rtn[view] = []
        }

        // Get the data of the file
        const jsonViewData = parse(viewData) || {}

        // Add data to the view in the response
        if (jsonViewData && jsonViewData.resource_name) {
          rtn[view].push(jsonViewData)
        }
      })
    })
  })
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
    // Get connection to ONE
    const oneConnect = oneConnection(user, password)

    // Connect to ONE to get the info of an user
    oneConnect({
      action: ActionsUser.USER_INFO,
      parameters: [-1, false],
      callback: (err = {}, dataUser = {}) => {
        // Check that the user has info and a group
        if (dataUser && dataUser.USER && dataUser.USER.GID) {
          // Get info about the user group
          getInfoGroup(
            oneConnect,
            dataUser.USER.GID,
            (err = {}, vmgroupData = {}) => {
              // Check that the group has info
              if (vmgroupData && vmgroupData.GROUP && vmgroupData.GROUP.NAME) {
                // Check if the user is admin of the group
                const admins = Array.isArray(vmgroupData.GROUP.ADMINS)
                  ? vmgroupData.GROUP.ADMINS
                  : [vmgroupData.GROUP.ADMINS]
                const isAdminGroup = admins.some(
                  (admin) => admin.ID === dataUser.USER.ID
                )

                // Get the views on the group template
                const groupViews =
                  vmgroupData?.GROUP?.TEMPLATE?.FIREEDGE?.VIEWS?.split(',')

                // Get the admin views on the group template
                const groupAdminViews =
                  vmgroupData?.GROUP?.TEMPLATE?.FIREEDGE?.GROUP_ADMIN_VIEWS?.split(
                    ','
                  )

                /**
                 * Three cases:
                 * 1 -> Group template has TEMPLATE.FIREEDGE.GROUP_ADMIN_VIEWS and the user is admin of the group
                 * 2 -> Group template has TEMPLATE.FIREEDGE.VIEWS
                 * 3 -> Group template has not TEMPLATE.FIREEDGE.VIEWS and TEMPLATE.FIREEDGE.GROUP_ADMIN_VIEWS
                 */

                if (
                  isAdminGroup &&
                  groupAdminViews &&
                  groupAdminViews.length > 0
                ) {
                  // First case: Group template has TEMPLATE.FIREEDGE.GROUP_ADMIN_VIEWS and the user is admin of the group

                  // Create info views
                  const views = {}

                  // Fill info of each view reading the files on global.paths.SUNSTONE_PATH/{view name}
                  fillViewsInfo(groupAdminViews, views)

                  // Get default view of the group
                  const defaultView =
                    vmgroupData?.GROUP?.TEMPLATE?.FIREEDGE
                      ?.GROUP_ADMIN_DEFAULT_VIEW

                  // Create response
                  const rtn = {
                    views: views,
                    defaultView: defaultView || views[0],
                  }

                  // Return response
                  responseHttp(res, next, httpResponse(ok, rtn))
                }
                // Check the views associated to the group
                else if (groupViews && groupViews.length > 0) {
                  // Second case: Group template has TEMPLATE.FIREEDGE.VIEWS

                  // Create info views
                  const views = {}

                  // Fill info of each view reading the files on global.paths.SUNSTONE_PATH/{view name}
                  fillViewsInfo(groupViews, views)

                  // Get default view of the group
                  const defaultView =
                    vmgroupData?.GROUP?.TEMPLATE?.FIREEDGE?.DEFAULT_VIEW

                  // Create response
                  const rtn = {
                    views: views,
                    defaultView: defaultView || views[0],
                  }

                  // Return response
                  responseHttp(res, next, httpResponse(ok, rtn))
                } else {
                  // Third case: Group template has not TEMPLATE.FIREEDGE.VIEWS and TEMPLATE.FIREEDGE.GROUP_ADMIN_VIEWS
                  // If group template has not views, use configuration on global.paths.SUNSTONE_VIEWS file
                  existsFile(
                    global.paths.SUNSTONE_VIEWS,
                    (filedata) => {
                      // Get the content of global.paths.SUNSTONE_VIEWS file
                      const jsonFileData = parse(filedata) || {}

                      // Check that the file has content and the attributes groups and default
                      if (
                        jsonFileData &&
                        jsonFileData.groups &&
                        jsonFileData.default
                      ) {
                        // Get the views of the group and, if there is no group, the default view
                        const groupViewsFile =
                          jsonFileData.groups[vmgroupData.GROUP.NAME] ||
                          jsonFileData.default

                        // Create info views
                        const views = {}

                        // Fill info of each view reading the files on global.paths.SUNSTONE_PATH/{view name}
                        fillViewsInfo(groupViewsFile, views)

                        // Create response
                        const rtn = {
                          views: views,
                          defaultView: undefined,
                        }

                        // Return response
                        responseHttp(res, next, httpResponse(ok, rtn))
                      }
                    },
                    () => {
                      responseHttp(res, next, notFound)
                    }
                  )
                }
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
    includeProtectedConfig: false,
    onError: (err) => (error = err),
  })

  responseHttp(
    res,
    next,
    error ? httpResponse(notFound, error) : httpResponse(ok, config)
  )
}

/**
 * Get available views in the one installation.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 */
const getAvailableViews = (res = {}, next = defaultEmptyFunction) => {
  let error = false

  const views = getDirectories(
    `${global.paths.SUNSTONE_PATH}`,
    () => (error = true)
  ).map((dir) => ({ name: dir.filename }))

  if (error) {
    responseHttp(res, next, httpResponse(notFound, error))
  }

  existsFile(
    global.paths.SUNSTONE_VIEWS,
    (filedata) => {
      // Get the content of global.paths.SUNSTONE_VIEWS file
      const jsonFileData = parse(filedata) || {}
      const viewsData = jsonFileData.views

      // Iterate over views description
      const viewsExtended = views.map((view) => {
        if (viewsData && viewsData[view.name]) {
          return {
            type: view.name,
            name: viewsData[view.name].name,
            description: viewsData[view.name].description,
          }
        } else {
          return {
            type: view.name,
            name: view.name,
          }
        }
      })

      // Return response
      responseHttp(res, next, httpResponse(ok, viewsExtended))
    },
    () => {
      responseHttp(res, next, httpResponse(ok, views))
    }
  )
}

const sunstoneApi = {
  getViews,
  getConfig,
  getAvailableViews,
}
module.exports = sunstoneApi
