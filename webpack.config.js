const CompressionPlugin = require('compression-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const zlib = require('zlib')
const path = require('path')

const generalConfig = {
  mode: 'production',
  optimization: {
    sideEffects: false,
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
      cleanOnceBeforeBuildPatterns: [path.resolve(__dirname, './dist')],
    }),
    new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.js?$/,
      threshold: 0,
      minRatio: Infinity,
    }),
    new CompressionPlugin({
        filename: '[path][base].br',
        algorithm: 'brotliCompress',
        test: /\.js?$/,
        compressionOptions: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 11
        },
        threshold: 0,
        minRatio: Infinity,
        deleteOriginalAssets: false
    })
  ],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  }
}

const moduleConfig = {
  entry: path.resolve(__dirname, './src/index.js'),
  target: ['web', 'es2021'],
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'compiled.es6.js',
    library: {
      type: 'module',
    },
  },
  experiments: {
    outputModule: true,
  },
}

const nodeConfig = {
  entry: path.resolve(__dirname, './src/index.js'),
  target: 'node',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'compiled.node.js',
    library: {
      type: 'commonjs'
    },
  },
};

const browserConfig = {
  entry: path.resolve(__dirname, './src/index.js'),
  target: 'web',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'compiled.browser.js',
    library: {
      name: 'SimpleDialogue',
      type: 'umd'
    },
  },
};

module.exports = () => {
  Object.assign(moduleConfig, generalConfig);
  Object.assign(nodeConfig, generalConfig);
  Object.assign(browserConfig, generalConfig);

  return [moduleConfig, nodeConfig, browserConfig];
};
