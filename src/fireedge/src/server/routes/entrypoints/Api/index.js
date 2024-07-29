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

const express = require('express')
const { httpCodes } = require('server/utils/constants')
const xmlrpcRoutes = require('server/routes/entrypoints/Api/xmlrpc')
const functionsRoutes = require('server/routes/entrypoints/Api/functions')

const { notFound, internalServerError } = httpCodes
const router = express.Router()

express()

const jsonResponser = (req, res) => {
  const { httpCode } = res.locals
  if (httpCode) {
    const { id, file } = httpCode
    if (file) {
      res.sendFile(file)

      return
    } else {
      res.status(id).json(httpCode)

      return
    }
  }
  res.status(internalServerError.id).json(internalServerError)
}

functionsRoutes({
  expressRouter: router,
  jsonResponser,
})

xmlrpcRoutes({
  expressRouter: router,
  jsonResponser,
})

/** NOT FOUND */
router.use((req, res) => {
  res.status(notFound.id).json(notFound)
})

module.exports = router
