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
 * @param {object} configFormatCreate.attachments - attachment file
 * @returns {object|undefined} format message create ticket
 */
const formatCreate = ({
  subject = '',
  body = '',
  version = '',
  severity = '',
  attachments = [],
}) => {
  if (!(subject && body && version && severity)) return

  const rtn = {
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

  attachments?.length > 0 &&
    (rtn.request.comment.uploads = attachments.filter((att) => att))

  return rtn
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
 * Format a Zendesk API error.
 *
 * @param {object} err - Zendesk error
 * @param {object} err.result - API error response
 * @returns {string} string error
 */
const parseZendeskError = (err) => {
  const error = err?.result?.error
  if (error && typeof error === 'object') {
    return [error.title, error.message].filter(Boolean).join(': ')
  }

  return err?.message ?? ''
}

/**
 * Run a Zendesk operation and complete the API response on success or failure.
 *
 * @param {object} response - HTTP response.
 * @param {Function} next - Express continuation.
 * @param {Function} operation - Asynchronous Zendesk operation.
 * @returns {Promise<void>} Completed response.
 */
const respond = async (response, next, operation) => {
  try {
    response.locals.httpCode = httpResponse(ok, await operation())
  } catch (error) {
    response.locals.httpCode = httpResponse(
      internalServerError,
      parseZendeskError(error)
    )
  }
  next()
}

/**
 * Upload attachments before submitting their tokens with a ticket or comment.
 *
 * @param {object} client - Zendesk client.
 * @param {object[]} attachments - Uploaded files.
 * @returns {Promise<string[]>} Attachment tokens.
 */
const uploadAttachments = (client, attachments = []) =>
  Promise.all(
    attachments.map(async ({ path, originalname }) => {
      const result = await client.attachments.upload(path, {
        filename: originalname,
        binary: true,
      })
      if (!result?.upload?.token) throw new Error('Zendesk upload failed')

      return result.upload.token
    })
  )

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
 * @returns {Promise<void>|undefined} Completed API response.
 */
const login = (
  response = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const sunstoneConfig = getSunstoneConfig()
  const endpointUri = sunstoneConfig.support_url || ''
  const { user, password } = userData
  const { user: zendeskUser, pass } = params
  const session = getSession(user, password)

  if (!(endpointUri && zendeskUser && pass && session)) {
    response.locals.httpCode = httpBadRequest

    return next()
  }

  const zendeskData = {
    username: zendeskUser,
    password: pass,
    endpointUri,
    throwOriginalException: true,
    debug: env.NODE_ENV === defaultWebpackMode,
  }

  return respond(response, next, async () => {
    delete session.zendesk
    const client = zendesk.createClient(zendeskData)
    const { result } = await client.users.auth()
    if (result?.id) {
      session.zendesk = { ...zendeskData, id: result.id }
    }

    return result
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
 * @returns {Promise<void>|undefined} Completed API response.
 */
const list = (
  response = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  if (!(user && password)) {
    response.locals.httpCode = httpBadRequest

    return next()
  }
  const session = getSession(user, password)
  if (!session?.zendesk?.id) {
    response.locals.httpCode = httpResponse(unauthorized)

    return next()
  }

  return respond(response, next, async () => {
    const client = zendesk.createClient(session.zendesk)
    // requests.list() follows every pagination link. Fetch only the first
    // cursor page to preserve the previous limit of 100 tickets.
    const { result: tickets } = await client.requests.get([
      'requests',
      {
        sort_by: 'created_at',
        sort_order: 'desc',
        page: 1,
      },
    ])
    const ticketCount = {
      new: 0,
      open: 0,
      pending: 0,
      hold: 0,
      solved: 0,
      closed: 0,
    }
    tickets.forEach(({ status }) => {
      if (Object.hasOwn(ticketCount, status)) ticketCount[status] += 1
    })

    return { tickets, ...ticketCount }
  })
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
 * @returns {Promise<void>|undefined} Completed API response.
 */
const comments = (
  response = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { id } = params
  const { user, password } = userData
  if (!(Number.isInteger(parseInt(id, 10)) && user && password)) {
    response.locals.httpCode = httpBadRequest

    return next()
  }
  const session = getSession(user, password)
  if (!session?.zendesk?.id) {
    response.locals.httpCode = httpResponse(unauthorized)

    return next()
  }

  return respond(response, next, async () => {
    const client = zendesk.createClient(session.zendesk)

    return client.requests.listComments(id)
  })
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
 * @returns {Promise<void>|undefined} Completed API response.
 */
const create = (
  response = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { subject, body, version, severity, attachments } = params
  const { user, password } = userData
  if (
    !(
      subject &&
      body &&
      version &&
      severity &&
      defaultSeverities.includes(severity) &&
      user &&
      password
    )
  ) {
    response.locals.httpCode = httpBadRequest

    return next()
  }
  const session = getSession(user, password)
  if (!session?.zendesk?.id) {
    response.locals.httpCode = httpResponse(unauthorized)

    return next()
  }

  return respond(response, next, async () => {
    const client = zendesk.createClient(session.zendesk)
    const tokens = await uploadAttachments(client, attachments)
    const { result } = await client.requests.create(
      formatCreate({ ...params, attachments: tokens })
    )

    return result
  })
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
 * @returns {Promise<void>|undefined} Completed API response.
 */
const update = (
  response = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { id, body, attachments } = params
  const { user, password } = userData
  if (!(Number.isInteger(parseInt(id, 10)) && body && user && password)) {
    response.locals.httpCode = httpBadRequest

    return next()
  }
  const session = getSession(user, password)
  if (!session?.zendesk?.id) {
    response.locals.httpCode = httpResponse(unauthorized)

    return next()
  }

  return respond(response, next, async () => {
    const client = zendesk.createClient(session.zendesk)
    const tokens = await uploadAttachments(client, attachments)
    const { result } = await client.requests.update(
      id,
      formatComment({ ...params, attachments: tokens })
    )

    return result
  })
}

const functionRoutes = {
  login,
  list,
  comments,
  create,
  update,
}
module.exports = functionRoutes
