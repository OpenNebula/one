const path = require('path')
const webpack = require('webpack')
const { defaultWebpackMode } = require('./src/server/utils/constants/defaults')

const js = {
  test: /\.js$/,
  loader: 'babel-loader',
  include: path.resolve(__dirname, 'src', 'client')
}

const bundle = ({ name = 'fireedge' } = {}) => {
  const plugins = [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(defaultWebpackMode)
      }
    })
  ]
  return {
    mode: defaultWebpackMode,
    entry: [
      'webpack-hot-middleware/client',
      path.resolve(__dirname, 'src', 'client', 'dev.js')
    ],
    target: 'web',
    output: {
      path: path.resolve(__dirname, 'src', 'client', 'dev.js'),
      filename: 'bundle.dev.js',
      publicPath: '/client'
    },
    plugins,
    module: {
      rules: [js]
    },
    devtool: 'inline-source-map'
  }
}

module.exports = bundle()
