const path = require('path');

module.exports = {
  entry: './src/my_solver.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  devServer: {
    static: {
        directory: path.join(__dirname, 'public'),
        publicPath: "/",
    },
    port: 8080,
  },
};
