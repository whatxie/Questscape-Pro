const webpack = require('webpack');

module.exports = {
  publicPath: './',
  outputDir: undefined,
  assetsDir: undefined,
  indexPath: 'index.html',
  filenameHashing: false,

  devServer: {
    port: 8080,
    open: false,
    hot: true,
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },

  chainWebpack: config => {
    // 禁用预加载
    config.plugins.delete('preload');
    config.plugins.delete('prefetch');
    
    // 配置构建选项
    config.optimization.splitChunks(false);
    
    // 设置入口文件
    config.entry('app').add('./src/main.js');
  },

  configureWebpack: {
    resolve: {
      fallback: {
        path: require.resolve('path-browserify'),
        stream: require.resolve('stream-browserify')
      }
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer']
      })
    ]
  },

  productionSourceMap: false,

  css: {
    extract: false,
    sourceMap: false
  }
};