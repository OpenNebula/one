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
const LiveReloadPlugin = require('webpack-livereload-plugin');
const path = require('path');
const { defaultProtocolHotReload } = require('./src/utils/server');

const {
  defaultWebpackMode,
  defaultWebpackDevTool,
  defaultIP,
  defaultPortHotReload
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

const fonts = {
  test: /\.(ttf|woff|woff2|svg|eot)$/i,
  include: [path.resolve(__dirname, 'src/public/assets/fonts/')],
  use: {
    loader: 'file-loader',
    options: {
      name: '[name].[ext]',
      outputPath: 'fonts'
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
    rules: [js, fonts]
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
    rules: [js, fonts]
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
  const build = [];
  const systemVars = {};
  const plugins = [];

  if (argv && argv.mode !== defaultWebpackMode) {
    [clientConfig.mode, serverConfig.mode] = Array(2).fill('production');
    [clientConfig.devtool, serverConfig.devtool] = Array(2).fill('');
  }

  if (env) {
    if (env.ssr) {
      systemVars['process.env.ssr'] = true;
    }
    if (env.hotreload) {
      systemVars['process.env.hotreload'] = true;
      plugins.push(
        new LiveReloadPlugin({
          port: parseInt(defaultPortHotReload, 10),
          host: defaultIP,
          protocol: defaultProtocolHotReload
        })
      );
    }

    plugins.push(new webpack.DefinePlugin(systemVars));
    clientConfig.plugins = plugins;
    serverConfig.plugins = plugins;

    if (env.front) {
      build.push(clientConfig);
    }
    if (env.node) {
      build.push(serverConfig);
    }
  }
  return build;
};
