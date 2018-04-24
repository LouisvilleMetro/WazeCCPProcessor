var path = require('path');
var ZipPlugin = require('zip-webpack-plugin');

module.exports = {
    entry: './src/waze-data-download.ts',
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
    output: {
      libraryTarget: 'commonjs',
      filename: 'waze-data-download.js',
      path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new ZipPlugin({
          // OPTIONAL: defaults to the Webpack output path (above)
          // can be relative (to Webpack output path) or absolute
          path: '../../',
     
          // OPTIONAL: defaults to the Webpack output filename (above) or,
          // if not present, the basename of the path
          filename: 'waze-data-download.zip',
        })
      ]
  };