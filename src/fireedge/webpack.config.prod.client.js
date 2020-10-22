const path = require('path')
const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')

const js = {
  test: /\.js$/,
  loader: 'babel-loader',
  include: path.resolve(__dirname, 'src')
}

const bundle = ({ assets = false, name = 'fireedge' }) => {
  const plugins = [new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify('production')
    }
  })]
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
      publicPath: '/client'
    },
    plugins,
    module: {
      rules: [js]
    },
    devtool: ''
  }
}

module.exports = [bundle({ assets: true }), bundle({ name: 'provision' })]
