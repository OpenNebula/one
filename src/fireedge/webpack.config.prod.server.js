const path = require('path')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
const TimeFixPlugin = require('time-fix-plugin')
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
  resolve: {
    alias: {
      process: 'process/browser'
    }
  },
  plugins: [
    new TimeFixPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(defaultProductionWebpackMode)
      }
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser'
    }),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1
    })
  ],
  module: {
    rules: [js]
  }
}
