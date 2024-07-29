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

const { env } = require('process')
const zendesk = require('node-zendesk')
const { getSunstoneConfig } = require('server/utils/yml')
const { defaults, httpCodes } = require('server/utils/constants')
const { httpResponse } = require('server/utils/server')
const { getSession } = require('server/routes/api/zendesk/utils')

const { defaultEmptyFunction, defaultSeverities, defaultWebpackMode } = defaults
const { ok, internalServerError, badRequest, unauthorized } = httpCodes

const httpBadRequest = httpResponse(badRequest, '', '')

/**
 * Format create ticket.
 *
 * @param {object} configFormatCreate - config format
 * @param {string} configFormatCreate.subject - subject
 * @param {string} configFormatCreate.body - body
 * @param {string} configFormatCreate.version - one version
 * @param {string} configFormatCreate.severity - ticket severity
 * @returns {object|undefined} format message create ticket
 */
const formatCreate = ({
  subject = '',
  body = '',
  version = '',
  severity = '',
}) => {
  if (!(subject && body && version && severity)) return

  return {
    request: {
      subject,
      comment: {
        body,
      },
      custom_fields: [
        { id: 391130, value: version }, // version
        { id: 391197, value: severity }, // severity
      ],
      can_be_solved_by_me: false,
      tags: [severity],
    },
  }
}

/**
 * Format comment.
 *
 * @param {object} configFormatComment - config format
 * @param {string} configFormatComment.body - body
 * @param {string} configFormatComment.solved - solved
 * @param {string[]} configFormatComment.attachments - attachments
 * @returns {object|undefined} format comment
 */
const formatComment = ({ body = '', solved = '', attachments = [] }) => {
  if (!body) return

  const rtn = {
    request: {
      comment: {
        html_body: body,
        public: true,
      },
    },
  }

  if (solved) {
    rtn.request.solved = 'true'
  }

  attachments?.length > 0 &&
    (rtn.request.comment.uploads = attachments.filter((att) => att))

  return rtn
}

/**
 * Parse Buffer error.
 *
 * @param {object} err - buffer error
 * @param {string} err.error - buffer error
 * @returns {string} string error
 */
const parseBufferError = (err) => {
  if (!err?.result) return

  let rtn = ''
  try {
    const errorJson = JSON.parse(err.result.toString())
    if (!errorJson?.error) return

    rtn = errorJson.error.title ? `${errorJson.error.title}: ` : ''
    rtn += errorJson.error.message ?? ''
  } catch {}

  return rtn
}

/**
 * Login on Zendesk.
 *
 * @param {object} response - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {string} params.user - zendesk user
 * @param {string} params.pass - zendesk.pass
 * @param {object} userData - user of http request
 * @param {string} userData.user - username
 * @param {string} userData.password - user password
 */
const login = (
  response = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const sunstoneConfig = getSunstoneConfig()
  const remoteUri = sunstoneConfig.support_url || ''
  const { user, password } = userData
  const { user: zendeskUser, pass } = params

  if (!(remoteUri && zendeskUser && pass && user && password)) {
    response.locals.httpCode = httpBadRequest
    next()
  }

  const zendeskData = {
    username: zendeskUser,
    password: pass,
    remoteUri,
    debug: env.NODE_ENV === defaultWebpackMode,
  }
  const session = getSession(user, password)
  /** ZENDESK AUTH */
  const zendeskClient = zendesk.createClient(zendeskData)
  /**
   * TODO:
   *
   * Analyze if it is possible to have error and result at the same time
   *
   * This can be changed in order to perform a return with HTTP 500
   * instead returning a HTTP 500 with response data.
   */
  zendeskClient.users.auth((err, _, result) => {
    let method = ok
    let data = result
    if (err) {
      if (session.zendesk) {
        delete session.zendesk
      }
      method = internalServerError
      data = parseBufferError(err)
    }
    if (result && result.authenticity_token) {
      const zendeskUserData = {
        ...zendeskData,
        id: result.id,
      }
      session.zendesk = zendeskUserData
    }

    response.locals.httpCode = httpResponse(method, data)
    next()
  })
}

/**
 * List on Zendesk.
 *
 * @param {object} response - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 * @param {string} userData.user - username
 * @param {string} userData.password - user password
 */
const list = (
  response = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  if (user && password) {
    const session = getSession(user, password)
    if (session.zendesk && session.zendesk.id) {
      /** LIST ZENDESK */
      const zendeskClient = zendesk.createClient(session.zendesk)
      zendeskClient.requests.getRequest(
        { sort_by: 'id', sort_order: 'desc' },
        (err, _, result) => {
          let method = ok
          let data = ''

          if (err) {
            method = internalServerError
            data = parseBufferError(err)
          } else if (result) {
            const ticketCount = {
              new: 0,
              open: 0,
              pending: 0,
              hold: 0,
              solved: 0,
              closed: 0,
            }
            const tickets = Array.isArray(result) ? result : result
            tickets.forEach((ticket) => {
              ticket?.status && (ticketCount[ticket.status] += 1)
            })
            data = {
              tickets: result,
              ...ticketCount,
            }
          }

          response.locals.httpCode = httpResponse(method, data)
          next()
        }
      )
    } else {
      response.locals.httpCode = httpResponse(unauthorized)
      next()
    }
  } else {
    response.locals.httpCode = httpBadRequest
    next()
  }
}

/**
 * Get Comments on ticket.
 *
 * @param {object} response - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {number} params.id - comment id
 * @param {object} userData - user of http request
 * @param {string} userData.user - username
 * @param {string} userData.password - user password
 */
const comments = (
  response = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { id } = params
  const { user, password } = userData
  if (Number.isInteger(parseInt(id, 10)) && user && password) {
    const session = getSession(user, password)
    if (session.zendesk) {
      /** GET COMMENTS ON TICKET ZENDESK */
      const zendeskClient = zendesk.createClient(session.zendesk)
      zendeskClient.requests.listComments(id, (err, _, result) => {
        let method = ok
        let data = ''

        if (err) {
          method = internalServerError
          data = parseBufferError(err)
        } else if (result) {
          data = result
        }

        response.locals.httpCode = httpResponse(method, data)
        next()
      })
    } else {
      response.locals.httpCode = httpResponse(unauthorized)
      next()
    }
  } else {
    response.locals.httpCode = httpBadRequest
    next()
  }
}

/**
 * Create ticket.
 *
 * @param {object} response - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {string} params.subject - subject
 * @param {string} params.body - body
 * @param {string} params.version - version
 * @param {string} params.severity - severity
 * @param {object} userData - user of http request
 * @param {string} userData.user - username
 * @param {string} userData.password - user password
 */
const create = (
  response = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { subject, body, version, severity } = params
  const { user, password } = userData
  if (
    subject &&
    body &&
    version &&
    severity &&
    defaultSeverities.includes(severity) &&
    user &&
    password
  ) {
    const session = getSession(user, password)
    if (session.zendesk && session.zendesk.id) {
      /** CREATE TICKET ZENDESK */
      const zendeskClient = zendesk.createClient(session.zendesk)
      const ticket = formatCreate(params)
      zendeskClient.requests.create(ticket, (err, req, result) => {
        let method = ok
        let data = ''
        if (err) {
          method = internalServerError
          data = parseBufferError(err)
        } else if (result) {
          data = result
        }
        response.locals.httpCode = httpResponse(method, data)
        next()
      })
    } else {
      response.locals.httpCode = httpResponse(unauthorized)
      next()
    }
  } else {
    response.locals.httpCode = httpBadRequest
    next()
  }
}

/**
 * Update Ticket.
 *
 * @param {object} response - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {string} params.id - ticket id
 * @param {string} params.body - ticket body
 * @param {object[]} params.attachments - files
 * @param {string} params.attachments.originalname - original name
 * @param {string} params.attachments.path - path file
 * @param {object} userData - user of http request
 * @param {string} userData.user - username
 * @param {string} userData.password - user password
 */
const update = (
  response = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { id, body, attachments } = params
  const { user, password } = userData
  if (Number.isInteger(parseInt(id, 10)) && body && user && password) {
    const session = getSession(userData.user, userData.password)
    if (session.zendesk && session.zendesk.id) {
      const zendeskClient = zendesk.createClient(session.zendesk)

      const sendRequest = (requestParams = {}) => {
        /** UPDATE TICKET ZENDESK */
        const ticket = formatComment(requestParams)
        zendeskClient.requests.update(id, ticket, (err, _, result) => {
          let method = ok
          let data = ''

          if (err) {
            method = internalServerError
            data = parseBufferError(err)
          } else if (result) {
            data = result
          }
          response.locals.httpCode = httpResponse(method, data)
          next()
        })
      }

      /** UPLOAD FILES */
      let uploadedAttachments
      if (
        attachments &&
        zendeskClient.attachments &&
        typeof zendeskClient.attachments.upload === 'function'
      ) {
        attachments.forEach((att = {}) => {
          if (att && att.originalname && att.path) {
            zendeskClient.attachments.upload(
              att.path,
              {
                filename: att.originalname,
              },
              (err, req, result) => {
                const token =
                  (result && result.upload && result.upload.token) || ''
                if (uploadedAttachments) {
                  uploadedAttachments.push(token)
                } else {
                  uploadedAttachments = [token]
                }
                if (
                  !err &&
                  token &&
                  uploadedAttachments.length === attachments.length
                ) {
                  sendRequest({ ...params, attachments: uploadedAttachments })
                }
              }
            )
          }
        })
      } else {
        sendRequest({ ...params, attachments })
      }
    } else {
      response.locals.httpCode = httpResponse(unauthorized)
      next()
    }
  } else {
    response.locals.httpCode = httpBadRequest
    next()
  }
}

const functionRoutes = {
  login,
  list,
  comments,
  create,
  update,
}
module.exports = functionRoutes
