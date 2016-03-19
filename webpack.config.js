var path = require('path');
var ClosureCompilerPlugin = require('webpack-closure-compiler');

module.exports = {

  entry: [path.join(__dirname, 'index.js')],
  module: {loaders: [{test: /\.js$/, exclude: /node_modules/, loaders: ['babel-loader']}]},
  output: {path: path.join(__dirname, '/dist/'), filename: 'chempict.min.js'},
  plugins: [new ClosureCompilerPlugin({
    compiler:
        {language_in: 'ECMASCRIPT6', language_out: 'ECMASCRIPT5', compilation_level: 'ADVANCED'},
    concurrency: 4,
  })]
};
