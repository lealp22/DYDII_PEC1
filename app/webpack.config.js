const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: 'development',
  entry: "./src/index.js",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new CopyWebpackPlugin([
				{ from: "./src/index.html", to: "index.html" },
				{ from: "../build/contracts/MetaCoin.json", to: "MetaCoin.json" },
				{ from: "../build/contracts/MetaCoin.json", to: "../MetaCoin.json" },
        { from: "../build/contracts/ConvertLib.json", to: "ConvertLib.json" },
        { from: "../build/contracts/Migrations.json", to: "Migrations.json" }
			  ]),
  ],
  devServer: { contentBase: path.join(__dirname, "dist"), compress: true },
};
