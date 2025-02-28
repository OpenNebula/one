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
const moduleName = 'UtilsModule'
const path = require('path')
const { ModuleFederationPlugin } = require('webpack').container
const sharedDeps = require('../sharedDeps')
const ExternalRemotesPlugin = require('external-remotes-plugin')
const ONE_LOCATION = process.env.ONE_LOCATION
const ETC_LOCATION = ONE_LOCATION ? `${ONE_LOCATION}/etc` : '/etc'
const mode = process.env.NODE_ENV || 'production'
const build = process.env.WEBPACK_BUILD_MODE || 'development'

const remotesConfigPath =
  build === 'production'
    ? `${ETC_LOCATION}/one/fireedge/sunstone/remotes-config.json`
    : path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        'etc',
        'sunstone',
        'remotes-config.json'
      )
const remotesConfig = require(remotesConfigPath)
const configuredRemotes = Object.entries(remotesConfig)
  .filter(([_, { name }]) => name !== moduleName)
  .reduce((acc, [module, { name }]) => {
    acc[
      `@${module}`
    ] = `${name}@[window.__REMOTES_MODULE_CONFIG__.${module}.entry]`

    return acc
  }, {})

module.exports = {
  mode,
  entry: path.resolve(__dirname, 'index.js'),
  output: {
    path: path.resolve(__dirname, '../../../', 'dist', 'modules', moduleName),
    chunkFilename: '[contenthash].[id].js',
    filename: '[name].bundle.js',
    uniqueName: moduleName,
    publicPath: 'auto',
  },
  plugins: [
    new ModuleFederationPlugin({
      name: moduleName,
      filename: 'remoteEntry.js',
      exposes: {
        '.': path.resolve(__dirname, 'index.js'),
      },
      remotes: configuredRemotes,
      shared: sharedDeps({ eager: false }),
    }),
    new ExternalRemotesPlugin(),
  ],

  optimization: {
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
  },
  resolve: {
    alias: {
      '@modules': path.resolve(__dirname, '../'),
    },
  },
  devtool: 'source-map',
  stats: {
    errorDetails: true,
    warnings: true,
  },
  experiments: {
    topLevelAwait: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        include: path.resolve(__dirname, '../../'),
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
}
