const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

const librariesHost = process.env.LIBRARIES_HOST;

if (!librariesHost) {
  throw new Error('LIBRARIES_HOST must be defined');
}

module.exports = {
  entry: './src/index.ts',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        //H5P jquery should be exported under H5P variable
        test: require.resolve(path.resolve(__dirname, 'src/vendor/js', 'jquery')),
        use: 'exports-loader?exports=H5P'
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.ts', '.js'],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
   splitChunks: {
     cacheGroups: {
       vendor: {
         test: /[\\/]vendor[\\/]/,
         name: 'vendor',
         chunks: 'all',
       },
     },
   },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      favicon: 'assets/favicon.ico',
    }),
    new webpack.DefinePlugin({
      'process.env.LIBRARIES_HOST': JSON.stringify(librariesHost)
    }),
    new webpack.ProgressPlugin(),
  ],
};
