/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const path = require('path');
const {
  defaultWebpackMode,
  defaultWebpackDevTool
} = require('./src/utils/constants/defaults');

const js = {
  test: /\.js$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: ['@babel/preset-env', '@babel/preset-react'],
      plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-proposal-nullish-coalescing-operator',
        '@babel/plugin-proposal-optional-chaining'
      ]
    }
  }
};

const alias = {
  alias: {
    server: path.resolve(__dirname, 'src/'),
    client: path.resolve(__dirname, 'src/public/')
  },
  extensions: ['.js']
};

const serverConfig = {
  mode: defaultWebpackMode,
  target: 'node',
  node: {
    __dirname: false
  },
  externals: [nodeExternals()],
  entry: {
    'index.js': path.resolve(__dirname, 'src/index.js')
  },
  module: {
    rules: [js]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]'
  },
  resolve: alias,
  devtool: defaultWebpackDevTool
};

const clientConfig = {
  mode: defaultWebpackMode,
  target: 'web',
  entry: {
    'app.js': path.resolve(__dirname, 'src/public/front-app.js')
  },
  module: {
    rules: [js]
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist/public'),
    filename: '[name]'
  },
  resolve: alias,
  devtool: defaultWebpackDevTool
};

module.exports = (env, argv) => {
  if (argv && argv.mode !== defaultWebpackMode) {
    [clientConfig.mode, serverConfig.mode] = Array(2).fill('production');
    [clientConfig.devtool, serverConfig.devtool] = Array(2).fill('');
  } else if (argv && argv.session && argv.session === 'false') {
    const pluginProcessEnv = [
      new webpack.DefinePlugin({
        'process.env': {
          session: JSON.stringify(argv.session)
        }
      })
    ];
    clientConfig.plugins = pluginProcessEnv;
    serverConfig.plugins = pluginProcessEnv;
  }
  let build = [];
  if (env) {
    switch (env) {
      case 'front':
        build.push(clientConfig);
        break;
      case 'node':
        build.push(serverConfig);
        break;
    }
  } else {
    build = [serverConfig, clientConfig];
  }
  return build;
};
