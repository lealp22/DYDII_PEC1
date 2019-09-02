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
  eventSet1: null,
  eventSet2: null,
  eventSet3: null,

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
          console.log("recyclerArtifact: ", recyclerArtifact);

          // get accounts
          const accounts = await web3.eth.getAccounts();
          this.account = accounts[0];
          this.prodCode = "";
          this.prodFee = "";
          this.prodQty = 0;
          this.eventSet1 = new Set();
          this.eventSet2 = new Set();
          this.eventSet3 = new Set();

          // Log
          console.log("Account: ", this.account);
          console.log("Accounts: ", accounts);

          const accountIdElement = document.getElementById("cuenta");
          accountIdElement.innerHTML = this.account;

          const networkIdElement = document.getElementById("red");
          networkIdElement.innerHTML = networkId;

          this.refreshBalance();
          this.lastMovements();
          this.setEvents();

      } catch (error) {
          console.error("Could not connect to contract or chain.");
          // Log
          console.log("error: ", error);
          this.setStatus("Could not connect to contract or chain.");
      }
  },

  //*
  //* setEvents: Define el comportamiento de la aplicación antes los eventos que reciba del SC
  //*
  setEvents:function() {
    /*
    this.meta.once("coinSent", function(error, event){ 
        console.log("--Meta.Once.CointSent--"); 
        console.log("Error coinSent: ", error);
        console.log("Event coinSent: ", event);

        let _amount = event.returnValues._amount;
        let _sToken = (_amount == 1) ? " token ":" tokens ";
        let _mvt = [event.returnValues._code, event.returnValues._fee, event.returnValues._qty, event.returnValues._uni, _amount];

        console.log("Alerta: ", _amount, " ", _sToken);

        if (!error) {
            showMessage("Evento coinSent recibido");
            App.addItem(_mvt);  
            App.movementCount();
            alert("Se han ingresado " + String(_amount) + _sToken + "en su cuenta.\n\n"+ "Tx hash:\n" + event.transactionHash);
        }      
    });
    
    this.meta.once("newUser", function(error, event){ 
        console.log("--Meta.Once.Newuser--"); 
        console.log("Error newUser: ", error);
        console.log("Event newUser: ", event);

        if (!error) {
            showMessage("Evento newUser recibido");
            alert("Nuevo usuario creado.\n\n"+"Bienvenido y gracias por reciclar!");
        }
            
    });    

    this.meta.once("newBalance", function(error, event){ 
        console.log("--Meta.Once.newBalance--"); 
        console.log("Error newBalancenSent: ", error);
        console.log("Event newBalance: ", event);
        if (!error) {
            showMessage("Evento newBalance recibido");
            App.refreshBalance();
        }
    });
     
    console.log("====Resto Eventos=====");
    */
    //* 
    //* Tratamiento evento coinSent
    //*
    let eventCoinSent = this.meta.events.coinSent({ filter: {_sender: this.address}}, function(error, event){ 

        console.log("Error coinSent: ", error);
        console.log("Event coinSent: ", event);

        if (!error) {

            console.log("CoinSent hash: ", event.transactionHash);
            console.log("CoinSent eventSet1: ", App.eventSet1);

            if (!App.eventSet1.has(event.transactionHash)) {

                App.eventSet1.add(event.transactionHash);

                let _amount = event.returnValues._amount;
                let _sToken = (_amount == 1) ? " token ":" tokens ";
                let _mvt = [event.returnValues._code, event.returnValues._fee, event.returnValues._qty, 
                            event.returnValues._uni, _amount];

                console.log("Alerta: ", _amount, " ", _sToken);

                showMessage("Evento coinSent recibido");
                App.addItem(_mvt);  
                App.movementCount();
                alert("Se han ingresado " + String(_amount) + _sToken + "en su cuenta.\n\n"+ "Tx hash:\n" + event.transactionHash);
            }
        }      
    });

    //* 
    //* Tratamiento evento newBalance
    //*
    let eventNewBalance = this.meta.events.newBalance({ filter: {_sender: this.address}}, function(error, event){ 

        console.log("Error newBalance: ", error);
        console.log("Event newBalance: ", event);

        if (!error) {

            console.log("newBalance hash: ", event.transactionHash);
            console.log("newBalance eventSet2: ", App.eventSet2);

            if (!App.eventSet2.has(event.transactionHash)) {

                App.eventSet2.add(event.transactionHash);
                App.refreshBalance();
                showMessage("Evento newBalance recibido"); 
            }
        }      
    });   
    
    //* 
    //* Tratamiento evento newUser
    //*
    let eventNewUser = this.meta.events.newUser({ filter: {_sender: this.address}}, function(error, event){ 

        console.log("Error newUser: ", error);
        console.log("Event newUser: ", event);

        if (!error) {

            console.log("newUser hash: ", event.transactionHash);
            console.log("newUser eventSet3: ", App.eventSet3);

            if (!App.eventSet3.has(event.transactionHash)) {

                App.eventSet3.add(event.transactionHash);
                showMessage("Evento newUser recibido");
                alert("Nuevo usuario creado.\n\n"+"Bienvenido y gracias por reciclar!");
            }
        }      
    });    
    /*
    .on('data', function(event){
        console.log("coinSent data"); // same results as the optional callback above
    })
    .on('changed', function(event){
        console.log("coinSent changed");
        // remove event from local database
    })
    .on('error', console.error);
    
    let eventNewUser = this.meta.events.newUser(function(error, result) {
        console.log("--newUser--");
        if (!error)
            console.log(result);
            showMessage("Event newUser");
    });

    let eventNewBalance = this.meta.events.newBalance(function(error, result) {
        console.log("--newBalance--");
        if (!error)
            console.log(result);
            showMessage("Event newBalance");
            App.refreshBalance();
    });
 */
  },

  sendCoin: async function() {

      //const amount = parseInt(document.getElementById("price").value);
      //const receiver = document.getElementById("receiver").value;
      //this.prodQty = parseInt(document.getElementById("quantity").value);

      const codebar = document.getElementById("codebar");      
      const measure = document.getElementById("measure");

      if (codebar.checkValidity() && quantity.checkValidity() && measure.checkValidity()) {
        
        this.prodUni = measure.value;
        //await this.processCode();
      
        // Log
        console.log("******** sendCoin ********");
        console.log("amount: ", this.prodAmount);
        console.log("codigo: ", this.prodCode);
        console.log("fee: ", this.prodFee);
        console.log("cantidad: ", this.prodQty);
        console.log("unidad: ", this.prodUni);
        console.log("cuenta:", this.account);

        this.setStatus("Enviando transacción...");

        const { sendCoin } = this.meta.methods;
        await sendCoin(this.prodCode, this.prodFee, this.prodQty, this.prodUni).send({
          from: this.account
        }, function(error, transactionHash){
            if (error) {
                console.log("error sendCoin: ", error);
                showMessage("Error. Transacción no completada");
                alert(error);
            } else {
                console.log("transactionHash sendCoin: ", transactionHash);
                showMessage("Transacción completada");
            }
        });

        //this.setStatus("Transacción completada");
        //this.refreshBalance();
        this.initializeInput();

      } else {
        this.setStatus("ERROR. Datos de entrada no válidos.");
        alert("ERROR. Datos de entrada no válidos.");
      }
      document.getElementById("sendButton").disabled = true;
  },

  initializeInput: async function() {

    console.log("entrando initializeInput");

    const codebar = document.getElementById("codebar");
    const description = document.getElementById("description");   
    const quantity = document.getElementById("quantity");
    const measure = document.getElementById("measure");
    const amount = document.getElementById("amount");

    codebar.value = "";
    description.value = "";
    quantity.value = 1;
    measure.value = "UNI";
    amount.value = 1;
    
  },

  processCode: async function() {

      console.log("** Entrando a processCode **");

      this.prodCode = document.getElementById("codebar").value;
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
      console.log("** Saliendo de processCode **");
  },

  //* 
  //*   Actualiza el saldo de la cuenta y el saldo total de tokens en circulación
  //*
  refreshBalance: async function() {

    console.log("** refreshBalance init **");

    // Saldo de la cuenta
    const { getBalance } = this.meta.methods;
    const balance = await getBalance(this.account).call();

    // Log
    console.log("** refreshBalance **");
    console.log("this.account: ", this.account);
    console.log("balance: ", balance);

    const balanceElement = document.getElementById("saldo");
    balanceElement.innerHTML = balance;

    // Saldo total de tokens entregados por el SC a todas las direcciones
    const { getGlobalBalance } = this.meta.methods;
    const globalBalance = await getGlobalBalance().call();

    const globalBalanceElement = document.getElementById("globalBalance");
    globalBalanceElement.innerHTML = globalBalance;

  },

  //*
  //* Obtiene del SC el número de movimientos que tiene la cuenta actual
  //*
  movementCount: async function() {

    const { getMovementCount } = this.meta.methods;
    const _numMvts = await getMovementCount(this.account).call();

    // Log
    console.log("** movementCount **");
    console.log("this.account: ", this.account);
    console.log("movimientos: ", _numMvts);

    const mvtsCount = document.getElementById("mvtsCount");
    mvtsCount.innerHTML = _numMvts;    

    return _numMvts;
  },

  //*
  //*  Obtiene del SC los últimos 5 movimientos de la cuenta actual y los incluye
  //*  en la tabla de movimientos 
  //*
  lastMovements: async function() {

    console.log("** lastMovements init **");

    let numMvts = await this.movementCount();

    console.log("numMvts devuelto: ", numMvts);

    if (numMvts > 0) {
        const { getMovement } = this.meta.methods;

        let _ini = (numMvts > 5) ? numMvts - 4:1, _end = numMvts;

        // Log
        console.log("ini: ", _ini, " end: ", _end);

        for (let i = _ini; i <= _end; i++) {

            // Log
            console.log("Param. mvt: ", this.account, " i: ", i);
            let mvt = await getMovement(this.account, i).call();

            // Log
            console.log("Movimiento: ", mvt);

            this.addItem(mvt);
        }
    }
  },  

  //*
  //* Incluye un item (movimiento) al principio de la tabla de movimientos
  //* desplazando los existentes
  //*
  addItem: function(_mvt) {

    let table = document.getElementById("table-items");

    // log
    console.log("Largo tabla: ", table.rows.length)

    for (let i = table.rows.length - 2; i > 0; i--) {
        table.rows[i + 1].cells[0].innerHTML = table.rows[i].cells[0].innerHTML;
        table.rows[i + 1].cells[1].innerHTML = table.rows[i].cells[1].innerHTML;
        table.rows[i + 1].cells[2].innerHTML = table.rows[i].cells[2].innerHTML;
        table.rows[i + 1].cells[3].innerHTML = table.rows[i].cells[3].innerHTML;
        table.rows[i + 1].cells[4].innerHTML = table.rows[i].cells[4].innerHTML;                
    }

    // Log
    console.log("Uni: ", _mvt[3]);

    table.rows[1].cells[0].innerHTML = _mvt[0];
    table.rows[1].cells[1].innerHTML = _mvt[1] + " unknown";
    table.rows[1].cells[2].innerHTML = _mvt[2];
    table.rows[1].cells[3].innerHTML = (_mvt[3] == "KGM") ? "Kilos":"Unidades";
    table.rows[1].cells[4].innerHTML = _mvt[4];

    this.setStatus("Movimiento añadido");

  },

  calculateAmount: function() {

      const quantity = document.getElementById("quantity");
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
        this.setStatus("La cantidad no es válida. Mínimo 1, máximo 1000");     
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

function showMessage(_message) {

    console.log("Entrando showMessage function");
    const status = document.getElementById("status");
    const eventsLog = document.getElementById("eventsLog");
    status.innerHTML = _message;
    eventsLog.textContent = _message + "\n" + eventsLog.textContent;
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