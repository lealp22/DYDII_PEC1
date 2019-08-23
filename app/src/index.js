import Web3 from "web3";
import recyclerArtifact from "../../build/contracts/Recycler.json";

const App = {
  web3: null,
  account: null,
  meta: null,
  prodCode: null,
  prodFee: null,
  prodQty: null,

  start: async function() {
      const { web3 } = this;

      // Log
      console.log("** start **");
      console.log("This: ", this);
      console.log("Web3: ", web3);

      try {
          // get contract instance
          const networkId = await web3.eth.net.getId();
          const deployedNetwork = recyclerArtifact.networks[networkId];
          this.meta = new web3.eth.Contract(
              recyclerArtifact.abi,
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

          const accountIdElement = document.getElementById("cuenta");
          accountIdElement.innerHTML = this.account;

          const networkIdElement = document.getElementById("red");
          networkIdElement.innerHTML = networkId;

          this.refreshBalance();
      } catch (error) {
          console.error("Could not connect to contract or chain.");
          // Log
          console.log("error: ", error);
          this.setStatus("Could not connect to contract or chain.");
      }
  },

  refreshBalance: async function() {
      const { getBalance } = this.meta.methods;
      const balance = await getBalance(this.account).call();

      // Log
      console.log("** refreshBalance **");
      console.log("this.account: ", this.account);
      console.log("balance: ", balance);

      const balanceElement = document.getElementById("saldo");
      balanceElement.innerHTML = balance;
  },

  sendCoin: async function() {
      const amount = parseInt(document.getElementById("price").value);
      //const receiver = document.getElementById("receiver").value;
      this.prodQty = parseInt(document.getElementById("cantidad").value);
      this.prodUni = document.getElementById("medida").value;

      // Log
      console.log("** sendCoin **");
      console.log("amount: ", amount);
      //console.log("receiver: ", receiver);
      console.log("codigo: ", this.prodCode);
      console.log("fee: ",this.prodFee);
      console.log("cantidad: ", this.prodQty);
      console.log("unidad: ", this.prodUni);
;
      this.setStatus("Initiating transaction... (please wait)");

      const { sendCoin } = this.meta.methods;
      await sendCoin(this.prodCode, this.prodFee, this.prodQty, this.prodUni).send({
          from: this.account
      });
      
      this.setStatus("Transaction complete!");
      this.refreshBalance();
  },

  buscarCodigo: async function() {
      this.prodCode = document.getElementById("codigo").value;
      const description = document.getElementById("description");
      const prefix = 'https://api.mlab.com/api/1/databases/productos/collections/';
      const apiKey = '1KuXCnUSqfOGDAoKSZHENTSFBBlu4d6n';

      let priceRequest = 1;

      console.log("Buscando codigo: ", this.prodCode);

      if (!isEmpty(this.prodCode)) {

          description.value = "Buscando...";
          
          // Create a request variable and assign a new XMLHttpRequest object to it.
          let request = new XMLHttpRequest();
          let requestHttp = prefix.concat('products?q={"product":"',this.prodCode,'"}&apiKey=',apiKey);
          
          // Log
          console.log("** XMLHttpRequest **");
          console.log("requestHttp: ", requestHttp);

          // Open a new connection, using the GET request on the URL endpoint
          request.open('GET',requestHttp,true);

          request.onload = function() {

              // Begin accessing JSON data here
              let data = JSON.parse(this.response);
              
              console.log("data: ", data);
              console.log("Request.status: ", request.status);

              if (request.status >= 200 && request.status < 400 && data.length > 0) {

                    description.value = data[0].description
                    this.prodFee = data[0].id_fee;

                    // Log
                    console.log("prodFee:",this.prodFee);

                    // Create a request variable and assign a new XMLHttpRequest object to it.
                    let request2 = new XMLHttpRequest();
                    let requestHttp2 = prefix.concat('prices?q={"id_fee":"',this.prodFee,'"}&apiKey=',apiKey);
                    //let requestHttp2 = 'https://api.mlab.com/api/1/databases/productos/collections/prices?q={"id_fee":"'||
                    //                    this.prodFee || '"}&apiKey=' || apiKey;

                    // Log
                    console.log("** XMLHttpRequest2 **");
                    console.log("requestHttp2: ", requestHttp2);

                    // Open a new connection, using the GET request on the URL endpoint
                    request2.open('GET', requestHttp2, true);

                    request2.onload = function() {

                        // Begin accessing JSON data here
                        let data = JSON.parse(this.response);
                    
                        // Log
                        console.log("data: ", data);
                        console.log("Req// Log ", request2.status);

                        if (request2.status >= 200 && request2.status < 400 && data.length > 0) {
                            priceRequest = data[0].precio;
                        } else {
                            console.log('ERROR: Tarifa no encontrada');
                        }
                   }  

                   // Send request
                   request2.send() 
                  
              } else {
                   console.log('Código no encontrado');
                   description.value = "unknown";
              }

              //price.value = priceRequest;
          }

          // Send request
          request.send();
          
          /*
          // Create a request variable and assign a new XMLHttpRequest object to it.
          let request2 = new XMLHttpRequest()

          // Open a new connection, using the GET request on the URL endpoint
          request2.open('GET', 'https://api.mlab.com/api/1/databases/productos/collections/prices?q={ "id_fee": "0102","fecha_ini":{"$lt":"2019-07-20"},"fecha_fin":{"$gte":"2019-07-20"}}&apiKey=1KuXCnUSqfOGDAoKSZHENTSFBBlu4d6n', true)

          request2.onload = function() {
              // Begin accessing JSON data here
              // Begin accessing JSON data here
              let data = JSON.parse(this.response);
              
              console.log("data: ", data);
              console.log("Request.status: ", request2.status);

              if (request2.status >= 200 && request2.status < 400) {
                  price.value = data[0].precio
              } else {
                  price.value = 1;                    
                  console.log('error')
              }
          }

          // Send request
          request2.send()            
          */
      } else {
          this.setStatus("Error: En necesario indicar un código.");
          price.value = 0;
          description.value = "";
      }
  },

  setStatus: function(message) {
      const status = document.getElementById("status");
      status.innerHTML = message;
  },

};

function isEmpty(valor) {

  if (valor == null || valor.length == 0 || /^\s+$/.test(valor)) {
      return true;
  } else {
      return false;
  }
};

function showMessage(message) {

    console.log("Entrando showMessage function");
    const status = document.getElementById("status");
    status.innerHTML = message;
    console.log("Saliendo showMessage function");
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
      showMessage("Web3 detected");
  } else {
      console.warn(
          "No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live",
      );
      showMessage("No web3 detected. Falling back to http://127.0.0.1:9545");
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
      App.web3 = new Web3(
          new Web3.providers.HttpProvider("http://127.0.0.1:9545"),
      );
  }

  App.start();
});