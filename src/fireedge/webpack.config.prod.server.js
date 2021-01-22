const path = require('path')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
const CopyPlugin = require('copy-webpack-plugin')
const { defaultProductionWebpackMode } = require('./src/server/utils/constants/defaults')

const js = {
  test: /\.js$/,
  loader: 'babel-loader',
  include: path.resolve(__dirname, 'src')
}

module.exports = {
  mode: defaultProductionWebpackMode,
  entry: path.resolve(__dirname, 'src', 'server'),
  target: 'node',
  node: {
    __dirname: false
  },
  externals: [nodeExternals()],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js'
  },
  stats: {
    warnings: false
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(defaultProductionWebpackMode)
      }
    })
  ],
  module: {
    rules: [js]
  },
  devtool: ''
}
