const Ownable = artifacts.require("Ownable");
const Pausable = artifacts.require("Pausable");
const SafeMath = artifacts.require("SafeMath");
const usingProvable = artifacts.require("usingProvable");
const Recycler = artifacts.require("Recycler");

module.exports = function(deployer) {

  deployer.deploy(Pausable);
  deployer.link(Pausable, Recycler);
  deployer.deploy(SafeMath);
  deployer.link(SafeMath, Recycler);
  deployer.deploy(usingProvable);
  deployer.link(usingProvable, Recycler);
  deployer.deploy(Recycler);
};
