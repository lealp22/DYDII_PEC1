pragma solidity ^0.5.0;

//import "github.com/provable-things/ethereum-api/provableAPI_0.5.sol";
import "./provableAPI_0.5.sol";

import "./SafeMath.sol";
import "./Pausable.sol";

contract UserFactory {

    address owner;
    address factory;
    uint    balance;
    uint32  cont;

    struct Mvt {
        string code;
        string fee;
        uint32 qty;
        string uni;
        uint   amount;
        uint   date;
    }

    Mvt[] mvts;

    event newMovement(
        address indexed _owner, address indexed _contract, uint _amount, uint _balance, uint _cont
    );

    constructor(address _owner) public {
        owner = _owner;
        factory = msg.sender;
    }

    function addMovement(string memory _code, string memory _fee, uint32 _qty, string memory _uni, uint _amount) public {
        require(_qty > 0,"quantity is not greater than zero");
        require(_qty < 1000,"quantity is too high");
        require(bytes(_code).length > 0,"package code is empty");
        require(bytes(_uni).length > 0,"unit code is empty");

        Mvt memory _tx;

        // Si el código de comisión está vacío, los campos amount y qty deben ser iguales (price=1)
        if (bytes(_fee).length == 0 && _amount != _qty) {
            revert("Price does not correspond with a empty fee");
        }

        _tx.code   = _code;
        _tx.fee    = _fee;
        _tx.qty    = _qty;
        _tx.uni    = _uni;
        _tx.amount = _amount;
        _tx.date   = now;

        // Incluimos la transacción en el array de movimientos
        mvts.push(_tx);

        // Actualizamos el contador de movimientos y el saldo
        cont = SafeMath.add32(cont,1);
        balance = SafeMath.add(balance, _tx.amount);

        //emit evento creación nuevo movimiento
        emit newMovement(owner, address(this), _tx.amount, balance, cont);
    }

    function getMovement(uint _ind) external view returns(string memory, string memory, uint32, string memory, uint, uint) {
        require (_ind > 0,"value must be greater than zero");
        require (_ind <= cont, "value is higher than last movement index");

        uint pos = SafeMath.sub(_ind, 1);

        //return (mvts[pos]);
        return (mvts[pos].code, mvts[pos].fee, mvts[pos].qty, mvts[pos].uni, mvts[pos].amount, mvts[pos].date);
    }

}

contract Recycler is Pausable, usingProvable {

    address public owner;

    struct User {
        uint    balance;
        uint    dtUltMvt;
        uint32  contMvts;
        uint32  seq;
        UserFactory userContr;
    }

    struct Mvt {
        string code;
        string fee;
        uint32 qty;
        string uni;
    }

    uint32 contUsers;
    uint   globalBalance;
    uint   price;
    Mvt    trans;

    mapping (uint => address) private listaUsers;
    mapping (address => User) private users;

    event newUser(
        address indexed _sender, UserFactory indexed _contract, uint32 _seq
    );

    event newBalance(
        address indexed _sender, uint _balance
    );

    //event LogConstructorInitiated(string nextStep);
    event LogPriceUpdated(string _result);
    event LogNewProvableQuery(string description);

    constructor() public {
        owner = msg.sender;
        createUser();
        addBalance(10000);
    }

    function sendCoin(string memory prodCode, string memory prodFee, uint32 prodQty, string memory prodUni) public {
        require(prodQty > 0,"quantity is not greater than zero");
        require(prodQty < 1000,"quantity is too high");
        //require(bytes(prodFee).length > 0,"fee code is empty");
        require(bytes(prodCode).length > 0,"package code is empty");
        require(bytes(prodUni).length > 0,"unit code is empty");

        trans.code = prodCode;
        trans.fee = prodFee;
        trans.qty = prodQty;
        trans.uni = prodUni;
        //trans.date = 0;
        //trans.amount = 0;

        if (bytes(prodFee).length > 0) {
            fetchPrice(prodFee);
        } else {
            price = 1;
            sendCoin_cont();
        }
    }

    function sendCoin_cont() internal {

        uint _amount = SafeMath.mul(trans.qty, price);

        createUser();
        users[msg.sender].dtUltMvt = block.timestamp;
        users[msg.sender].contMvts = SafeMath.add32(users[msg.sender].contMvts, 1);

        //users[msg.sender].userContr.addMovement(trans);
        users[msg.sender].userContr.addMovement(trans.code, trans.fee, trans.qty, trans.uni, _amount);
        addBalance(_amount);
    }

    function createUser() public {

        if (users[msg.sender].dtUltMvt == 0 && users[msg.sender].contMvts == 0) {

            users[msg.sender].userContr = new UserFactory(msg.sender);
            users[msg.sender].dtUltMvt = block.timestamp;
            users[msg.sender].contMvts = 0;
            users[msg.sender].balance = 0;

            contUsers = SafeMath.add32(contUsers, 1);
            users[msg.sender].seq = contUsers;
            listaUsers[contUsers] = msg.sender;

            emit newUser(msg.sender, users[msg.sender].userContr, users[msg.sender].seq);
        }
    }

    function deleteUser() public {

        if (users[msg.sender].dtUltMvt != 0) {

            listaUsers[users[msg.sender].seq] = address(0);
            globalBalance = SafeMath.sub(globalBalance, users[msg.sender].balance);

            users[msg.sender].balance = 0;
            users[msg.sender].dtUltMvt = 0;
            users[msg.sender].contMvts = 0;
            users[msg.sender].seq = 0;
        }
    }

    function addBalance(uint _amount) internal {

        users[msg.sender].balance = SafeMath.add(users[msg.sender].balance,_amount);
        globalBalance = SafeMath.add(globalBalance, _amount);

        emit newBalance(msg.sender, users[msg.sender].balance);
    }

    function getBalance(address _addr) public view returns(uint) {
        return users[_addr].balance;
    }

    function getGlobalBalance() public view returns(uint) {
        return globalBalance;
    }

    function getMovement(uint _ind) external view returns(uint, uint) {
        users[msg.sender].userContr.getMovement(_ind);
    }

    function withdrawal(uint _amount) public returns(uint) {
        require(users[msg.sender].balance >= _amount,"not enough balance");
        require(globalBalance >= _amount,"not enough global balance");

        users[msg.sender].balance = SafeMath.sub(users[msg.sender].balance,_amount);
        globalBalance = SafeMath.sub(globalBalance,_amount);

        return users[msg.sender].balance;
    }


   function __callback(bytes32 myid, string memory _result) public {
       if (msg.sender != provable_cbAddress()) revert();
       price = parseInt(_result);
       emit LogPriceUpdated(_result);

       sendCoin_cont();
   }

   function fetchPrice(string memory _fee) public payable {
       require(bytes(_fee).length > 0,"fee code is empty");

       if (provable_getPrice("URL") > address(this).balance) {
           emit LogNewProvableQuery("Provable letquery was NOT sent, please add some ETH to cover for the query fee");
       } else {
           string memory _url = string(abi.encodePacked("json(https://api.mlab.com/api/1/databases/productos/collections/fees?apiKey=1KuXCnUSqfOGDAoKSZHENTSFBBlu4d6n).0.result.", _fee, ".price"));

           emit LogNewProvableQuery("Provable query was sent, standing by for the answer..");
           provable_query("URL", _url);

           //provable_query("nested", "[URL] ['json(json(https://api.mlab.com/api/1/databases/productos/collections/fees?apiKey=${[decrypt]BPssDAFd3BExbW4l0ee1RNV45pvdhOita1bwVtTzVu7aRvHoFZhuNCuuZnC8wzm6GUQ3yTz18+B2vnoADbHHpRc9NcMb/YZOwXo0sJsM5paIGll6oYEqpjWMQQ3eEISzGkE0/JMIHiDyG1SpiYI3bYg=}).0.result.F0101.price");
//provable_query("nested", "[URL] ['json(https://api.mlab.com/api/1/databases/productos/collections/fees?apiKey=${[decrypt] BPssDAFd3BExbW4l0ee1RNV45pvdhOita1bwVtTzVu7aRvHoFZhuNCuuZnC8wzm6GUQ3yTz18+B2vnoADbHHpRc9NcMb/YZOwXo0sJsM5paIGll6oYEqpjWMQQ3eEISzGkE0/JMIHiDyG1SpiYI3bYg=}).0.result.F0101.price']");
           //Funciona
           //[URL] ['json(https://api.mlab.com/api/1/databases/productos/collections/fees?apiKey=1KuXCnUSqfOGDAoKSZHENTSFBBlu4d6n).0.result.F0101.price']
           //Pendiente de probar - Se queda colgado y no devuelve resultados
           //[URL] ['json(https://api.mlab.com/api/1/databases/productos/collections/fees?apiKey=${[decrypt] BPssDAFd3BExbW4l0ee1RNV45pvdhOita1bwVtTzVu7aRvHoFZhuNCuuZnC8wzm6GUQ3yTz18+B2vnoADbHHpRc9NcMb/YZOwXo0sJsM5paIGll6oYEqpjWMQQ3eEISzGkE0/JMIHiDyG1SpiYI3bYg=}).0.result.F0101.price']
       }
   }

    function kill() public payable onlyOwner {
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
