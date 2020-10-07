const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

const js = {
  test: /\.js$/,
  loader: 'babel-loader',
  include: path.resolve(__dirname, 'src')
};

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, 'src', 'client', 'front-app.js'),
  target: 'web',
  output: {
    path: path.resolve(__dirname, 'dist', 'client'),
    filename: 'bundle.js',
    publicPath: '/client'
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
          from: path.resolve(__dirname, 'src', 'client', 'assets'),
          to: path.resolve(__dirname, 'dist', 'client', 'assets')
        }
      ]
    })
  ],
  module: {
    rules: [js]
  },
  devtool: ''
};
