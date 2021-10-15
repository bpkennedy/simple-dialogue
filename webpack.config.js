const CompressionPlugin = require('compression-webpack-plugin')
const zlib = require('zlib')
const path = require('path')

module.exports = {
  entry: path.resolve(__dirname, 'src/index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index_bundle.js',
    library: '$',
    libraryTarget: 'umd',
  },
  plugins: [
    new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.(js)$/,
      threshold: 1,
      minRatio: Infinity,
    }),
    new CompressionPlugin({
      filename: '[path][base].br',
      algorithm: 'brotliCompress',
      test: /\.(js)$/,
      compressionOptions: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 11
      },
      threshold: 1,
      minRatio: Infinity,
      deleteOriginalAssets: false
    }
  )],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
  mode: 'production',
}
