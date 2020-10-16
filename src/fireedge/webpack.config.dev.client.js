const path = require('path');
const webpack = require('webpack');
const { defaultWebpackMode } = require('./src/server/utils/constants/defaults');

const js = {
  test: /\.js$/,
  loader: 'babel-loader',
  include: path.resolve(__dirname, 'src', 'client')
};

module.exports = {
  mode: defaultWebpackMode,
  entry: [
    'webpack-hot-middleware/client',
    path.resolve(__dirname, 'src', 'client', 'front-app.js')
  ],
  target: 'web',
  output: {
    path: path.resolve(__dirname, 'src', 'client', 'front-app.js'),
    filename: 'bundle.js',
    publicPath: '/client'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(defaultWebpackMode)
      }
    })
  ],
  module: {
    rules: [js]
  },
  devtool: 'inline-source-map'
};
