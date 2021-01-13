const path = require('path')
const webpack = require('webpack')
const { defaultWebpackMode, defaultAppName } = require('./src/server/utils/constants/defaults')

const js = {
  test: /\.js$/,
  loader: 'babel-loader',
  include: path.resolve(__dirname, 'src', 'client'),
  options: {
    babelrc: true,
    plugins: ['react-hot-loader/babel']
  }
}
const appName = defaultAppName ? `/${defaultAppName}` : ''
const bundle = () => {
  const devPathFile = path.resolve(__dirname, 'src', 'client', 'dev', 'index.js')
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
      'react-hot-loader/patch',
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
