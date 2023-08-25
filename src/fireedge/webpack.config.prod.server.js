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
const nodeExternals = require('webpack-node-externals')
const TerserPlugin = require('terser-webpack-plugin')
const TimeFixPlugin = require('time-fix-plugin')
const {
  defaultProductionWebpackMode,
} = require('./src/server/utils/constants/defaults')

const js = {
  test: /\.js$/,
  loader: 'babel-loader',
  include: path.resolve(__dirname, 'src'),
}

const css = {
  test: /\.css$/i,
  use: [
    {
      loader: 'css-loader',
      options: {
        esModule: false,
      },
    },
  ],
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

const worker = {
  test: /\.worker\.js$/,
  loader: 'worker-loader',
  options: {
    filename: '[name].js',
  },
}

module.exports = {
  mode: defaultProductionWebpackMode,
  entry: path.resolve(__dirname, 'src', 'server'),
  target: 'node',
  node: {
    __dirname: false,
  },
  externals: [nodeExternals()],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
  },
  stats: {
    warnings: false,
  },
  plugins: [
    new TimeFixPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(defaultProductionWebpackMode),
      },
    }),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
  optimization: {
    minimizer: [new TerserPlugin({ extractComments: false })],
  },
  module: {
    rules: [js, worker, css, images],
  },
}
