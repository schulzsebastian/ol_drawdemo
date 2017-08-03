var webpack = require('webpack')

module.exports = {
  entry: {
    'bundle': './src/index.js',
    'bundle.min': './src/index.js'
  },
  output: {
    filename: './dist/[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['es2015']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=100000'
      }
    ]
  },
  resolve: {
    alias: {
      vue: 'vue/dist/vue.js',
      jquery: 'jquery/src/jquery'
    }
  },
  plugins: [
    //new webpack.optimize.UglifyJsPlugin({include: /\.min\.js$/, minimize: true})
  ]
}
