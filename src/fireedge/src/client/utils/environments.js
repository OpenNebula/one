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
/** @enum {string} Mode */
const MODE = {
  development: 'development',
  production: 'production',
}

/** @returns {boolean} `true` if is load in the server */
const isBackend = () => typeof window === 'undefined'

/** @returns {boolean} `true` if production mode enabled */
const isProduction = () => process.env.NODE_ENV === 'production'

/** @returns {boolean} `true` if development mode enabled */
const isDevelopment = () => process.env.NODE_ENV === 'development'

/** @returns {MODE} Mode enabled in NODE_ENV */
export default MODE[process.env.NODE_ENV]

export { isProduction, isDevelopment, isBackend }
