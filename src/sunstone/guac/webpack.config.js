var path = require('path');

module.exports = {
  entry: './app.js',
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'guac.js'
  },
  stats: {
    warningsFilter: /^(?!CriticalDependenciesWarning$)/
  }
};