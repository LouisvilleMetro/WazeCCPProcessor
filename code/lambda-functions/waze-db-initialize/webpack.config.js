var path = require('path');
var ZipPlugin = require('zip-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    entry: './src/waze-db-initialize.ts',
    target: 'node',
    devtool: 'inline-source-map',
    mode: 'development',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ]
    },
    externals: ['pg-native'],
    output: {
      libraryTarget: 'commonjs',
      filename: 'waze-db-initialize.js',
      path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new CopyWebpackPlugin([
          '../../sql/2.0-00-initialize-schema-and-roles.sql',
          '../../sql/2.0-01-create-tables.sql',
          '../../sql/2.0-02-insert-defaults.sql'
        ]),
        new ZipPlugin({
          // OPTIONAL: defaults to the Webpack output path (above)
          // can be relative (to Webpack output path) or absolute
          path: '../../',
     
          // OPTIONAL: defaults to the Webpack output filename (above) or,
          // if not present, the basename of the path
          filename: 'waze-db-initialize.zip',
        })
      ]
  };