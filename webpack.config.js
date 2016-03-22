var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: [path.join(__dirname, 'src', 'index.js')],
  module: {
    loaders:
        [{test: /\.js$/, exclude: /node_modules/, loader: 'babel', query: {presets: ['es2015']}}]
  },
  output: {
    path: path.join(__dirname, '/dist/'),
    filename: 'chempict.min.js',
    libraryTarget: 'umd',
    library: 'ChemPict'
  },
  plugins: [new webpack.optimize.UglifyJsPlugin({compress: {warnings: false}})]
};
