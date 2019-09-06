const Recycler = artifacts.require("Recycler");

module.exports = function(deployer) {
  deployer.deploy(Recycler, {gas: 6500000, value: 1000000000000000000});
};
