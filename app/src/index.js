import Web3 from "web3";
import recyclerArtifact from "../../build/contracts/Recycler.json";

const App = {
  web3: null,
  account: null,
  meta: null,
  prodCode: null,
  prodFee: null,
  prodQty: 0,
  prodPrice: 0,
  prodAmount: 0,

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
          this.prodCode = "";
          this.prodFee = "";
          this.prodQty = 0;

          // Log
          console.log("Account: ", this.account);
          console.log("Accounts: ", accounts);

          const accountIdElement = document.getElementById("cuenta");
          accountIdElement.innerHTML = this.account;

          const networkIdElement = document.getElementById("red");
          networkIdElement.innerHTML = networkId;

          this.refreshBalance();
          this.lastMovements();

      } catch (error) {
          console.error("Could not connect to contract or chain.");
          // Log
          console.log("error: ", error);
          this.setStatus("Could not connect to contract or chain.");
      }
  },

  sendCoin: async function() {

      //const amount = parseInt(document.getElementById("price").value);
      //const receiver = document.getElementById("receiver").value;
      //this.prodQty = parseInt(document.getElementById("cantidad").value);

      const code = document.getElementById("codigo");      
      const measure = document.getElementById("medida");

      if (code.checkValidity() && medida.checkValidity()) {
        
        this.prodUni = measure.value;
        await this.processCode();
        //await this.calculateAmount(); --> Lo llama dentro de processCode
      
        // Log
        console.log("******** sendCoin ********");
        console.log("amount: ", this.prodAmount);
        console.log("codigo: ", this.prodCode);
        console.log("fee: ", this.prodFee);
        console.log("cantidad: ", this.prodQty);
        console.log("unidad: ", this.prodUni);
        console.log("cuenta:", this.account);

        this.setStatus("Enviando transacción... (por favor, espere)");

        const { sendCoin } = this.meta.methods;
        await sendCoin(this.prodCode, this.prodFee, this.prodQty, this.prodUni).send({
          from: this.account
        });
      
        this.setStatus("Transacción completada");
        this.refreshBalance();

        document.getElementById("sendButton").disabled = true;

      } else {
        this.setStatus("ERROR. Datos de entrada no válidos.")
      }
  },

  processCode: async function() {

      this.prodCode = document.getElementById("codigo").value;
      const description = document.getElementById("description");
      const prefix = 'https://api.mlab.com/api/1/databases/productos/collections/';
      const apiKey1 = '"}&apiKey='
      const apiKey2 = '1KuXCnUSqfOGDAoKSZHENTSFBBlu4d6n';

      //this.prodPrice = 1;
      //this.prodFee = "";      

      console.log("Buscando codigo: ", this.prodCode);

      if (!isEmpty(this.prodCode)) {

          description.value = "Buscando...";
          
          // Create a request variable and assign a new XMLHttpRequest object to it.
          let request = new XMLHttpRequest();
          let requestHttp = prefix.concat('products?q={"product":"',this.prodCode,apiKey1,apiKey2);
          
          // Log
          console.log("***** XMLHttpRequest *****");
          console.log("requestHttp: ", requestHttp);

          // Open a new connection, using the GET request on the URL endpoint
          request.open('GET',requestHttp,true);

          request.onload = function() {

              // Begin accessing JSON data here
              let data = JSON.parse(this.response);
              
              console.log("data: ", data);
              console.log("Request.status: ", request.status);

              if (request.status >= 200 && request.status < 400 && data.length > 0) {

                    description.value = data[0].description;
                    let _fee = data[0].id_fee;
                    App.prodFee = data[0].id_fee;

                    // Log
                    console.log("prodFee:",App.prodFee);

                    // Create a request variable and assign a new XMLHttpRequest object to it.
                    let request2 = new XMLHttpRequest();
                    let requestHttp2 = prefix.concat('prices?q={"id_fee":"',_fee,apiKey1,apiKey2);

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
                        console.log("Req Status: ", request2.status);

                        if (request2.status >= 200 && request2.status < 400 && data.length > 0) {
                            App.prodPrice = data[0].precio;
                        } else {
                            console.log('ERROR: Fee code not found');
                            App.prodPrice = 1;
                        }
                        App.calculateAmount();
                   }  

                   // Send request
                   request2.send() 
                  
              } else {
                   console.log('Código no encontrado');
                   description.value = "unknown";
                   App.prodFee = "";
                   App.prodPrice = 1;
                   App.calculateAmount();
              }
              //price.value = this.prodPrice;
          }

          // Send request
          request.send();
      } 
  },

  refreshBalance: async function() {

    console.log("** refreshBalance init **");

    const { getBalance } = this.meta.methods;
    const balance = await getBalance(this.account).call();

    // Log
    console.log("** refreshBalance **");
    console.log("this.account: ", this.account);
    console.log("balance: ", balance);

    const balanceElement = document.getElementById("saldo");
    balanceElement.innerHTML = balance;
  },

  lastMovements: async function() {

    console.log("** lastMovements init **");

    const { getMovementCount } = this.meta.methods;
    const numMvts = await getMovementCount(this.account).call();

    // Log
    console.log("** lastMovements **");
    console.log("this.account: ", this.account);
    console.log("movimientos: ", numMvts);

    const mvtsCount = document.getElementById("mvtsCount");
    mvtsCount.innerHTML = numMvts;

    if (numMvts > 0) {
        const { getMovement } = this.meta.methods;

        let _ini = numMvts;
        let _end = 1

        if (numMvts > 5) {
            _end = numMvts - 4;
        }

        for (let i = _ini; i = _end; i--) {

            let Mvt = await getMovement(this.account, i).call();

            // Log
            console.log("Movimiento: ", Mvt);

        }
    }
  },  

  addItem: function() {

    this.setStatus("Añadiendo...");

    const codigo = document.getElementById("codigo");
    const cantidad = document.getElementById("cantidad");
    const medida = document.getElementById("medida");
    let tabla = document.getElementById("tabla-items");

    for (var i = tabla.rows.length - 2; i > 0; i--) {
        tabla.rows[i + 1].cells[0].innerHTML = tabla.rows[i].cells[0].innerHTML;
        tabla.rows[i + 1].cells[1].innerHTML = tabla.rows[i].cells[1].innerHTML;
        tabla.rows[i + 1].cells[2].innerHTML = tabla.rows[i].cells[2].innerHTML;
    }

    tabla.rows[1].cells[0].innerHTML = codigo.value;
    tabla.rows[1].cells[1].innerHTML = cantidad.value;
    tabla.rows[1].cells[2].innerHTML = medida.value;

    codigo.value = "";
    cantidad.value = 0;
    medida.value = "";

    this.setStatus("Nuevo elemento añadido");

  },

  calculateAmount: function() {

      const quantity = document.getElementById("cantidad");
      const amount = document.getElementById("amount");

      if (quantity.checkValidity()) {

        this.prodQty = quantity.value;
        this.prodAmount = this.prodPrice * this.prodQty;
        amount.value = this.prodAmount;

        // log
        console.log("Cantidad: ",this.prodQty);
        console.log("Price: ",this.prodPrice);
        console.log("Amount: ",this.prodAmount);  
        
        document.getElementById("sendButton").disabled = false;

      } else {     
        this.setStatus("Quantity value is not valid");     
      }
  },

  setStatus: function(message) {
      const status = document.getElementById("status");
      const eventsLog = document.getElementById("eventsLog");
      status.innerHTML = message;
      eventsLog.textContent = message + "\n" + eventsLog.textContent;
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
    const eventsLog = document.getElementById("eventsLog");
    status.innerHTML = message;
    eventsLog.textContent = message + "\n" + eventsLog.textContent;
    console.log("Saliendo showMessage function");

};

/* function getCantidad() {

    const quantity = document.getElementById("cantidad");
    let _qty = 0;

    if (quantity.checkValidity()) {

    return _qty;
}

function calculateAmount(_price) {

    const quantity = document.getElementById("cantidad");
    const amount = document.getElementById("amount");
    let _qty = 0;

    if (quantity.checkValidity()) {

      this.prodQty = quantity.value;
      this.prodAmount = _price * this.prodQty;
      amount.value = this.prodAmount;

      // log
      console.log("Cantidad: ",this.prodQty);
      console.log("Price: ", _price);
      console.log("Amount: ",this.prodAmount);     

    } else {     
        showMessage("Quantity value is not valid");     
    }

    return {cantidad: _qty, amount: _amount};
}; */ 

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