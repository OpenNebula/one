const path = require('path')
const webpack = require('webpack')
const { defaultWebpackMode, defaultAppName } = require('./src/server/utils/constants/defaults')

const appName = defaultAppName ? `/${defaultAppName}` : ''

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: defaultWebpackMode,
  entry: [
    'webpack-hot-middleware/client',
    path.resolve(__dirname, 'src/client/dev/index.js')
  ],
  output: {
    filename: 'bundle.dev.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: `${appName}/client`
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src/client'),
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: true,
              plugins: ['react-hot-loader/babel']
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js']
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(defaultWebpackMode)
      }
    })
  ],
  devtool: 'inline-source-map'
}
