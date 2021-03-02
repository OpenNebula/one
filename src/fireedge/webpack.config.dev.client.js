const path = require('path')

const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const webpack = require('webpack')

const { defaultAppName } = require('./src/server/utils/constants/defaults')

const appName = defaultAppName ? `/${defaultAppName}` : ''

const devPathFile = path.resolve(__dirname, 'src/client/dev/index.js')

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: 'development',
  entry: {
    main: ['webpack-hot-middleware/client', devPathFile]
  },
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
              plugins: [require.resolve('react-refresh/babel')]
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
    new ReactRefreshPlugin({
      overlay: {
        sockIntegration: 'whm'
      }
    })
  ],
  devtool: 'eval-source-map'
}
