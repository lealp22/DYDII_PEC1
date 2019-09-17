const Recycler = artifacts.require("Recycler");

let instance;

beforeEach(async () => {
    instance = await Recycler.deployed();
});

contract("Recycler", accounts => {

  /**
   *  Se valida que:
   *  - Tras el despliegue el contador de usuarios es 1
   *  - Que la dirección de ese primer usuario es la primera cuenta (coinbase)
   */
  it("Se crea un usuario correctamente con el despliegue del contrato", async () => {

    const userCount = await instance.getUserCount.call();
    const firstUser = await instance.getUser.call(1);

    assert.equal(userCount.valueOf(), 1, "El contador de usuarios tiene un valor incorrecto");
    assert.equal(firstUser, accounts[0], "La dirección del primer usuario no es correcta");
  });

  /**
   *  Se valida que:
   *  - El saldo del primer usuario es 10.000 tokens (asignados en el constructor)
   *  - El usuario aún no tiene registrada ninguna transacción (movimiento)
   *  - Lo 10.000 tokens se reflejan en el saldo global de la Dapp
   */
  it("El sado de la primera cuenta y el sado global de la Dapp son 10000 token", async () => {

    const balance = await instance.getBalance.call(accounts[0]);
    const numMvts = await instance.getMovementCount.call(accounts[0]);
    const globalBalance = await instance.getGlobalBalance.call();
    assert.equal(balance.valueOf(), 10000, "La primera cuenta no tiene 10000 tokens");
    assert.equal(numMvts.valueOf(), 0, "La cuenta ya tiene movimientos");
    assert.equal(globalBalance.valueOf(), 10000, "El sado global no es de 10000 tokens");
  });

  /**
   *  Se realiza una transferencia con la que se asignan 5 tokens a la cuenta base
   * 
   *  Se valida que:
   *  - El saldo de la cuenta se incrementa en 5 tokens (10.005 tokens)
   *  - El saldo global también se incrementa en 5 tokens (10.005 tokens)
   *  - Se crea una nueva transacción (movimiento) para dicha cuenta (1er mvto)
   *  - Que los valores de este movimiento coinciden con los enviados
   */  
  it("Pago de tokens a una cuenta y registro del movimiento", async () => {

    let code = "PRUEBA";
    let fee = "";
    let qty = 5;
    let uni = "UNI";

    await instance.sendCoin(code, fee, qty, uni, { from: accounts[0] });

    const balance = await instance.getBalance.call(accounts[0]);
    const globalBalance = await instance.getGlobalBalance.call();
    const mvtCount = await instance.getMovementCount.call(accounts[0]);
    const mvt = await instance.getMovement.call(accounts[0], 1);

    assert.equal(balance.valueOf(), 10005, "La cuenta no tiene 10005 tokens");
    assert.equal(globalBalance.valueOf(), 10005, "El sado global no es de 10005 tokens");
    assert.equal(mvtCount.valueOf(), 1, "No se ha contabilizado el movimiento");
    assert.equal(mvt[0], code, "El código del movimiento es distinto al enviado");
    assert.equal(mvt[1], fee, "La tarifa del movimiento es distinto al enviado");
    assert.equal(mvt[2], qty, "La cantidad del movimiento es distinta a la enviada");
    assert.equal(mvt[3], uni, "La unidad del movimiento es distinta a la enviada");
  });  

  /**
   *  Se realiza una transferencia de 5 tokens a una nueva cuenta
   * 
   *  Se valida que:
   *  - El saldo de la cuenta es de 5 tokens 
   *  - Dicha cuenta tiene un movimiento
   *  - Que los valores de este movimiento coinciden con los enviados
   *  - El contador de usuario de la Dapp se incrementa a 2
   *  - Que este segundo usuario coincide con la cuenta utilizada
   *  - El saldo global se incrementa en 5 tokens (10.010 tokens)
   */    
  it("Pago de tokens a una segunda cuenta con su alta en la Dapp y el registro del movimiento", async () => {

    let cuenta = accounts[1];
    let code = "PRUEBA2";
    let fee = "";
    let qty = 5;
    let uni = "KGM";

    await instance.sendCoin(code, fee, qty, uni, { from: cuenta });

    const balance = await instance.getBalance.call(cuenta);
    const mvtCount = await instance.getMovementCount.call(cuenta);
    const mvt = await instance.getMovement.call(cuenta, 1);
    const usersCount = await instance.getUserCount.call();
    const secondUser = await instance.getUser.call(2);
    const globalBalance = await instance.getGlobalBalance.call();

    assert.equal(balance.valueOf(), 5, "La cuenta no tiene 5 tokens");
    assert.equal(mvtCount.valueOf(), 1, "No se ha contabilizado el movimiento");
    assert.equal(mvt[0], code, "El código del movimiento es distinto al enviado");
    assert.equal(mvt[1], fee, "La tarifa del movimiento es distinto al enviado");
    assert.equal(mvt[2], qty, "La cantidad del movimiento es distinta a la enviada");
    assert.equal(mvt[3], uni, "La unidad del movimiento es distinta a la enviada");
    assert.equal(usersCount.valueOf(), 2, "El contador de usuarios tiene un valor incorrecto");
    assert.equal(secondUser, cuenta, "La dirección del segundo usuario no es correcta");
    assert.equal(globalBalance.valueOf(), 10010, "El sado global no es de 10010 tokens");

  });  

  /**
   *  Se realiza una transferencia de 7 tokens a una nueva cuenta
   * 
   *  Se valida que:
   *  - Se ejecuta el evento newUser
   *  - Se ejecuta el evento newBalance
   *  - Se ejecuta el evento coinSent
   *  - Que los valores enviados en el evento cointSent coinciden con los de la transferencia
   */  
  it("Generación de eventos", async () => {
  
    let cuenta = accounts[2];
    let code = "PRUEBA3";
    let fee = "";
    let qty = 7;
    let uni = "UNI";

    let result = await instance.sendCoin(code, fee, qty, uni, { from: cuenta });

    assert.equal(result.logs[0].event, "newUser", "No se generó evento newUser");
    assert.equal(result.logs[1].event, "newBalance", "No se generó evento newBalance");
    assert.equal(result.logs[2].event, "coinSent", "No se generó evento coinSent");

    let mvtFields = result.logs[2].args;

    assert.equal(mvtFields._code, code, "Campo code evento coinSent no es válido");
    assert.equal(mvtFields._fee, fee, "Campo fee evento coinSent no es válido");
    assert.equal(mvtFields._qty, qty, "Campo qty evento coinSent no es válido");
    assert.equal(mvtFields._uni, uni, "Campo uni evento coinSent no es válido");
    assert.equal(mvtFields._amount, qty, "Campo amount evento coinSent no es válido");
  });

  /**
   *  LLama a una función de Pausable.sol para comprobar que esté disponible
   */
  it("LLama a una función de Pausable.sol para comprobar la herencia", async () => {
    const RecyclerPaused = await instance.paused.call();

    assert.isFalse(RecyclerPaused, "Valor inesperado. Puede haber problemas con la herencia");
  });

  /**
   *  Activa y desactiva los estados que implementan el "circuit breaker" de la Dapp
   * 
   *  Se valida:
   *  - El estado de la Dapp tras ejecutar la acciones de Pause/Unpause
   *  - Se emiten los eventos correspondientes
   */
  it("Activar y desactivar la pausa (circuit breaker) de la Dapp", async () => {
    
    let result1 = await instance.pause({
      from: accounts[0]
    });
    const RecyclerPaused = await instance.paused.call();
    
    let result2 = await instance.unpause({
      from: accounts[0]
    });
    const RecyclerUnpaused = await instance.paused.call();

    assert.isTrue(RecyclerPaused, "No se activó la pausa correctamente");
    assert.isFalse(RecyclerUnpaused, "No se activó la pausa correctamente");
    assert.equal(result1.logs[0].event, "Paused", "No se generó evento Paused()");
    assert.equal(result2.logs[0].event, "Unpaused", "No se generó evento Unpaused()");
  });

  /**
   *  LLama a una función de Ownable.sol para comprobar que esté disponible
   */
  it("LLama a una función de Ownable.sol para comprobar la herencia", async () => {
    const RecyclerOwner = await instance.owner.call();

    assert.equal(RecyclerOwner, accounts[0],
      "Valor inesperado. Puede haber problemas con la herencia"
    );
  });

  /**
   *  Test de funciones para manejar el saldo en Ethers del contrato
   * 
   *  Para ello:
   *  - Se traspasan weis al contrato
   *  - Se consulta el saldo  
   *  - Se traspasan los weis al owner
   * 
   *  Se valida que el saldo inicial y final son iguales, mientras que el intermedio
   *  es superior
   */
  it("Enviar y recibir Ethers", async () => {

    let incBalance = 20000000000;

    const contractBalance1 = await instance.getContractBalance.call();
    const newBalance1 = contractBalance1 / 1e10;

    let result1 = await instance.setFunds("Envío de fondos", {
      from: accounts[0],
      value: incBalance
    });
 
    const contractBalance2 = await instance.getContractBalance.call();
    const newBalance2 = contractBalance2 / 1e10;

    let result2 = await instance.transfer(incBalance, {
      from: accounts[0],
    });

    const contractBalance3 = await instance.getContractBalance.call();
    const newBalance3 = contractBalance3 / 1e10;

    assert.equal(newBalance1, newBalance3, "El saldo inicial y final son distintos");
    assert.isTrue((newBalance2 > newBalance3), "Se descontó el saldo correctamente");

  });

  /**
   *  Se detiene el contrato (Pause) para activar el "circuit breaker" y se valida
   *  que no se pueden realizarse transacciones
   */
  it("Se detiene el contrato (Pause) y se intenta enviar tokens", async () => {

    let result = await instance.pause({
      from: accounts[0]
    });
    const RecyclerPaused = await instance.paused.call();

    assert.isTrue(RecyclerPaused, "No se activó la pausa correctamente");
    assert.equal(result.logs[0].event, "Paused", "No se generó evento Paused()");

    let steps = 0;

    try {
      let receipt = await instance.sendCoin("PRUEBA5", "", 5, "UNI", { 
        from: accounts[0] 
      });
      steps += 1;
      assert.fail("La transacción se ha podido realizar");
    } catch (error) {
      steps += 1;
      assert.equal(steps, 1, "Debe producirse un error");
    } 

  }); 
});
