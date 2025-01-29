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

const moduleName = 'host'
const path = require('path')
const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const LoadablePlugin = require('@loadable/webpack-plugin')
const TimeFixPlugin = require('time-fix-plugin')
const ExternalRemotesPlugin = require('external-remotes-plugin')
const {
  defaultApps,
  defaultFileStats,
  defaultAppName,
} = require('./src/server/utils/constants/defaults')
const sharedDeps = require('./src/modules/sharedDeps')
const { ModuleFederationPlugin } = require('webpack').container
const ONE_LOCATION = process.env.ONE_LOCATION
const ETC_LOCATION = ONE_LOCATION ? `${ONE_LOCATION}/etc` : '/etc'
const mode = process.env.NODE_ENV || 'production'

const remotesConfigPath =
  mode === 'production'
    ? `${ETC_LOCATION}/one/fireedge/sunstone/remotes-config.json`
    : path.resolve(__dirname, 'etc', 'sunstone', 'remotes-config.json')

const remotesConfig = require(remotesConfigPath)

const configuredRemotes = Object.entries(remotesConfig)
  .filter(([_, { name }]) => name !== moduleName)
  .reduce((acc, [module, { name }]) => {
    acc[
      `@${module}`
    ] = `${name}@[window.__REMOTES_MODULE_CONFIG__.${module}.entry]`

    return acc
  }, {})

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
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new LoadablePlugin({ filename: name + defaultFileStats }),
    new ModuleFederationPlugin({
      name: moduleName,
      remotes: configuredRemotes,
      shared: sharedDeps({ eager: true }),
    }),
    new ExternalRemotesPlugin(),
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
    mode,
    entry: path.resolve(
      __dirname,
      'src',
      'client',
      `${name === 'sunstone' ? 'bootstrap' : name}.js`
    ),
    target: 'web',
    devtool: 'source-map',
    experiments: {
      topLevelAwait: true,
    },
    output: {
      path: path.resolve(__dirname, 'dist', 'client'),
      filename: `bundle.${name}.js`,
      chunkFilename: '[contenthash].[id].js',
      uniqueName: moduleName,
      publicPath: `/${defaultAppName}/client/`,
    },
    stats: {
      warnings: false,
      errorDetails: true,
    },
    resolve: {
      alias: {
        process: 'process/browser',
      },
    },
    plugins,
    optimization: {
      minimizer: [new TerserPlugin({ extractComments: false })],
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
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
