const path = require('path')
const webpack = require('webpack')
const { defaultWebpackMode, defaultAppName } = require('./src/server/utils/constants/defaults')

const js = {
  test: /\.js$/,
  loader: 'babel-loader',
  include: path.resolve(__dirname, 'src', 'client')
}
const appName = defaultAppName? `/${defaultAppName}` : ''
const bundle = () => {
  const devPathFile = path.resolve(__dirname, 'src', 'client', 'dev.js')
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
      devPathFile
    ],
    target: 'web',
    output: {
      path: devPathFile,
      filename: 'bundle.dev.js',
      publicPath: `${appName}/client`
    },
    plugins,
    module: {
      rules: [js]
    },
    devtool: 'inline-source-map'
  }
}

module.exports = bundle()
