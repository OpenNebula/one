/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
const path = require('path')
const webpack = require('webpack')
const {
  defaultWebpackMode,
  defaultApps,
  defaultAppName,
} = require('./src/server/utils/constants/defaults')

const HOT_MIDDLEWARE_SCRIPT =
  'webpack-hot-middleware/client?path=/__webpack_hmr'

const APP_ENTRIES = Object.keys(defaultApps).reduce(
  (entries, app) => ({
    ...entries,
    [app]: [
      path.resolve(__dirname, `src/client/${app}.js`),
      // Include the hot middleware with each entrypoint
      HOT_MIDDLEWARE_SCRIPT,
    ],
  }),
  {}
)

const getDevConfiguration = () => {
  try {
    const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
    const TimeFixPlugin = require('time-fix-plugin')

    const appName = defaultAppName ? `/${defaultAppName}` : ''

    /** @type {webpack.Configuration} */
    return {
      mode: defaultWebpackMode,
      entry: { ...APP_ENTRIES },
      output: {
        filename: 'bundle.[name].js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: `${appName}/client`,
      },
      watchOptions: {
        poll: 1000,
        ignored: /node_modules/,
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
                  plugins: ['react-refresh/babel'],
                },
              },
            ],
          },
          {
            test: /\.css$/i,
            use: ['style-loader', 'css-loader'],
          },
          {
            test: /\.(png|jpe?g|gif)$/i,
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: '[path][name].[ext]',
                  outputPath: 'assets/images/',
                },
              },
            ],
          },
        ],
      },
      resolve: {
        extensions: ['.js'],
        alias: {
          process: 'process/browser',
        },
      },
      plugins: [
        new TimeFixPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        ReactRefreshPlugin &&
          new ReactRefreshPlugin({
            overlay: {
              sockIntegration: 'whm',
            },
          }),
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify(defaultWebpackMode),
          },
        }),
        new webpack.ProvidePlugin({
          process: 'process/browser',
        }),
      ],
      devtool: 'inline-source-map',
    }
  } catch (e) {
    console.log('Error in webpack dev configuration: ', e)
  }
}

module.exports = getDevConfiguration()
