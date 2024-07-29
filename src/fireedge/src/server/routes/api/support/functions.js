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
const btoa = require('btoa')
const { JSDOM } = require('jsdom')
// eslint-disable-next-line node/no-deprecated-api
const { parse } = require('url')
const { defaults, httpCodes } = require('server/utils/constants')
const { httpResponse, executeRequest } = require('server/utils/server')
const { getSunstoneConfig } = require('server/utils/yml')

const { defaultEmptyFunction, httpMethod, defaultComunityRepo } = defaults
const { ok, badRequest } = httpCodes
const { GET } = httpMethod

const appConfig = getSunstoneConfig()

const headerUserAgent = {
  'User-Agent': 'OpenNebula Subscription Validation',
}

/**
 * Get element by xpath.
 *
 * @param {string} path - xpath
 * @param {object} document - document
 * @returns {Array} result
 */
const getElementByXpath = (path = '', document = {}) => {
  const results = []
  const query = document?.evaluate(path, document, null, 7, null)
  for (let i = 0, length = query?.snapshotLength; i < length; ++i) {
    results.push(query?.snapshotItem?.(i))
  }

  return results
}

/**
 * Check if the instance has enterprise support.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 */
const checkSupport = (res = {}, next = defaultEmptyFunction) => {
  const responser = (data = '', code = badRequest) => {
    res.locals.httpCode = httpResponse(code, data, '')
    next()
  }

  if (!(appConfig && appConfig.token_remote_support)) {
    responser('empty/null token')

    return
  }

  executeRequest(
    {
      params: {
        url: defaultComunityRepo,
        method: GET,
        headers: {
          Authorization: `Basic ${btoa(appConfig.token_remote_support)}`,
          ...headerUserAgent,
        },
      },
    },
    {
      success: (data) => {
        data ? responser('', ok) : responser('')
      },
      error: (error) => responser(error && error.message),
    }
  )
}

/**
 * Return latest available version.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 */
const versionSupport = (res = {}, next = defaultEmptyFunction) => {
  const responser = (data = '', code = badRequest) => {
    res.locals.httpCode = httpResponse(code, data, '')
    next()
  }

  let params = {
    url: defaultComunityRepo,
    headers: headerUserAgent,
  }

  if (appConfig && appConfig.token_remote_support) {
    params = {
      url: defaultComunityRepo,
      headers: {
        Authorization: `Basic ${btoa(appConfig.token_remote_support)}`,
        ...headerUserAgent,
      },
    }
  }

  if (appConfig && appConfig.proxy) {
    const parseUrl = parse(appConfig.proxy)
    params.proxy = {}
    parseUrl.protocol && (params.proxy.protocol = parseUrl.protocol)
    parseUrl.host && (params.proxy.host = parseUrl.host)
    parseUrl.port && (params.proxy.port = parseUrl.port)
  }

  executeRequest(
    {
      params: {
        method: GET,
        ...params,
      },
    },
    {
      success: (data) => {
        if (!data) {
          responser('')

          return
        }
        const dataDom = new JSDOM(data)
        const versions = getElementByXpath(
          '//table/tbody/tr/td/a/text()',
          dataDom?.window?.document
        )

        const parsedVersions = versions
          .map((element) => element?.textContent?.replace('/', ''))
          .filter((element) => {
            if (!element?.match?.(/^(\d+\.)?(\d+\.)?(\*|\d+\.)?(\*|\d+)$/gm)) {
              return false
            }
            const splitVersion = element.split('.')

            return splitVersion && splitVersion[1] && !(splitVersion[1] % 2)
          })
          .reduce((a, b) =>
            a.localeCompare(b, undefined, {
              numeric: true,
              sensitivity: 'base',
            }) > 0
              ? a
              : b
          )

        responser(parsedVersions, ok)
      },
      error: (error) => responser(error && error.message),
    }
  )
}

module.exports = {
  checkSupport,
  versionSupport,
}
