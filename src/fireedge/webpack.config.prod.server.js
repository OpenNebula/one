const path = require('path')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
const CopyPlugin = require('copy-webpack-plugin')

const js = {
  test: /\.js$/,
  loader: 'babel-loader',
  include: path.resolve(__dirname, 'src')
}

module.exports = {
  mode: 'production',
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
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'fireedge-server.conf'),
          to: path.resolve(__dirname, 'dist', 'fireedge-server.conf')
        }
      ]
    })
  ],
  module: {
    rules: [js]
  },
  devtool: ''
}
