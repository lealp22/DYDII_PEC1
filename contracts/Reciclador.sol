pragma solidity ^0.5.0;

import "github.com/provable-things/ethereum-api/provableAPI_0.5.sol";

import "./SafeMath.sol";
import "./Pausable.sol";

contract UserFactory {

    address owner;
    address factory;
    uint    balance;
    uint32  cont;

    struct Mvt {
        uint   mvtoAmount;
        uint   mvtoDate;
    }

    Mvt[] mvts;

    constructor(address _owner) public {
        owner = _owner;
        factory = msg.sender;
    }

    function addMovement(uint _amount) public {
        mvts[cont].mvtoAmount = _amount;
        mvts[cont].mvtoDate = now;

        cont = SafeMath.add32(cont,1);
        balance = SafeMath.add(balance,_amount);
    }

    function getMovement(uint _ind) external view returns(uint, uint) {
        require (_ind > 0,"value must be greater than zero");
        require (_ind <= cont+1, "value is higher than last movement index");

        return (mvts[_ind].mvtoAmount,mvts[_ind].mvtoDate);
    }

}

contract Reciclador is Pausable, usingProvable {

    address public owner;

    struct User {
        uint    balance;
        uint    dtUltMvt;
        uint32  contMvts;
        uint32  seq;
        UserFactory userContr;
    }

    uint32 contUsers;
    uint   globalBalance;
    uint   price;

    mapping (uint => address) private listaUsers;
    mapping (address => User) private users;

    event newUser(
        address indexed _sender, UserFactory indexed _contract, uint32 _seq
    );

    event newBalance(
        address indexed _sender, uint _balance
    );

    //event LogConstructorInitiated(string nextStep);
    event LogPriceUpdated(string price);
    event LogNewProvableQuery(string description);

    modifier isOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor() public {
        owner = msg.sender;
        createUser();
        addBalance(10000);
    }

    function sendCoin(uint _amount) public {
        require(_amount > 0,"amount is not greater than zero");
        require(_amount < 10000,"amount is too high");

        createUser();
        //users[msg.sender].dtUltMvt = now;
        users[msg.sender].dtUltMvt = block.timestamp;
        users[msg.sender].contMvts += 1;
        users[msg.sender].userContr.addMovement(_amount);
        addBalance(_amount);
    }

    function createUser() public {

        if (users[msg.sender].dtUltMvt == 0 && users[msg.sender].contMvts == 0) {

            // Temporal. Se debe asignar la dirección del contrato
            users[msg.sender].userContr = new UserFactory(msg.sender);
            //users[msg.sender].dtUltMvt = now;
            users[msg.sender].dtUltMvt = block.timestamp;
            users[msg.sender].contMvts = 0;
            users[msg.sender].balance = 0;

            contUsers++;
            users[msg.sender].seq = contUsers;
            listaUsers[contUsers] = msg.sender;

            emit newUser(msg.sender, users[msg.sender].userContr, users[msg.sender].seq);
        }
    }

    function deleteUser() public {

        if (users[msg.sender].dtUltMvt != 0) {

            // call eliminarcontract(users[msg.sender].contract);

            listaUsers[users[msg.sender].seq] = address(0); //Es una dirección
            globalBalance -= users[msg.sender].balance;

            users[msg.sender].balance = 0;
            users[msg.sender].dtUltMvt = 0;
            users[msg.sender].contMvts = 0;
            users[msg.sender].seq = 0;
            // users[msg.sender].userContr = address(0); --> ¿Cómo se inicializa?

        }
    }

    function addBalance(uint _amount) internal {
        //users[msg.sender].balance += _amount;
        //Aquí se puede incluir las operaciones de la librería
        users[msg.sender].balance = SafeMath.add(users[msg.sender].balance,_amount);
        //globalBalance += _amount;
        globalBalance = SafeMath.add(globalBalance,_amount);

        emit newBalance(msg.sender, users[msg.sender].balance);
    }

    function getBalance(address _addr) public view returns(uint) {
        return users[_addr].balance;
    }

    function withdrawal(uint _amount) public returns(uint) {
        require(users[msg.sender].balance >= _amount,"not enough balance");
        require(globalBalance >= _amount,"not enough global balance");

        //users[msg.sender].balance -= _amount;
        //Aquí se puede incluir las operaciones de la librería
        users[msg.sender].balance = SafeMath.sub(users[msg.sender].balance,_amount);
        //globalBalance -= _amount;
        globalBalance = SafeMath.sub(globalBalance,_amount);

        return users[msg.sender].balance;
    }

    function getGlobalBalance() public view returns(uint) {
        return globalBalance;
    }

   function __callback(bytes32 myid, string memory _result) public {
       if (msg.sender != provable_cbAddress()) revert();
       price = parseInt(_result);
       emit LogPriceUpdated(_result);
   }

   function updatePrice(string memory _fee) public payable {
       require(bytes(_fee).length > 0,"fee code is empty");
       
       if (provable_getPrice("URL") > address(this).balance) {
           emit LogNewProvableQuery("Provable query was NOT sent, please add some ETH to cover for the query fee");
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

    function kill() public payable isOwner {
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
