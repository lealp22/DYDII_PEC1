// from "web3";
//import metaCoinArtifact from "../../build/contracts/MetaCoin.json";
//import metaCoinArtifact from "../MetaCoin.json";

const App = {
    web3: null,
    account: null,
    meta: null,
  
    start: async function() {
      const { web3 } = this;
  
      this.setStatus("Inicializando");
      // Log
      console.log("** start **");	
      console.log("This: ", this);
  
      try {
        // get contract instance
    //    const networkId = await web3.eth.net.getId();
        const deployedNetwork = metaCoinArtifact.networks[networkId];
    //    this.meta = new web3.eth.Contract(
    //      metaCoinArtifact.abi,
    //      deployedNetwork.address,
    //    );
  
        // Log
        console.log("networkId: ", networkId);
        console.log("deployedNetwork.address: ", deployedNetwork.address);
        console.log("deployedNetwork: ", deployedNetwork);
  
        // get accounts
    //    const accounts = await web3.eth.getAccounts();
        this.account = accounts[0];
  
        // Log
        console.log("Account: ", this.account);
        console.log("Accounts: ", accounts);
  
        this.refreshBalance();
      } catch (error) {
        this.setStatus("Could not connect to contract or chain.");
        console.error("Could not connect to contract or chain.");
          console.error(error);	  
      }
    },
  
    refreshBalance: async function() {
      const { getBalance } = this.meta.methods;
      const balance = await getBalance(this.account).call();
      
      // Log
      console.log("** refreshBalance **");
      console.log("this.account: ", this.account);	
      console.log("balance: ", balance);	
  
      const balanceElement = document.getElementsByClassName("balance")[0];
      balanceElement.innerHTML = balance;
    },
  
    sendCoin: async function() {
      const amount = parseInt(document.getElementById("amount").value);
      const receiver = document.getElementById("receiver").value;
  
      this.setStatus("Enviando");
      
      // Log
      console.log("** sendCoin **");
      console.log("amount: ", amount);	
      console.log("receiver: ", receiver);	
  
      this.set("Initiating transaction... (please wait)");
  
      const { sendCoin } = this.meta.methods;
      await sendCoin(receiver, amount).send({ from: this.account });
  
      this.set("Transaction complete!");
      this.refreshBalance();
    },
  
    setStatus: function(message) {
      const status = document.getElementById("status");
      status.innerHTML = message;
    },
  
    addItem: function() {
  
      this.setStatus("Añadiendo...");
  
      const codigo   = document.getElementById("codigo");
      const cantidad = document.getElementById("cantidad");
      const medida   = document.getElementById("medida");
      let tabla      = document.getElementById("tabla-items");
  
  /*    console.log("codigo:", codigo.value);
      console.log("cantidad:", cantidad.value);
      console.log("medida:", medida.value);
      console.log("tabla-items:", tabla);
      console.log("tabla-items.rows.length:", tabla.rows.length);
  */
      for (var i = tabla.rows.length - 2; i > 0; i--) {
        tabla.rows[i+1].cells[0].innerHTML = tabla.rows[i].cells[0].innerHTML;
        tabla.rows[i+1].cells[1].innerHTML = tabla.rows[i].cells[1].innerHTML;
        tabla.rows[i+1].cells[2].innerHTML = tabla.rows[i].cells[2].innerHTML;
      }
  
      tabla.rows[1].cells[0].innerHTML = codigo.value;
      tabla.rows[1].cells[1].innerHTML = cantidad.value;
      tabla.rows[1].cells[2].innerHTML = medida.value;
  
      codigo.value = "";
      cantidad.value = 0;
      medida.value = "";
  
      this.setStatus("Nuevo elemento añadido");
  
    },
  };
  
  window.App = App;
  
  window.addEventListener("load", function() {
  
    // Log
    console.log("** load **");
    console.log("window.ethereum: ", window.ethereum);	
      
    if (window.ethereum) {
      // use MetaMask's provider
  //    App.web3 = new Web3(window.ethereum);
  //    window.ethereum.enable(); // get permission to access accounts
    } else {
      
      console.warn(
        "No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live",
      );
    }
  
    App.start();
  });