import Web3 from "web3";
//import recyclerArtifact from "../../build/contracts/Recycler.json";
import recyclerArtifact from "../dist/contracts/Recycler.json";

const SECRETS = require('./secrets');

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
  eventSet4: null,  
  eventSet5: null,  
  owner: null,
  paused: false,

  //*
  //*   start: Función inicial
  //*
  start: async function() {
      const { web3 } = this;

      console.info("App.start");

      try {
          // get contract instance
          const networkId = await web3.eth.net.getId();
          console.log("networkId: ", networkId);          
          const deployedNetwork = recyclerArtifact.networks[networkId];
          this.meta = new web3.eth.Contract(
              recyclerArtifact.abi,
              deployedNetwork.address,
          );

          // Obtiene la cuenta con que se va a trabajar
          const accounts = await web3.eth.getAccounts();
          this.account = accounts[0];

          // Inicializa variables de trabajo
          this.prodCode = "";
          this.prodFee = "";
          this.prodQty = 0;
          this.eventSet1 = new Set();
          this.eventSet2 = new Set();
          this.eventSet3 = new Set();
          this.eventSet4 = new Set();
          this.eventSet5 = new Set();
          await this.getOwner();
          await this.getPaused();

          const networkIdElement = document.getElementById("red");
          networkIdElement.innerHTML = networkId;
          
          // Inicializa campos UI y carga información de la cuenta
          this.initializeTableItems();
          this.getUserCount();
          this.loadAccount();
          this.setEvents();

      } catch (error) {
          console.error("Could not connect to contract or chain.");
          this.setStatus("Could not connect to contract or chain.");
      }
  },

  //*
  //* loadAccount: Carga en el front los datos de la cuenta
  //*
  loadAccount: async function() {

    this.setStatus("Se cargan datos cuenta");

    const accountIdElement = document.getElementById("cuenta");
    accountIdElement.innerHTML = this.account;

    this.refreshBalance();
    this.lastMovements();
    this.prepareOwner();

  },

  //*
  //* setEvents: Define el comportamiento de la aplicación antes los eventos que reciba del SC
  //*
  //* Las variables de tipo set (eventSet1, 2, 3..) almacenan los hashes de las transacciones procesadas. Dado que
  //* un mismo evento puede recibirse varias veces para una misma transacción, se guarda el hash para tratar el evento
  //* una única vez.
  //*
  setEvents: async function() {

    //* 
    //* Tratamiento evento coinSent
    //*
    let eventCoinSent = this.meta.events.coinSent({ filter: {_sender: this.address}}, function(error, event){ 

        if (!error) {

            console.info("CoinSent hash: ", event.transactionHash);

            if (!this.eventSet1.has(event.transactionHash)) {

                this.eventSet1.add(event.transactionHash);

                let _amount = event.returnValues._amount;
                let _sToken = (_amount == 1) ? " token ":" tokens ";
                let _mvt = [event.returnValues._code, event.returnValues._fee, event.returnValues._qty, 
                            event.returnValues._uni, _amount];

                showMessage("Evento coinSent recibido");
                this.addItem(_mvt);  
                this.movementCount();
                alert("Se han ingresado " + String(_amount) + _sToken + "en su cuenta.\n\n"+ "Tx hash:\n" + event.transactionHash);
            }
        }      
    }.bind(this));

    //* 
    //* Tratamiento evento newBalance
    //*
    let eventNewBalance = this.meta.events.newBalance({ filter: {_sender: this.address}}, function(error, event){ 

        if (!error) {

            console.info("newBalance hash: ", event.transactionHash);

            if (!this.eventSet2.has(event.transactionHash)) {

                this.eventSet2.add(event.transactionHash);
                this.refreshBalance();
                showMessage("Evento newBalance recibido. Se actualiza saldo de la cuenta."); 
            }
        }      
    }.bind(this));   
    
    //* 
    //* Tratamiento evento newUser
    //*
    let eventNewUser = this.meta.events.newUser({ filter: {_sender: this.address}}, function(error, event){ 

        if (!error) {

            console.info("newUser hash: ", event.transactionHash);

            if (!this.eventSet3.has(event.transactionHash)) {

                this.eventSet3.add(event.transactionHash);
                showMessage("Evento newUser recibido");
                alert("Nuevo usuario creado.\n\n"+"Bienvenido y gracias por reciclar!");
            }
        }      
    }.bind(this));    

    //* 
    //* Tratamiento evento LogPriceUpdated
    //*
    let eventLogPriceUpdated = this.meta.events.LogPriceUpdated({ filter: {_sender: this.address}}, function(error, event){ 

        if (!error) {

            console.info("LogPriceUpdated hash: ", event.transactionHash);

            if (!this.eventSet4.has(event.transactionHash)) {

                this.eventSet4.add(event.transactionHash);
                showMessage("Evento LogPriceUpdated. Se ha recibido respuesta del oráculo.");
            }
        }      
    }.bind(this));  
    
    //* 
    //* Tratamiento evento LogNewProvableQuery
    //*
    let eventLogNewProvableQuery = this.meta.events.LogNewProvableQuery({ filter: {_sender: this.address}}, function(error, event){ 

        if (!error) {

            console.info("LogNewProvableQuery hash: ", event.transactionHash);

            if (!this.eventSet5.has(event.transactionHash)) {

                this.eventSet5.add(event.transactionHash);
                showMessage("Evento LogNewProvableQuery. " + event.returnValues.description);
            }
        }      
    }.bind(this));    

    //* 
    //* Tratamiento evento Paused
    //*
    let eventPause = this.meta.events.Paused({ filter: {_sender: this.address}}, function(error, event){ 

        if (!error) {

            console.info("Paused hash: ", event.transactionHash);
    
            if (!this.eventSet1.has(event.transactionHash)) {
    
                this.eventSet1.add(event.transactionHash);

                alert("El contrato ha sido pausado correctamente\n"+ "Tx hash:\n" + event.transactionHash);
                this.setStatus("Contrato pausado");
                this.getPaused();
            }
        }

    }.bind(this));

    //* 
    //* Tratamiento evento Unpaused
    //*
    let eventUnpause = this.meta.events.Unpaused({ filter: {_sender: this.address}}, function(error, event){ 

        if (!error) {

            console.info("Unpaused hash: ", event.transactionHash);
    
            if (!this.eventSet1.has(event.transactionHash)) {
    
                this.eventSet1.add(event.transactionHash);

                alert("EL contrato ha sido despausado correctamente\n"+ "Tx hash:\n" + event.transactionHash);
                this.setStatus("Contrato despausado");
                this.getPaused();
            }
        }

    }.bind(this));

  },

  //*
  //*   sendCoin: Transacción para sumar tokens al saldo del usuario a cambio del envase entregado.
  //*             Si la api encontró el código del envase, se enviará el código de tarifa (fee) asociada
  //*             para que, con el oráculo, se determine en firme el número de tokens que se entregará
  //*             al usuario. Si no, la fee se enviará vacía y se entregará por defecto un token por 
  //*             cada unidad.
  //*             
  sendCoin: async function() {

      const codebar = document.getElementById("codebar");      
      const measure = document.getElementById("measure");

      // Se verifica que los valores de los campos de input son válidos 
      if (codebar.checkValidity() && quantity.checkValidity() && measure.checkValidity()) {
        
        this.prodUni = measure.value;
        this.setStatus("Enviando transacción...");

        const { sendCoin } = this.meta.methods;
        await sendCoin(this.prodCode, this.prodFee, this.prodQty, this.prodUni).send({
          from: this.account
        }, function(error, transactionHash){
            if (error) {
                console.error("Error sendCoin: ", error);
                showMessage("Error. Transacción no completada");
                alert(error);
            } else {
                console.info("Transaction hash: ", transactionHash);
                showMessage("Transacción completada");
            }
        });

        // Deja limpios los campos input para la próxima transacción
        this.initializeInput();

      } else {
        this.setStatus("ERROR. Datos de entrada no válidos.");
        alert("ERROR. Datos de entrada no válidos.");
      }
      document.getElementById("sendButton").disabled = true;
  },

  //*
  //*   initializeInput: Inicializa los campos input
  //*
  initializeInput: async function() {

    document.getElementById("codebar").value = "";
    document.getElementById("codebar").focus();
    document.getElementById("description").value = "";   
    document.getElementById("quantity").value = 1;
    document.getElementById("measure").value = "UNI";
    document.getElementById("amount").value = 1;    
  },

  //*
  //* initializeTableItems: Inicializa la tabla html utilizada para mostrar los movimientos
  //*
  initializeTableItems: function() {

    let table = document.getElementById("table-items");

    for (let i = 1; i < table.rows.length; i++) {
        for (let j = 0; j < 5; j++) {
            table.rows[i].cells[j].innerHTML = "";
        }
    }

  },

  //*
  //*   processCode: Verifica mediante la api si el código de barra introducido está registrado
  //*                y, si es así, intenta obtener el número de tokens (fee) que se deben entregar 
  //*                por cada unidad entregada
  //*
  //*   request: Busca el código para obtener la tarifa (fee) asociada
  //*   request2: Busca la tarifa para obtener el número de tokens a asignar por cada unidad
  //*
  processCode: async function() {

      this.prodCode = document.getElementById("codebar").value;
      const description = document.getElementById("description");
      const prefix = 'https://api.mlab.com/api/1/databases/productos/collections/';
      const apiKey1 = '"}&apiKey='
      const apiKey2 = SECRETS.MLAB.APIKEY;

      if (!isEmpty(this.prodCode)) {

          description.value = "Buscando...";
          
          // Create a request variable and assign a new XMLHttpRequest object to it.
          let request = new XMLHttpRequest();
          let requestHttp = prefix.concat('products?q={"product":"',this.prodCode,apiKey1,apiKey2);

          // Open a new connection, using the GET request on the URL endpoint
          request.open('GET',requestHttp,true);

          request.onload = function() {

              // Begin accessing JSON data here
              let data = JSON.parse(this.response);
              
              console.info("Request.status: ", request.status);

              if (request.status >= 200 && request.status < 400 && data.length > 0) {

                    description.value = data[0].description;
                    let _fee = data[0].id_fee;
                    App.prodFee = data[0].id_fee;

                    // Create a request variable and assign a new XMLHttpRequest object to it.
                    let request2 = new XMLHttpRequest();
                    let requestHttp2 = prefix.concat('prices?q={"id_fee":"',_fee,apiKey1,apiKey2);

                    // Open a new connection, using the GET request on the URL endpoint
                    request2.open('GET', requestHttp2, true);

                    request2.onload = function() {

                        // Begin accessing JSON data here
                        let data = JSON.parse(this.response);
                    
                        console.info("Req2 Status: ", request2.status);

                        if (request2.status >= 200 && request2.status < 400 && data.length > 0) {
                            App.prodPrice = data[0].precio;
                        } else {
                            console.error('ERROR: Fee code not found');
                            App.prodPrice = 1;
                        }
                        App.calculateAmount();
                   }  

                   // Send request
                   request2.send() 
                  
              } else {
                   console.info('Código no encontrado');
                   description.value = "unknown";
                   App.prodFee = "";
                   App.prodPrice = 1;
                   App.calculateAmount();
              }
          }

          // Send request
          request.send();
      } 
  },

  //* 
  //*   Actualiza el saldo de la cuenta y el saldo total de tokens en circulación
  //*
  refreshBalance: async function() {

    // Saldo de la cuenta
    const { getBalance } = this.meta.methods;
    const balance = await getBalance(this.account).call();

    const balanceElement = document.getElementById("saldo");
    balanceElement.innerHTML = balance;

    this.globalBalance();
  },

  //*
  //*   globalBalance: Recupera el Saldo total de tokens entregados por el SC a todas las direcciones
  //*
  globalBalance: async function() {

    const { getGlobalBalance } = this.meta.methods;
    const globalBalance = await getGlobalBalance().call();

    const globalBalanceElement = document.getElementById("globalBalance");
    globalBalanceElement.innerHTML = globalBalance;

  },

  //*
  //*   getOwner: Recupera la dirección del owner
  //*
  getOwner: async function() {

    this.setStatus("Se recupera owner del contrato");

    const { owner } = this.meta.methods;
    await owner().call(function(error, response){

        if (error) {
            showMessage(error);
            console.error(error);
        } else {
            const _owner = response;

            document.getElementById("owner").innerHTML = _owner;
            this.owner = _owner;
        }
               
    }.bind(this));
  },

  //*
  //*   getPaused: Verifica si se ha detenido el contrato (paused - circuit break)
  //*
  getPaused: async function() {

    this.setStatus("Se recupera estado (paused) del contrato");    

    const { paused } = this.meta.methods;
    await paused().call(function(error, response) {

        if (error) {
            showMessage(error);
            console.error(error);
        } else {
            const _paused = response;

            const pausedElement = document.getElementById("paused");
            const pauseButton = document.getElementById("pauseButton");

            pausedElement.innerHTML = (_paused) ? "Si":"No";
            pauseButton.innerHTML = (_paused) ? "Unpause":"Pause";

            this.paused = _paused;
        }
    }.bind(this));
  },  

  //*
  //*   pause: Verifica el estado del contrato (paused/unpaused) para cambiar al estado contrario
  //*
  pause: async function() {

    await this.getPaused();

    if (this.paused) {

        const { unpause } = this.meta.methods;
        await unpause().send({
            from: this.account
        }, function(error, transactionHash){
            if (error) {
                console.error("Error unpause: ", error);
                showMessage("Error. Transacción no completada");
                alert(error);
            } else {
                console.info("Transaction hash: ", transactionHash);
                showMessage("Transacción completada");
            }
        });

    } else {

        const { pause } = this.meta.methods;
        await pause().send({
            from: this.account
        }, function(error, transactionHash){
            if (error) {
                console.error("Error pause: ", error);
                showMessage("Error. Transacción no completada");
                alert(error);
            } else {
                console.info("Transaction hash: ", transactionHash);
                showMessage("Transacción completada");
            }
        });
    }
  },

  //*
  //*   prepareOwner: Prepara las opciones disponibles para el owner
  //*
  prepareOwner: async function() {

    if (this.account.toLowerCase() == this.owner.toLowerCase()) {
        document.getElementById("pauseButton").disabled = false;
    } else {
        document.getElementById("pauseButton").disabled = true;
    }

  },

  //*
  //*   getUserCount: Obtiene el número de usuarios del sistema
  //*
  getUserCount: async function() {

    this.setStatus("Se recupera número de usuarios");    

    const { getUserCount } = this.meta.methods;
    const _userCount = await getUserCount().call();

    document.getElementById("globalUsers").innerHTML = _userCount;
  },   

  //*
  //* Obtiene del SC el número de movimientos que tiene la cuenta actual
  //*
  movementCount: async function() {

    const { getMovementCount } = this.meta.methods;
    const _numMvts = await getMovementCount(this.account).call();

    document.getElementById("mvtsCount").innerHTML = _numMvts;    

    return _numMvts;
  },

  //*
  //*  Obtiene del SC los últimos 5 movimientos de la cuenta actual y los incluye
  //*  en la tabla de movimientos 
  //*
  lastMovements: async function() {

    let numMvts = await this.movementCount();

    if (numMvts > 0) {
        const { getMovement } = this.meta.methods;

        let _ini = (numMvts > 5) ? numMvts - 4:1, _end = numMvts;

        for (let i = _ini; i <= _end; i++) {
            let mvt = await getMovement(this.account, i).call();
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

    for (let i = table.rows.length - 2; i > 0; i--) {
        table.rows[i + 1].cells[0].innerHTML = table.rows[i].cells[0].innerHTML;
        table.rows[i + 1].cells[1].innerHTML = table.rows[i].cells[1].innerHTML;
        table.rows[i + 1].cells[2].innerHTML = table.rows[i].cells[2].innerHTML;
        table.rows[i + 1].cells[3].innerHTML = table.rows[i].cells[3].innerHTML;
        table.rows[i + 1].cells[4].innerHTML = table.rows[i].cells[4].innerHTML;                
    }

    table.rows[1].cells[0].innerHTML = _mvt[0];
    table.rows[1].cells[1].innerHTML = isEmpty(_mvt[1]) ? "unknown":"Tarifa " + _mvt[1];
    table.rows[1].cells[2].innerHTML = _mvt[2];
    table.rows[1].cells[3].innerHTML = (_mvt[3] == "KGM") ? "Kilos":"Unidades";
    table.rows[1].cells[4].innerHTML = _mvt[4];

    this.setStatus("Se muestra movimiento");

  },

  //*
  //* Función para calcular el número estimado de tokens que se entregarán
  //*
  calculateAmount: function() {

      const quantity = document.getElementById("quantity");
      const amount = document.getElementById("amount");

      if (quantity.checkValidity()) {

        this.prodQty = quantity.value;
        this.prodAmount = this.prodPrice * this.prodQty;
        amount.value = this.prodAmount;
        
        document.getElementById("sendButton").disabled = false;

      } else {     
        this.setStatus("La cantidad no es válida. Mínimo 1, máximo 1000");     
      }
  },

  //*
  //* Función para mostrar mensaje de estado
  //*
  setStatus: function(message) {
      const status = document.getElementById("status");
      const eventsLog = document.getElementById("eventsLog");
      status.innerHTML = message;
      eventsLog.textContent = "> " + message + "\n" + eventsLog.textContent;
  },

};

//*
//* Función para verificar si una variable no tiene valor
//*
function isEmpty(valor) {

  if (valor == null || valor.length == 0 || /^\s+$/.test(valor)) {
      return true;
  } else {
      return false;
  }
};

//*
//* Función para mostrar mensaje de estado (similar a setStatus)
//*
function showMessage(_message) {

    const status = document.getElementById("status");
    const eventsLog = document.getElementById("eventsLog");
    status.innerHTML = _message;
    eventsLog.textContent = "> " + _message + "\n" + eventsLog.textContent;
};

window.App = App;

window.addEventListener("load", function() {

  if (window.ethereum) {
      // use MetaMask's provider
      App.web3 = new Web3(window.ethereum);
      window.ethereum.enable(); // get permission to access accounts
      showMessage("Web3 detected");

      // Escuchamos los cambios en Metamask para poder detectar un cambio de cuenta
      App.web3.currentProvider.publicConfigStore.on("update", async function(event){
            
        if (typeof event.selectedAddress === "undefined") {

            alert("Es imprescindible tener Metamask conectado para poder utilizar la aplicación");

        } else {

            console.info("Metamask new address: ", event.selectedAddress);
            console.info("Current address: ", App.account);

            // Se valida si la cuenta seleccionada en Metamask ha cambiado
            if (event.selectedAddress.toLowerCase() != App.account.toLowerCase()) {

                document.getElementById("eventsLog").innerHTML = "";
                showMessage("Detectada nueva cuenta. Se actualizan los datos.");
                App.initializeInput();
                App.start();
            }
        }

      })

  } else {
      console.warn(
          "No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live",
      );
      showMessage("No web3 detected. Falling back to http://127.0.0.1:9545");
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
      App.web3 = new Web3(
          new Web3.providers.HttpProvider("http://127.0.0.1:9545"),
      );
      alert("Es necesario tener instalado Metamask\n para poder utilizar esta Dapp");
  }

  App.start();
});