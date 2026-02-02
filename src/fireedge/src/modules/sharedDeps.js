/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

const deps = require('../../package.json').dependencies
const specificVersion = [
  'react',
  'react-dom',
  '@emotion/react',
  '@mui/system',
  '@reduxjs/toolkit',
]

const notShared = [
  'react-transition-group',
  'clsx',
  'prop-types',
  'redux',
  'redux-thunk',
  'socket.io-client',
]

/**
 * Returns shared dependencies configuration for Webpack Module Federation.
 *
 * @returns {object} - Shared dependencies configuration for remote modules.
 */
const sharedDeps = () =>
  Object.entries(deps)
    ?.filter(([name, _version]) => !notShared?.includes(name))
    ?.map(([name, version]) => ({
      [name]: {
        singleton: true,
        eager: false,
        ...(specificVersion?.includes(name) && { requiredVersion: version }),
      },
    }))

module.exports = sharedDeps
