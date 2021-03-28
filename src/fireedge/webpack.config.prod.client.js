const path = require('path')
const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')
const LoadablePlugin = require('@loadable/webpack-plugin')
const { defaultApps, defaultFileStats, defaultAppName } = require('./src/server/utils/constants/defaults')

const js = {
  test: /\.js$/,
  loader: 'babel-loader',
  include: path.resolve(__dirname, 'src')
}

const bundle = ({ assets = false, name = 'flow' }) => {
  const plugins = [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new LoadablePlugin({ filename: name + defaultFileStats })
  ]
  if (assets) {
    plugins.push(new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src', 'client', 'assets'),
          to: path.resolve(__dirname, 'dist', 'client', 'assets')
        }
      ]
    }))
  }
  return {
    mode: 'production',
    entry: path.resolve(__dirname, 'src', 'client', `${name}.js`),
    target: 'web',
    output: {
      path: path.resolve(__dirname, 'dist', 'client'),
      filename: `bundle.${name}.js`,
      publicPath: `/${defaultAppName}/client/`
    },
    stats: {
      warnings: false
    },
    plugins,
    module: {
      rules: [js]
    },
    devtool: ''
  }
}

module.exports = () => Object.entries(defaultApps).map(([key, values]) =>
  bundle({ ...values, name: key })
)
