pragma solidity ^0.5.0;

//import "github.com/provable-things/ethereum-api/provableAPI_0.5.sol";
import "./provableAPI_0.5.sol";

import "./SafeMath.sol";
import "./Pausable.sol";

//**************************************************************************************************
// Contrato hijo (Factory)
// Utilizado para gestionar de forma individual los movimientos de un usuario del sistema
//**************************************************************************************************
contract UserFactory {

    address owner;
    address factory;
    uint    balance;
    uint32  count;

    // Struct para los movimientos (transacciones)
    struct Mvt {
        string code;
        string fee;
        uint32 qty;
        string uni;
        uint   amount;
        uint   date;
    }

    // Array para guardar los movimientos del usuario
    Mvt[] mvts;

    // Evento que se emitirá con la creación de cada movimiento
    event newMovement(
        address indexed _owner, address indexed _factory, uint _amount, uint _balance, uint _count
    );

    // Validará que el sender sea el contrato padre
    modifier onlyFactory() {
        require(msg.sender == factory,"sender is not the factory contract");
        _;
    }

    // El owner será el indicado por el contrato que llama (msg.sender)
    constructor(address _owner) public {
        owner = _owner;
        factory = msg.sender;
    }

    // Función para la creación de movimientos (con cada transacción realizada)
    // Solo se permitirá ejecutarlo al contrato padre (factory)
    // Se Validará:
    // - La cantidad (qty) sea un número entre 1 y 1000
    // - código del envase (code) y la unidad de medida (uni) vengan informados 
    //
    function addMovement(string memory _code, string memory _fee, uint32 _qty, string memory _uni, uint _amount) public onlyFactory {
        require(_qty > 0,"quantity is not greater than zero");
        require(_qty <= 1000,"quantity is too high");
        require(bytes(_code).length > 0,"package code is empty");
        require(bytes(_uni).length > 0,"unit code is empty");

        Mvt memory _tx;

        // Si el código de comisión está vacío, los campos amount y qty deben ser iguales (price=1)
        if (bytes(_fee).length == 0 && _amount != _qty) {
            revert("Price does not correspond with a empty fee");
        }

        // Construimos la transacción
        _tx.code = _code;
        _tx.fee = _fee;
        _tx.qty = _qty;
        _tx.uni = _uni;
        _tx.amount = _amount;
        _tx.date = now;

        // Incluimos la transacción en el array de movimientos
        mvts.push(_tx);

        // Actualizamos el contador de movimientos y el saldo
        count = SafeMath.add32(count,1);
        balance = SafeMath.add(balance, _tx.amount);

        //emit evento creación nuevo movimiento
        emit newMovement(owner, address(this), _tx.amount, balance, count);
    }

    // Función para la consulta de movimientos
    // Se deberá indicar la posición del movimiento a consultar
    //
    function getMovement(uint _ind) external view returns(string memory, string memory, uint32, string memory, uint, uint) {
        require (_ind > 0,"value must be greater than zero");
        require (_ind <= count, "value is higher than last movement index");

        // Resta 1 a la posición para obtener la posición real
        uint pos = SafeMath.sub(_ind, 1);

        return (mvts[pos].code, mvts[pos].fee, mvts[pos].qty, mvts[pos].uni, mvts[pos].amount, mvts[pos].date);
    }

}

//**************************************************************************************************
// Contrato padre
//**************************************************************************************************
contract Recycler is usingProvable, Pausable {

    //address public owner;

    //* Estructura para datos de usuarios
    struct User {
        uint    balance;
        uint    dtUltMvt;
        uint32  countMvts;
        uint32  seq;
        UserFactory userContr;
    }

    //* Estructura para movimientos (Transacciones)
    struct Mvt {
        string code;
        string fee;
        uint32 qty;
        string uni;
        uint   amount;
        uint   date;
    }

    //* Estructura para Transacciones pendientes enviadas al Oráculo
    struct PendingQuery {
        bool    isPending;
        Mvt     transPending;
        address senderContract;
    }

    //* Variables generales
    uint32  countUsers;
    uint32  countQueries;
    uint    globalBalance;
    Mvt     trans;
    bytes32[] pendTx1;

    //* -- Mapping --
    //* Lista de usuarios
    mapping (uint => address) private listaUsers;
    //* Datos de usuarios
    mapping (address => User) private users;
    //* Transacciones pendientes enviadas al Oráculo
    mapping (bytes32 => PendingQuery) private pendingQueries;

    //* Evento alta nuevo usuario
    event newUser(
        address indexed _sender, UserFactory indexed _factory, uint32 _seq
    );

    //* Eventos para actualización saldo de tokens
    event newBalance(
        address indexed _sender, uint _balance
    );

    //* Evento finalización envío de tokens
    event coinSent(
        address indexed _sender, string _code, string _fee, uint  _qty, string  _uni, uint _amount, uint _price
    );

    //event LogConstructorInitiated(string nextStep);
    event LogPriceUpdated(string _result);
    event LogNewProvableQuery(string description);

    constructor() public payable {
        //owner = msg.sender;
        createUser();
        addBalance(msg.sender, 10000);
    }

    //*
    //* Función para el traspaso de tokens a la cuenta del usuario
    //* Si se indica una tarifa (prodFee) se debe llamar al oráculo para consultar el precio (número de token que se debe 
    //* entregar por cada unidad)
    //*
    function sendCoin(string memory prodCode, string memory prodFee, uint32 prodQty, string memory prodUni) public whenNotPaused {
        require(prodQty > 0,"quantity is not greater than zero");
        require(prodQty < 1000,"quantity is too high");
        require(bytes(prodCode).length > 0,"package code is empty");
        require(bytes(prodUni).length > 0,"unit code is empty");

        // Registra el usuario en caso de que no existiese
        createUser();

        // Recogemos los datos en un struct de movimientos
        trans.code = prodCode;
        trans.fee = prodFee;
        trans.qty = prodQty;
        trans.uni = prodUni;

        // Solo se llamará al oráculo cuando se haya recibido un código de tarifa
        if (bytes(prodFee).length > 0) {
            fetchPrice(prodFee);
        } else {
            //uint price = 1;
            sendCoin_cont(1, msg.sender, trans);
        }
    }

    //*
    //* Segunda parte de la función sendCoin que se ejecutará tras tener la tarifa (price) de tokens a entregar
    //*
    function sendCoin_cont(uint _price, address _sender, Mvt memory _trans) internal {

        uint _amount;

        // Si no se fija un precio o falla la llamada al oráculo se asume precio = 1
        if (_price != 0) {
            _amount = SafeMath.mul(_trans.qty, _price);
        } else {
            _amount = _trans.qty;
        }

        users[_sender].dtUltMvt = block.timestamp;
        users[_sender].countMvts = SafeMath.add32(users[_sender].countMvts, 1);

        // Llamada al contrato factory para que registre el movimiento de saldo
        users[_sender].userContr.addMovement(_trans.code, _trans.fee, _trans.qty, _trans.uni, _amount);
        addBalance(_sender, _amount);

        emit coinSent(_sender, _trans.code, _trans.fee, _trans.qty, _trans.uni, _amount, _price);
    }

    //*
    //* Función para obtener el número de tokens que se pagará por cada unidad recogida (según la tarifa indicada) -1ra parte-
    //*
    //* Para ello se utiliza un oráculo creado con Provable (antiguo Oraclize) al que se le indicará la URL de una API web
    //* que devolverá el número de tokens para la tarifa (_fee) enviada.
    //*
    //* La obtención del número de tokens se deberá hacer en dos pasos:
    //* 1º - En esta función se enviará la query al oráculo
    //* 2º - En la función __callback se recogerá el valor devuelto por el oráculo para calcular el número de tokens
    //*  a entregar al usuario.
    //*
    function fetchPrice(string memory _fee) public payable whenNotPaused {
       require(bytes(_fee).length > 0,"fee code is empty");

       // Comprobamos si el contrato tiene saldo suficiente para el pago de la llamada al oráculo
       if (provable_getPrice("URL") > address(this).balance) {
           emit LogNewProvableQuery("Provable letquery was NOT sent, please add some ETH to cover for the query fee");
       } else {

           // Se construye la query con la tarifa (_fee) enviada como parámetro
           // La apiKey ha sido cifrada con la clave pública de Provable
           string memory _url = string(abi.encodePacked("[URL] ['json(https://api.mlab.com/api/1/databases/productos/collections/fees?apiKey=${[decrypt] BPssDAFd3BExbW4l0ee1RNV45pvdhOita1bwVtTzVu7aRvHoFZhuNCuuZnC8wzm6GUQ3yTz18+B2vnoADbHHpRc9NcMb/YZOwXo0sJsM5paIGll6oYEqpjWMQQ3eEISzGkE0/JMIHiDyG1SpiYI3bYg=}).0.result.", _fee, ".price']"));

           emit LogNewProvableQuery("Provable query was sent, standing by for the answer..");

           // Enviamos la query a Provable y guardamos el Id para tratarlo en el callback
           bytes32 queryId = provable_query("nested", _url, 350000);

           // Con el Id de la query guardamos los datos para tratarlos en el callback
           pendingQueries[queryId].isPending = true;
           pendingQueries[queryId].transPending = trans;
           pendingQueries[queryId].senderContract = msg.sender;

           // El contador countQueries nos permitirá sabér cuántas queries hay pendientes de procesar
           countQueries = SafeMath.add32(countQueries, 1);

           // DEBUG: Guardamos el ID de la peticiones para, en caso de ser necesario, poder recuperarlos y revisar qué pasa 
           pendTx1.push(queryId);
       }
    }

    //*
    //* Función para obtener el número de tokens que se pagará por cada unidad recogida (según la tarifa indicada) -2da parte-
    //*
    //* Revisamos que el ID enviado (_myid) correponda con algunas de las queries para las que esperamos respuesta y que
    //* quien haya invocado esta función sea provable_cbAddress.
    //* Recogemos el valor enviado en _result y continuamos con el proceso para el cálculo de tokens que se entregarán al usuario
    //*
    function __callback(bytes32 _myid, string memory _result) public {
       require(pendingQueries[_myid].isPending, "there is not any query pending with that ID");
       require(msg.sender == provable_cbAddress(), "address not valid for the callback");

       uint _price = parseInt(_result);
       emit LogPriceUpdated(_result);

       sendCoin_cont(_price, pendingQueries[_myid].senderContract, pendingQueries[_myid].transPending);

       delete pendingQueries[_myid];
       countQueries = SafeMath.sub32(countQueries, 1);
    }

    //*
    //* DEBUG: Función para consultar la referencia de las queries enviadas al oráculo
    //*
    function getPendTx1(uint _ind) external view returns(bytes32) {
        return pendTx1[_ind];
    }

    //*
    //* Función para crear un usuario en el sistema y poder gestionar sus datos asociados
    //*
    function createUser() internal {

        if (users[msg.sender].dtUltMvt == 0 && users[msg.sender].countMvts == 0) {

            users[msg.sender].userContr = new UserFactory(msg.sender);
            users[msg.sender].dtUltMvt = block.timestamp;
            users[msg.sender].countMvts = 0;
            users[msg.sender].balance = 0;

            countUsers = SafeMath.add32(countUsers, 1);
            users[msg.sender].seq = countUsers;
            listaUsers[countUsers] = msg.sender;

            emit newUser(msg.sender, users[msg.sender].userContr, users[msg.sender].seq);
        }
    }

    //*
    //* Función para borrar los datos de una cuenta en caso de que fuese necesario (solo por el owner)
    //*
    function deleteUser(address _addr) public onlyOwner {
        require (_addr != address(0), "a valid address is required");

        // Solo se elimina si hubiese tenido alguna operación (dtUltMvt: fecha ult. mvto.)
        if (users[msg.sender].dtUltMvt != 0) {

            listaUsers[users[msg.sender].seq] = address(0);
            globalBalance = SafeMath.sub(globalBalance, users[msg.sender].balance);

            delete users[msg.sender];
        }
    }

    //*
    //* Función para incrementar el saldo de tokens del usuario
    //*
    function addBalance(address _sender, uint _amount) internal {

        users[_sender].balance = SafeMath.add(users[_sender].balance, _amount);
        globalBalance = SafeMath.add(globalBalance, _amount);

        emit newBalance(msg.sender, users[msg.sender].balance);
    }

    //*
    //* Función para consultar el saldo de tokens del usuario
    //*
    function getBalance(address _addr) public view returns(uint) {
        return users[_addr].balance;
    }

    //*
    //* Función para consultar el saldo global del sistema de tokens que se han asignado
    //*
    function getGlobalBalance() public view returns(uint) {
        return globalBalance;
    }

    //*
    //* Función para consultar el saldo en Ethers del contrato (necesario para el pago de gas para el Oráculo)
    //*
    function getContractBalance() public view returns(uint) {
        return address(this).balance;
    }

    //*
    //* Función utilizada para transferir fondos (Ethers) al contrato 
    //*
    function setFunds(string memory _message) public payable returns(string memory) {
        require (msg.value > 0, "value is not greater than zero");

        return _message;
    }

    //*
    //* Función para transferir el saldo en Ethers del contrato al owner (solo por el owner)
    //*
    function transfer(uint _amount) public onlyOwner {
        require (address(this).balance >= _amount, "not enough balance");

        owner.transfer(_amount);
    }

    //*
    //* Función para consultar los movimientos de una cuenta (uno por llamada)
    //* Se requiere la dirección de la cuenta y el indíce del movimiento
    //*
    function getMovement(address _addr, uint _ind) external view returns(string memory, string memory, uint32, string memory, uint, uint) {
        require (_addr != address(0), "an address is required");
        require (_ind > 0,"value must be greater than zero");
        require (_ind <= users[_addr].countMvts, "value is higher than last movement index");

        Mvt memory _tx;

        (_tx.code, _tx.fee, _tx.qty, _tx.uni, _tx.amount, _tx.date) = users[_addr].userContr.getMovement(_ind);

        //return (mvts[pos]);
        return (_tx.code, _tx.fee, _tx.qty, _tx.uni, _tx.amount, _tx.date);
    }

    //*
    //* Devuelve el número de movimientos que tiene una cuenta
    //*
    function getMovementCount(address _addr) external view returns(uint32) {
        require (_addr != address(0), "a valid address is required");

        return users[_addr].countMvts;
    }

    //*
    //* Función para obtener la lista usuarios que han utilizado el sistema (se obtiene una address por llamada)
    //*
    function getUser(uint32 _ind) external view returns(address) {
        require (_ind > 0,"value must be greater than zero");
        require (_ind <= countUsers, "value is higher than the number of users");

        return listaUsers[_ind];
    }

    //*
    //* Función para obtener el número de usuarios que han utilizado el sistema
    //*
    function getUserCount() external view returns(uint32) {
        return countUsers;
    }

    //*
    //* Función para obtener el número de queries pendientes de procesar por el oráculo
    //*
    function getCountQueries() external view returns(uint32) {
        return countQueries;
    }

    //*
    //* Función para descontar el saldo de tokens de un usuario
    //*
    function withdrawal(uint _amount) public whenNotPaused returns(uint) {
        require(users[msg.sender].balance >= _amount,"not enough balance");
        require(globalBalance >= _amount,"not enough global balance");

        users[msg.sender].balance = SafeMath.sub(users[msg.sender].balance,_amount);
        globalBalance = SafeMath.sub(globalBalance,_amount);

        return users[msg.sender].balance;
    }

    //*
    //* Función para desactivar de forma permanente el contrato (solo por el owner)
    //*
    function kill() public payable onlyOwner whenPaused {
        require (globalBalance == 0, "global balance is not zero");
        selfdestruct(msg.sender);
    }

    // Fallback function - Called if other functions don't match call or
    // sent ether without data
    // Typically, called when invalid data is sent
    // Added so ether sent to this contract is reverted if the contract fails
    // otherwise, the sender's money is transferred to contract
    function () external payable {
        revert();
    }

}