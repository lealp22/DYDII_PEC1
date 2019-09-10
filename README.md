# PEC 1 - Diseño y Desarrollo II
### Realizada por: [Jesús A. Leal Pérez](mailto:lealp22@yahoo.com)
---
# Dapp - Recolección de Envases para Reciclaje

En construcción...


## Indice

- [Acerca esta Dapp](#acerca-esta-dapp)

- [Puntos evaluables](#puntos-evaluables)

---

## Acerca esta Dapp

Esta Dapp intenta simular el mecanismo con el que se le gratificaría a un usuario por la
entrega de envases para su reciclado.

Básicamente se introduciría el código de barras en la etiqueta del envase y, siempre que
estuviese registrado en el sistema, se asignaría una cantidad de tokens establecidos por
una tarifa definida para dicho envase. En caso de no estar registrado, se asignaría un
token por cada unidad recolectada.

![./images/Recycler3.jpg](./images/Recycler3.jpg)  
[Fuente: 20minutos.es](https://blogs.20minutos.es/capeando-la-crisis/2018/02/07/maquinas-que-dan-dinero-por-reciclar-botellas-de-plastico-las-queremos-en-espana/)  

---
## Funcionamiento

La página web de la aplicación lucirá de forma similar:

![Screenshot_1.jpg](./images/Screenshot_1.jpg)
![Screenshot_2.jpg](./images/Screenshot_2.jpg)
![Screenshot_3.jpg](./images/Screenshot_3.jpg)

Contando con los siguientes elementos:

Lateral derecho: 
----------------
Muestra información sobre la cuenta con la que se está trabajando en el momento e información sobre elementos del entorno.

Este se compone de:

- **Estado**: muestra la última acción relevante realizada por la Dapp en relación a la cuenta que se está utilizando.

- **Cuenta**: Dirección de la cuenta con la se está trabajando 

- **Saldo tokens:** Saldo asignado a la cuenta (en términos de tokens).

- **Red**: Id de la red sobre la que se está trabajando.

- **Log**: Cuadro de texto en el que se van acumulando los mensaje




## ¿Cómo instalar y configurar en local?

1) Fire up your favourite console & clone this repo somewhere:

❍ git clone https://github.com/provable-things/ethereum-examples.git

2) Enter this directory & install dependencies:

❍ cd ethereum-examples/solidity/truffle-examples/diesel-price && npm install

3) Launch Truffle:

❍ npx truffle develop

4) Open a new console in the same directory & spool up the ethereum-bridge:

❍ npx ethereum-bridge -a 9 -H 127.0.0.1 -p 9545 --dev

5) Once the bridge is ready & listening, go back to the first console with Truffle running & set the tests going!

❍ truffle(develop)> test


### Versiones programas instalados

- Truffle v5.0.24  
- Node v8.10.0  
- Solc: 0.5.0+commit  

lealp22@lealp22-VirtualBox:~/dapp_PEC1$ npm list -g --depth 0
/usr/local/lib
├── ganache-cli@6.4.4
├── npm@6.9.0
├── solc@0.5.10
└── truffle@5.0.24


## Casos de uso
...

## ¿Cómo utilizar la Dapp?
...

## Pruebas
...

---
# Puntos evaluables

## LIBRERIA - Utilizar una librería existente de OpenZeppelin o EthPM

Se ha utilizado la librería **Safemath.sol** de OpenZeppelin

Su versión original se puede encontrar en:
[https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/math/SafeMath.sol](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/math/SafeMath.sol)

>Sin embargo, se ha modificado para incluir dos funciones nuevas para la suma y resta de enteros de 32 bytes (para los contadores utilizados en _Recycler.sol_)


Mencionar que esta librería no necesita ser desplegada por separado, por lo que no es necesario vincularla en el deploy de los contratos.
Todas las funciones de _Safemath_ son _internal_, por lo que la EVM simplemente la incluye dentro del contrato.

---
## SMART CONTRACTS - Uso de algún mecanismo como Herencia o Factory Contracts

Se han implementado ambos mecanismos:


### 1) Herencia

Se han utilizados los contratos de OpenZeppelin:

**Pausable.sol**

Su versión original se puede encontrar en:
[https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/lifecycle/Pausable.sol](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/lifecycle/Pausable.sol)

> En nuestro caso se han hecho algunas modificaciones:
>- Se simplifica para que el owner del contrato sea la única persona que pueda invocar las funciones _pause()_ y _unpause()_.
>- Se incluye herencia de _Ownable.sol_ para poder implementar el cambio anterior.

**Ownable.sol**

Su versión original se puede encontrar en:
[https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/ownership/Ownable.sol](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/ownership/Ownable.sol)

> Se ha utilizado una versión antigua adaptada para que la dirección del owner sea payable y se le pueda transferir el saldo del contrato sin necesidad de hacer posteriores conversiones de la dirección (de _address_ a _address payable_).

También se ha utilizado el contrato de _Provable_:

**provableAPI_0.5.sol**

En este se incluye todos los contratos necesarios para trabajar con oráculos.

Su versión original se puede encontrar en:
[https://github.com/provable-things/ethereum-api/blob/master/provableAPI_0.5.sol](https://github.com/provable-things/ethereum-api/blob/master/provableAPI_0.5.sol)


**En resumen:**
* El contrato _Pausable_ hereda de _Ownable_ 
* El contrato _Recycler_ hereda de _Pausable_ y _usingProvable_ (en provableAPI_0.5.sol), implementando todas las funciones de estos tres contratos.

>_contract Pausable is Ownable_  
>_contract Recycler is usingProvable, Pausable_  


### 2) Factory Contracts

Se ha creado el contrato **UserFactory** (en _Recycler.sol_) encargado de gestionar por separado los movimientos de tokens de cada uno de los usuarios (direcciones) que utilicen la dapp.

En el contrato _Recycler_, dentro de los datos de cada usuario (struct user), se incluye el _factory contract_ (userContr) que gestionará sus movimientos:
````
    //* Estructura para datos de usuarios
    struct User {
        uint    balance;
        uint    dtUltMvt;
        uint32  countMvts;
        uint32  seq;
        UserFactory userContr;
    }
````
---
## SMART CONTRACTS - Implementar una parada de emergencia en el contrato (Circuit Breaker / Emergency Stop)

Se implementa una parada de emergencia a trávez de las funciones **Pause()** y **Unpause()** definidas en _Pausable.sol_ y la utilización de los modificadores **whenNotPaused()** y **whenPaused()** en algunas de las funciones del contrato principal _Recycler_.

Esta implementación se ha hecho a través de un botón de **"Pause"** que aparece al final de la pantalla y se habilita únicamente cuando la _address_ activa es la del _owner_ del contrato. Además, se muestra el estado actual del contrato:

![./images/Screenshot_pause.jpg](./images/Screenshot_pause.jpg)

![./images/Screenshot_unpause.jpg](./images/Screenshot_unpause.jpg)

Esto es gestionado a través de los eventos **Paused()** y **Unpaused()**.

## SMART CONTRACTS - Medidas adoptadas en los contratos en cuanto a seguridad para evitar ataques típicos.

## SMART CONTRACTS - Posibles patrones de actualización que usaría en el contrato (No es necesario realizar la implementación)

## SMART CONTRACTS - Comentar los contratos según lo indicado en https://solidity.readthedocs.io/en/latest/layout-of-source-files.html#comments

Se han incluido los comentarios en Recycler.sol

---
## TESTING - Justifiación test creados y explicación función que realizan cada uno.

**- Test "Se crea un usuario correctamente con el despliegue del contrato"**

Intenta validar las acciones realizadas con el despliegue del contrato (_constructor_).
  
Se valida que:
- Tras el despliegue el contador de usuarios es 1
- Que la dirección de ese primer usuario es la primera cuenta (coinbase)
     
  
**- Test "El sado de la primera cuenta y el sado global de la Dapp son 10000 token"**

Complementa el test anterior en intentar validar las acciones realizadas con el despliegue del contrato (_constructor_)_.
     
Se valida que:
- El saldo del primer usuario es 10.000 tokens (asignados en el constructor)
- El usuario tiene registrada una transacción (movimiento) por dichos tokens
- Lo 10.000 tokens se reflejan en el saldo global de la Dapp
     

**- Test "Pago de tokens a una cuenta y registro del movimiento"**

La prueba realiza una transferencia de tokens, que sería la función base de la app, enviando 5 tokens a la cuenta base. Se intenta verificar el estado final de la cuenta de destino y del movimiento que deja constancia de ello.
     
Se valida que:
- El saldo de la cuenta se incrementa en 5 tokens (10.005 tokens)
- El saldo global también se incrementa en 5 tokens (10.005 tokens)
- Se crea una nueva transacción (movimiento) para dicha cuenta (2 mvtos)
- Que los valores de este movimiento coinciden con los enviados
       
**- Test "Pago de tokens a una segunda cuenta con su alta en la Dapp y el registro del movimiento"**

Se intenta realizar una transferencia de 5 tokens a una nueva cuenta, lo que conlleva el alta de esta como usuario del sistema, con lo que se verifica el alta de la cuenta, su estado tras la transferencia y el estado de la Dapp.
     
Se valida que:
- El saldo de la cuenta es de 5 tokens 
- Dicha cuenta tiene un movimiento
- Que los valores de este movimiento coinciden con los enviados
- El contador de usuario de la Dapp se incrementa a 2
- Que este segundo usuario coincide con la cuenta utilizada
- El saldo global se incrementa en 5 tokens (10.010 tokens)
         
  
**- Test "Generación de eventos"**

Se realiza una transferencia de 7 tokens a una nueva cuenta para verificar que se generen
todos los eventos esperados:
     
Se valida que:
- Se ejecuta el evento newUser (alta usuario)
- Se ejecuta el evento newBalance (actualización saldo de tokens)
- Se ejecuta el evento coinSent (transacción realizada)
- Que los valores enviados en el evento cointSent coinciden con los de la transferencia
       
  
**- Test "LLama a una función de Pausable.sol para comprobar la herencia"**
     
LLama a una función de Pausable.sol para comprobar que esta disponible y se puede ejecutar.
     

**- Test "Activar y desactivar la pausa (circuit break) de la Dapp"**
     
En este test se activa y desactiva los estados (Pause/Unpause) con los que se implementa el "circuit break" de la Dapp.
     
Se valida:
- El estado de la Dapp tras ejecutar cada una de las acciones (Pause y Unpause)
- Se emiten los eventos correspondientes
     
  
**- Test "LLama a una función de Ownable.sol para comprobar la herencia"**  
     
LLama a una función de Ownable.sol para comprobar que esté disponible y se puede ejecutar.
     

**- Test "Enviar y recibir Ethers"**
     
Aquí se prueban las funciones disponibles para manejar el saldo en Ethers del contrato.
Por un lado el envío de Ethers desde una cuenta al contrato y por otro el retiro de los fondos para transferirlos al owner.
     
Para ello:
- Se traspasan weis al contrato
- Se consulta el saldo  
- Se traspasan los weis al owner
     
Se valida que el saldo inicial y final son iguales, mientras que el intermedio es superior
     
  
**- Test "Se detiene el contrato (Pause) y se intenta enviar tokens"**
     
Se detiene el contrato (Pause) para activar el "circuit break" y se valida que no se pueden realizarse transacciones

Se comprueba que:
- Cambia el estado del contrato (a paused)
- Se emite el evento Paused()
- Se produce un error al intentar realizar la transferencia


**Observaciones:**

- No se ha podido automatizar el test para comprobar el correcto funcionamiento del
  oráculo. Al haber un callback y necesitar de la utilización de ethereum-bridge
  se ha descartado el test por la complejidad que requería. Sin embargo, sí que se ha probado que funciona en local correctamente desde el Front.

![Test utilizando el oráculo](./images/Screenshot_test_oraculo_local.jpg)


## TESTING - Todos los test se ejecutan satisfactoriamente.

Todos los test se ejecutan satisfactoriamente:

![Resultado test](./images/Screenshot_test.jpg)


## TESTING - Realizar comentarios sobre el código de los tests.

Todos los tests han sido comentados dentro de test/recycler.js

---
## EXTRAS - Alojar el/los contrato/s en una testnet y verificar el código
Detallar procedimiento e indicar las direcciones

## EXTRAS - Alojar la aplicación en IPFS / Swarm
Detallar procedimiento e indicar los hash

## EXTRAS - Utilizar ENS (no para referirse a un hash de Swarm)
Detallar procediiento y funcionamiento / caso de uso del ENS en la aplicación

## EXTRAS - Uso de oráculos
Detallar procedimiento realizado, añadir guía para el lanzamiento del oráculo y dejar claro su funcionamiento


