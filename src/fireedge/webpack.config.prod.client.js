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
const TerserPlugin = require('terser-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const LoadablePlugin = require('@loadable/webpack-plugin')
const TimeFixPlugin = require('time-fix-plugin')
const {
  defaultApps,
  defaultFileStats,
  defaultAppName,
} = require('./src/server/utils/constants/defaults')

const js = {
  test: /\.js$/,
  loader: 'babel-loader',
  include: path.resolve(__dirname, 'src'),
}
const css = {
  test: /\.css$/i,
  use: ['style-loader', 'css-loader'],
}

const images = {
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
}

/**
 * Bundle app.
 *
 * @param {{ assets: boolean, name: string }} params - webpack build app
 * @returns {webpack.Configuration} webpack config
 */
const bundle = ({ assets = false, name = 'sunstone' }) => {
  const plugins = [
    new TimeFixPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      },
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new LoadablePlugin({ filename: name + defaultFileStats }),
  ]
  if (assets) {
    plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'src', 'client', 'assets'),
            to: path.resolve(__dirname, 'dist', 'client', 'assets'),
          },
        ],
      })
    )
  }

  return {
    mode: 'production',
    entry: path.resolve(__dirname, 'src', 'client', `${name}.js`),
    target: 'web',
    output: {
      path: path.resolve(__dirname, 'dist', 'client'),
      filename: `bundle.${name}.js`,
      publicPath: `/${defaultAppName}/client/`,
    },
    stats: {
      warnings: false,
    },
    resolve: {
      alias: {
        process: 'process/browser',
      },
    },
    plugins,
    optimization: {
      minimizer: [new TerserPlugin({ extractComments: false })],
    },
    module: {
      rules: [js, css, images],
    },
  }
}

/**
 * @returns {webpack.Configuration[]} - list of configuration
 */
module.exports = () =>
  Object.entries(defaultApps).map(([key, values]) =>
    bundle({ ...values, name: key })
  )
