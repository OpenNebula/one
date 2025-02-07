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

const deps = require('../../package.json').dependencies

/**
 * Returns shared dependencies configuration for Webpack Module Federation.
 *
 * @param {object} [options={}] - Options object.
 * @param {boolean} [options.eager=false] - Should only be true in the client host. Controls if the shared dependency should be loaded eagerly.
 * @returns {object} - Shared dependencies configuration for remote modules.
 */
const sharedDeps = ({ eager = false } = {}) => ({
  react: {
    singleton: true,
    eager,
    requiredVersion: deps.react,
  },
  recharts: {
    singleton: true,
    eager,
    requiredVersion: deps.recharts,
  },
  'react-dom': {
    singleton: true,
    eager,
    requiredVersion: deps['react-dom'],
  },
  '@mui/material': {
    singleton: true,
    eager,
    requiredVersion: deps['@mui/material'],
  },
  '@mui/styles': {
    singleton: true,
    eager,
    requiredVersion: deps['@mui/styles'],
  },
  redux: {
    singleton: true,
    eager,
    requiredVersion: deps.redux,
  },
  'react-redux': {
    singleton: true,
    eager,
    requiredVersion: deps['react-redux'],
  },
  '@reduxjs/toolkit': {
    singleton: true,
    eager,
    requiredVersion: deps['@reduxjs/toolkit'],
  },
  'redux-thunk': {
    singleton: true,
    eager,
    requiredVersion: deps['redux-thunk'],
  },
  'redux-persist': {
    singleton: true,
    eager,
    requiredVersion: deps['redux-persist'],
  },
  'react-router': {
    singleton: true,
    eager,
    requiredVersion: deps['react-router'],
  },
  'react-router-dom': {
    singleton: true,
    eager,
    requiredVersion: deps['react-router-dom'],
  },
  'react-hook-form': {
    singleton: true,
    eager,
    requiredVersion: deps['react-hook-form'],
  },
  '@hookform/resolvers': {
    singleton: true,
    eager,
    requiredVersion: deps['@hookform/resolvers'],
  },
  yup: {
    singleton: true,
    eager,
    requiredVersion: deps.yup,
  },
  'prop-types': {
    singleton: true,
    eager,
    requiredVersion: deps['prop-types'],
  },
  lodash: {
    singleton: true,
    eager,
    requiredVersion: deps.lodash,
  },
  axios: {
    singleton: true,
    eager,
    requiredVersion: deps.axios,
  },
  'react-transition-group': {
    singleton: true,
    eager,
    requiredVersion: deps['react-transition-group'],
  },
  'opennebula-react-table': {
    singleton: true,
    eager,
    requiredVersion: deps['opennebula-react-table'],
  },
  notistack: {
    singleton: true,
    eager,
    requiredVersion: deps.notistack,
  },
  'd3-scale': {
    singleton: true,
    eager,
    requiredVersion: deps['d3-scale'],
  },
  '@emotion/react': {
    singleton: true,
    eager,
    requiredVersion: deps['@emotion/react'],
  },
  '@emotion/css': {
    singleton: true,
    eager,
    requiredVersion: deps['@emotion/css'],
  },
  '@emotion/styled': {
    singleton: true,
    eager,
    requiredVersion: deps['@emotion/styled'],
  },
})

module.exports = sharedDeps
