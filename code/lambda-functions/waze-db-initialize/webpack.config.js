var path = require('path');
var ZipPlugin = require('zip-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    entry: './src/waze-db-initialize.ts',
    target: 'node',
    mode: 'production',
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
          '../../sql/initialize-schema-and-roles.sql',
          '../../sql/schema.sql'
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