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

const path = require('path')
const webpack = require('webpack')
const TimeFixPlugin = require('time-fix-plugin')
const { defaultWebpackMode, defaultAppName } = require('./src/server/utils/constants/defaults')

const appName = defaultAppName ? `/${defaultAppName}` : ''

module.exports = {
  mode: defaultWebpackMode,
  entry: [
    'webpack-hot-middleware/client',
    path.resolve(__dirname, 'src/client/dev/index.js')
  ],
  output: {
    filename: 'bundle.dev.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: `${appName}/client`
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src/client'),
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: true,
              plugins: ['react-hot-loader/babel']
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js'],
    alias: {
      process: 'process/browser'
    }
  },
  plugins: [
    new TimeFixPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(defaultWebpackMode)
      }
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser'
    })
  ],
  devtool: 'inline-source-map'
}
