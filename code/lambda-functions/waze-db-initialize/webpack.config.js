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
          // cannot do wildcards because it messes with watches
          '../../sql/2.01-00-initialize-schema-and-roles.sql',
          '../../sql/2.01-01-create-tables.sql',
          '../../sql/2.01-02-insert-defaults.sql',
          '../../sql/3.0-00-add-readonly-role.sql',
          '../../sql/3.0-01-add-columns.sql',
          '../../sql/3.0-02-indexes.sql',
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