// interactive test of machine words
// @jsinger
// 3 Nov 2023
//
// Temporarily using test.html as the a runner
// due to interoperability issues between CommonJS modules
// and ES6 modules

let testInterpretAsSigned = () => {
  console.assert(interpretAsSigned(-1, 1) === -1);
  console.assert(interpretAsSigned(0, 1) === 0);
  console.assert(interpretAsSigned(1, 1) === -1);
  console.assert(interpretAsSigned(-2, 2) === -2);
  console.assert(interpretAsSigned(-1, 2) === -1);
  console.assert(interpretAsSigned(0, 2) === 0);
  console.assert(interpretAsSigned(1, 2) === 1);
  console.assert(interpretAsSigned(2, 2) === -2);
  console.assert(interpretAsSigned(3, 2) === -1);
  console.assert(interpretAsSigned(8191, 14) === 8191);
  console.assert(interpretAsSigned(8192, 14) === -8192);
  console.assert(interpretAsSigned(16383, 14) === -1);
  console.assert(interpretAsSigned(2147483647, 31) === -1);
  console.assert(interpretAsSigned(2147483647, 32) === 2147483647);
};

let testInterpretAsUnsigned = () => {
  console.assert(interpretAsUnsigned(-1, 1) === 1);
  console.assert(interpretAsUnsigned(0, 1) === 0);
  console.assert(interpretAsUnsigned(1, 1) === 1);
  console.assert(interpretAsUnsigned(-2, 2) === 2);
  console.assert(interpretAsUnsigned(-1, 2) === 3);
  console.assert(interpretAsUnsigned(0, 2) === 0);
  console.assert(interpretAsUnsigned(1, 2) === 1);
  console.assert(interpretAsUnsigned(2, 2) === 2);
  console.assert(interpretAsUnsigned(3, 2) === 3);
  console.assert(interpretAsUnsigned(-8192, 14) === 8192);
  console.assert(interpretAsUnsigned(-1, 14) === 16383);
  console.assert(interpretAsUnsigned(10000, 14) === 10000);
  console.assert(interpretAsUnsigned(16383, 14) === 16383);
  console.assert(interpretAsUnsigned(2147483647, 31) === 2147483647);
  console.assert(interpretAsUnsigned(-2147483648, 32) === 2147483648);
};

let testMachineWord = () => {
  {
    let w = new MachineWord(8);
    console.assert(w.number === 0);
    console.assert(w.size === 8);
  }

  {
    let w = new MachineWord(8, false);
    w.number = 255;
    let x = new MachineWord(8, false);
    x.number = 2;
    w.add(x);
    console.assert(w.toNumber() === 1);
  }

  {
    let w = new MachineWord(8, false);
    w.number = 1;
    let x = new MachineWord(8, false);
    x.number = 2;
    w.subtract(x);
    console.assert(w.toNumber() === -1);
  }
};

let testAccumulatorArithmetics = () => {
  let m = new SOLIDAC();

  {
    m.initialSet();
    m.executeOrder(new Order(27, 0, 0));

    let w = new MachineWord(20, false);
    w.assign({number: 100, size: 20});

    m.writeStore(0, w);
    m.executeOrder(new Order(33, 0, 0));

    console.assert(m.getAccumulator() === 100);

    m.executeOrder(new Order(34, 0, 0));

    console.assert(m.getAccumulator() === 0);

    m.executeOrder(new Order(34, 0, 0));

    console.assert(m.getAccumulator() === -100);
  }

  {
    m.initialSet();
    m.executeOrder(new Order(27, 0, 0));

    m.registers.l.number = ~0 & 0b1111111111111111111;
    m.registers.m.number = ~0 & 0b11111111111111111111;

    let w = new MachineWord(20, false);
    w.assign({number: 1, size: 20});

    m.writeStore(0, w);
    m.executeOrder(new Order(33, 0, 0));

    console.assert(m.getAccumulator() === -Math.pow(2, 39));
    console.assert(m.overflowed);

    m.executeOrder(new Order(33, 0, 0));

    console.assert(m.getAccumulator() === -Math.pow(2, 39) + 1);
    console.assert(!m.overflowed);

    m.executeOrder(new Order(34, 0, 0));

    console.assert(m.getAccumulator() === -Math.pow(2, 39));
    console.assert(!m.overflowed);
    console.assert(!m.underflowed);

    m.executeOrder(new Order(34, 0, 0));

    console.assert(m.getAccumulator() === Math.pow(2, 39) - 1);
    console.assert(!m.overflowed);
    console.assert(m.underflowed);

    m.executeOrder(new Order(34, 0, 0));

    console.assert(m.getAccumulator() === Math.pow(2, 39) - 2);
    console.assert(!m.overflowed);
    console.assert(!m.underflowed);
  }
};

let testAccumulatorArithmeticShift = () => {
  let m = new SOLIDAC();
  
  {
    m.initialSet();
    m.registers.m.number = 0;
    m.registers.l.number = 1;
    
    console.assert(m.getAccumulator() === 1);

    m.executeOrder(new Order(38, 0, 1));

    console.assert(m.getAccumulator() === 2);

    m.executeOrder(new Order(38, 0, 18));

    console.assert(m.getAccumulator() === Math.pow(2, 19));

    m.executeOrder(new Order(36, 0, 19));

    console.assert(m.getAccumulator() === Math.pow(2, 38));
    console.assert(!m.overflowed);
    
    m.executeOrder(new Order(36, 0, 1));
    console.assert(m.getAccumulator() === -Math.pow(2, 39));
    console.assert(m.overflowed);
    console.assert(m.stopReason === SOLIDAC.stopReasons.recoverableOverflow);

    m.executeOrder(new Order(37, 0, 2));
    console.assert(m.getAccumulator() === -Math.pow(2, 39) + Math.pow(2, 38) + Math.pow(2, 37));
    console.assert(!m.overflowed);
    console.assert(m.stopReason === null);

    m.executeOrder(new Order(39, 0, 37));
    console.assert(m.getAccumulator() === 7);

    m.executeOrder(new Order(37, 0, 3));
    console.assert(m.getAccumulator() === 0);
    console.assert(!m.overflowed);
    // Arithmetic right shift does not trigger underflow
    console.assert(!m.underflowed);
    console.assert(m.stopReason === null);
  }

  {
    m.initialSet();
    m.registers.m.number = 0;
    m.registers.l.number = 1;
    
    console.assert(m.getAccumulator() === 1);

    m.executeOrder(new Order(39, 0, -1));

    console.assert(m.getAccumulator() === 2);

    m.executeOrder(new Order(39, 0, -18));

    console.assert(m.getAccumulator() === Math.pow(2, 19));

    m.executeOrder(new Order(37, 0, -19));

    console.assert(m.getAccumulator() === Math.pow(2, 38));
    console.assert(!m.overflowed);
    
    m.executeOrder(new Order(37, 0, -1));
    console.assert(m.getAccumulator() === -Math.pow(2, 39));
    console.assert(m.overflowed);
    console.assert(m.stopReason === SOLIDAC.stopReasons.recoverableOverflow);

    m.executeOrder(new Order(36, 0, -2));
    console.assert(m.getAccumulator() === -Math.pow(2, 39) + Math.pow(2, 38) + Math.pow(2, 37));
    console.assert(!m.overflowed);
    console.assert(m.stopReason === null);

    m.executeOrder(new Order(38, 0, -37));
    console.assert(m.getAccumulator() === 7);

    m.executeOrder(new Order(36, 0, -3));
    console.assert(m.getAccumulator() === 0);
    console.assert(!m.overflowed);
    // Arithmetic right shift does not trigger underflow
    console.assert(!m.underflowed);
    console.assert(m.stopReason === null);
  }
};

let main = () => {
  console.log('Unit test begins');
  testInterpretAsSigned();
  testInterpretAsUnsigned();
  testMachineWord();
  testAccumulatorArithmetics();
  testAccumulatorArithmetics();
  console.log('Unit test ends');
}

main();
