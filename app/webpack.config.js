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
        { from: "../build/contracts/Recycler.json", to: "Recycler.json" },
        { from: "../build/contracts/Recycler.json", to: "../Recycler.json" },
        { from: "../build/contracts/SafeMath.json", to: "SafeMath.json" },
        { from: "../build/contracts/Migrations.json", to: "Migrations.json" },
        { from: "../build/contracts/Buffer.json", to: "Buffer.json" },  
        { from: "../build/contracts/CBOR.json", to: "CBOR.json" },
        { from: "../build/contracts/OracleAddrResolverI.json", to: "OracleAddrResolverI.json" }, 
        { from: "../build/contracts/Ownable.json", to: "Ownable.json" }, 
        { from: "../build/contracts/Pausable.json", to: "Pausable.json" },  
        { from: "../build/contracts/ProvableI.json", to: "ProvableI.json" },   
        { from: "../build/contracts/solcChecker.json", to: "solcChecker.json" },   
        { from: "../build/contracts/UserFactory.json", to: "UserFactory.json" },         
        { from: "../build/contracts/usingProvable.json", to: "usingProvable.json" } 
			  ]),
  ],
  devServer: { contentBase: path.join(__dirname, "dist"), compress: true },
};
