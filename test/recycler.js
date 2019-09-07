const Recycler = artifacts.require("Recycler");

let instance;

beforeEach(async () => {
    instance = await Recycler.deployed();
});

contract("Recycler", accounts => {

  it("El sado de la primera cuenta y el sado global de la Dapp son 10000 token", async () => {
    //const instance = await Recycler.deployed();
    const balance = await instance.getBalance.call(accounts[0]);
    const globalBalance = await instance.getGlobalBalance.call();
    assert.equal(balance.valueOf(), 10000, "La primera cuenta no tiene 10000 tokens");
    assert.equal(globalBalance.valueOf(), 10000, "El sado global no es de 10000 tokens");
  });

  it("Se crea un usuario correctamente con el despliegue del contrato", async () => {
    //const instance = await Recycler.deployed();
    const userCount = await instance.getUserCount.call();
    const firstUser = await instance.getUser.call(1);

    assert.equal(userCount.valueOf(), 1, "El contador de usuarios tiene un valor incorrecto");
    assert.equal(firstUser, accounts[0], "La dirección del primer usuario no es correcta");
  });  

  it("Pago de tokens a una cuenta", async () => {

    let code = "PRUEBA";
    let fee = "";
    let qty = 1;
    let uni = "UNI";

    await instance.sendCoin(code, fee, qty, uni, { from: accounts[0] });

    const balance = await instance.getBalance.call(accounts[0]);
    const globalBalance = await instance.getGlobalBalance.call();
    const mvtCount = await instance.getMovementCount.call(accounts[0]);

    assert.equal(balance.valueOf(), 10001, "La cuenta no tiene 10001 tokens");
    assert.equal(globalBalance.valueOf(), 10001, "El sado global no es de 10001 tokens");
    assert.equal(mvtCount.valueOf(), 1, "No se ha contabilizado el movimiento");
   
  });  

  // Se crea el movimiento con los valores correctos
  // Se registra la dirección con su primer envío

  it("LLama a una función de Pausable.sol para comprobar la herencia", async () => {
    const RecyclerPaused = await instance.paused.call();

    assert.isFalse(RecyclerPaused, "Valor inesperado. Puede haber problemas con la herencia");
  });

  it("LLama a una función de Ownable.sol para comprobar la herencia", async () => {
    const RecyclerOwner = await instance.owner.call();

    assert.equal(RecyclerOwner, accounts[0],
      "Valor inesperado. Puede haber problemas con la herencia"
    );
  });

/*   it("should call a function that depends on a linked library", async () => {
    const instance = await Recycler.deployed();
    const RecyclerBalance = await instance.getBalance.call(accounts[0]);
    const RecyclerBalanceInEth = await instance.getBalanceInEth.call(
      accounts[0],
    );

    const expected = 2 * RecyclerBa0xCA35b7d915458EF540aDe6068dFe2F44E8fa733clance.toNumber();

    assert.equal(
      RecyclerBalanceInEth.toNumber(),
      expected,
      "Library function returned unexpeced function, linkage may be broken",
    );
  }); */  

/*   it("should send coin correctly", async () => {
    const instance = await Recycler.deployed();

    const account1 = accounts[0];
    const account2 = accounts[1];

    // get initial balances
    const initBalance1 = await instance.getBalance.call(account1);
    const initBalance2 = await instance.getBalance.call(account2);

    // send coins from account 1 to 2
    const amount = 10;
    await instance.sendCoin(account2, amount, { from: account1 });

    // get final balances
    const finalBalance1 = await instance.getBalance.call(account1);
    const finalBalance2 = await instance.getBalance.call(account2);

    assert.equal(
      finalBalance1.toNumber(),
      initBalance1.toNumber() - amount,
      "Amount wasn't correctly taken from the sender",
    );
    assert.equal(
      finalBalance2.toNumber(),
      initBalance2.toNumber() + amount,
      "Amount wasn't correctly sent to the receiver",
    );
  }); */
});
