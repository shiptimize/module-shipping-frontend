var path = require("path");
const webpack = require('webpack');
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const devMode = process.env.NODE_ENV !== 'production'
const WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = { 
  output: {
    path: path.resolve(__dirname, "../js/"),
    filename: "[name].js",
    publicPath: "/js/"
  }, 
  mode: devMode ? 'development' : 'production',
  entry: {
    'shiptimize':  './shiptmize.js',
    'shiptimize-admin':'./shiptimize-admin.js'
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: true // set to true if you want JS source maps
      }),
      new OptimizeCSSAssetsPlugin({})
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: '../js/[name].css',
      chunkFilename: devMode ? '[id].css' : '[id].[hash].css',
    }),
     new WebpackShellPlugin({
      onBuildStart:['echo "Webpack Start"'], 
      onBuildExit:[
        'echo "onBuildExit"',
        'cp -v ../js/shiptimize-admin.js ../app/code/Shiptimize/Shipping/view/adminhtml/web/js/',
        'cp -v ../js/shiptimize-admin.css ../app/code/Shiptimize/Shipping/view/adminhtml/web/css/',
        'cp -v ../js/shiptimize.css ../app/code/Shiptimize/Shipping/view/frontend/web/css/',
        'cp -v ../js/shiptimize.js ../app/code/Shiptimize/Shipping/view/frontend/web/js/',
        'echo "Webpack End"'
      ]
    })  
  ],
  devtool: 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: { presets: ["es2015"] }
        }
      },
      {
        test: /\.(png|jpg|gif)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192
            }
          }
        ]
      },
      {
        test: /(\.scss|\.css)$/, //css is necessary if we import libs that use it. 
        use: [
           MiniCssExtractPlugin.loader, 
          { loader: 'css-loader', options: { url: false, sourceMap: true } },
          { loader: 'sass-loader', options: { sourceMap: true } }            
        ],
      },
      {
          test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
          use: [{
              loader: 'file-loader',
              options: {
                  name: '[name].[ext]',
                  outputPath: 'fonts/'
              }
          }]
      }
    ]
  }
};