//const Ownable = artifacts.require("Ownable");
//const Pausable = artifacts.require("Pausable");
//const SafeMath = artifacts.require("SafeMath");
//const UserFactory = artifacts.require("UserFactory");
//const usingProvable = artifacts.require("usingProvable");
const Recycler = artifacts.require("Recycler");

module.exports = function(deployer) {
  deployer.deploy(Recycler, {gas: 6000000, value: 1000000000000000000});
};
