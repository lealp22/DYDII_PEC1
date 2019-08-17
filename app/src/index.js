import Web3 from "web3";
//import metaCoinArtifact from "../../build/contracts/MetaCoin.json";
import metaCoinArtifact from "../MetaCoin.json";

const App = {
  web3: null,
  account: null,
  meta: null,

  start: async function() {
    const { web3 } = this;

	// Log
	console.log("** start **");	
	console.log("This: ", this);
	console.log("Web3: ", web3);

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = metaCoinArtifact.networks[networkId];
      this.meta = new web3.eth.Contract(
        metaCoinArtifact.abi,
        deployedNetwork.address,
      );

	  // Log
	  console.log("networkId: ", networkId);
	  console.log("deployedNetwork.address: ", deployedNetwork.address);
	  console.log("deployedNetwork: ", deployedNetwork);

      // get accounts
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];

	  // Log
	  console.log("Account: ", this.account);
	  console.log("Accounts: ", accounts);

      this.refreshBalance();
    } catch (error) {
      console.error("Could not connect to contract or chain.");
	  // Log
	  console.log("error: ", error);	  
    }
  },

  refreshBalance: async function() {
    const { getBalance } = this.meta.methods;
    const balance = await getBalance(this.account).call();
	
	// Log
	console.log("** refreshBalance **");
	console.log("this.account: ", this.account);	
	console.log("balance: ", balance);	

    const accountElement = document.getElementsByClassName("account")[0];
    accountElement.innerHTML = this.account;

    const balanceElement = document.getElementsByClassName("balance")[0];
    balanceElement.innerHTML = balance;

  },

  sendCoin: async function() {
    const amount = parseInt(document.getElementById("amount").value);
    const receiver = document.getElementById("receiver").value;
	
	// Log
	console.log("** sendCoin **");
	console.log("amount: ", amount);	
	console.log("receiver: ", receiver);	

    this.setStatus("Initiating transaction... (please wait)");

    const { sendCoin } = this.meta.methods;
    await sendCoin(receiver, amount).send({ from: this.account });

    this.setStatus("Transaction complete!");
    this.refreshBalance();
  },

  setStatus: function(message) {
    const status = document.getElementById("status");
    status.innerHTML = message;
  },
};

window.App = App;

window.addEventListener("load", function() {

  // Log
  console.log("** load **");
  console.log("window.ethereum: ", window.ethereum);	
	
  if (window.ethereum) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum);
    window.ethereum.enable(); // get permission to access accounts
  } else {
    console.warn(
      "No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live",
    );
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://127.0.0.1:9545"),
    );
  }

  App.start();
});
