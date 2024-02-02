function interpretAsSigned(n, bits) {
  let isNegative = (n >>> (bits - 1)) & 0b1;

  if (isNegative) return n | (((~0) >>> bits) << bits);
  else return (n << (32 - bits)) >>> (32 - bits);
}

function interpretAsUnsigned(n, bits) {
  return (n << (32 - bits)) >>> (32 - bits);
}

class MachineWord {
  constructor(size, hasOverflowDigit = true, hasSignDigit = true) {
    this.number = 0;
    this.size = size;
    this.hasOverflowDigit = hasOverflowDigit;
    this.hasSignDigit = hasSignDigit;
  }

  add(other) {
    this.limitSize();

    if (Number.isInteger(other)) this.number += other;
    else this.number += other.toNumber();

    this.limitSize();
  }

  and(other) {
    this.limitSize();

    if (Number.isInteger(other)) this.number &= other;
    else this.number &= other.number;

    this.limitSize();
  }

  assign(other, size = 0) {
    let movableDigits = size ? Math.min(size, other.size) : other.size;
    let discardedDigits = 32 - movableDigits;

    this.limitSize();

    this.number = ((this.number >>> movableDigits) << movableDigits) | (other.number << discardedDigits) >>> discardedDigits;

    this.limitSize();
  }
  
  clear() {
    this.number = 0;
  }

  limitSize() {
    let discardedDigits = 32 - this.size;
    this.number = (this.number << discardedDigits) >>> discardedDigits;
  }

  subtract(other) {
    if (Number.isInteger(other)) this.add(-other);
    else this.add(-other.toNumber());
  }

  swap(other) {
    let t = other.number;

    other.assign(this);

    this.assign({number: t, s: other.size});
  }

  toNumber(signed = null) {
    if (signed === null) signed = this.hasSignDigit;

    if (signed) return interpretAsSigned(this.number, this.size - this.hasOverflowDigit);
    else return interpretAsUnsigned(this.number, this.size);
  }
}

class Order {
  constructor(f, b, n) {
    this.f = f; //Function number
    this.b = b; //B-register index
    this.n = n; //Storage location
  }
}

class Tape {
  static codeTable = {
    '1': 0b10000,
    '2': 0b01000,
    '3': 0b11001,
    '4': 0b00100,
    '5': 0b10101,
    '6': 0b01101,
    '7': 0b11100,
    '8': 0b00010,
    '9': 0b10011,
    '0': 0b00001,
    '+': 0b01011,
    '-': 0b11010,
    '.': 0b00011,
    '=': 0b01010,
    'n': 0b11000,
    'v': 0b00110,
    ' ': 0b01110,

    '\n': 0b10110,
    '\r': 0b01111,

    '#': 0b11011 // We represent LS with a hash because its connection to modern-day comments
  };

  constructor(text) {
    this.content = [];

    text = text.replace('\r', '\n');
    text = text.replace(/ +/g, ' ');
    text = text.replace(/\n+/g, '\n');

    for (let line of text.split('\n')) {
      line = line.trim();
      
      if (!line) continue;

      let lineEnding = '\r';

      if (line.startsWith('#')) {
        lineEnding = '\n';
      }

      for (let i in line) {
        let code = this.constructor.codeTable[line[i]];
        
        if (code === undefined) {
          console.log('Unknown character ' + line[i]);
          continue;
        }

        this.content.push(code);
      }
      
      this.content.push(this.constructor.codeTable[lineEnding]);
    }
    
    this.location = 0;
  }
  
  read() {
    if (this.location >= this.content.length) {
      return 0;
    } else {
      return this.content[this.location++];
    }
  }
}

class SOLIDAC {
  static initialOrderStore = [
    this.wordFromOrder(55, 0, 10),    //  0  d = 10
    this.wordFromOrder(40, 0, 100),   //  1  s[100] = m; m = l = 0
    this.wordFromOrder( 5, 4, 2045),  //  2  b[4] = 2045
    this.wordFromOrder( 5, 2, 0),     //  3  b[2] = 0
    this.wordFromOrder( 5, 5, 0),     //  4  b[5] = 0
    this.wordFromOrder( 5, 3, 0),     //  5  b[3] = 0
    this.wordFromOrder( 6, 4, 2),     //  6  b[4] += 2
    this.wordFromOrder(40, 0, 98),    //  7  s[98] = m; m = l = 0
    this.wordFromOrder(31, 0, 97),    //  8  s[97] = l
    this.wordFromOrder(10, 1, 96),    //  9  s[96] = b[1] = input
    this.wordFromOrder(32, 0, 86),    // 10  l = s[86]
    this.wordFromOrder(43, 0, 37),    // 11  m += s[37]
    this.wordFromOrder(38, 1, 0),     // 12  a <<= b[1]
    this.wordFromOrder(22, 0, 54),    // 13  if (a > 0) goto 54
    this.wordFromOrder(56, 0 ,97),    // 14  a = d * s[97]
    this.wordFromOrder( 8, 1, 30),    // 15  b[1] &= s[30]
    this.wordFromOrder( 1, 1, 96),    // 16  s[96] = b[1]
    this.wordFromOrder(33, 0, 96),    // 17  a += s[96]
    this.wordFromOrder( 6, 3, 1),     // 18  b[3] += 1
    this.wordFromOrder(26, 0, 8),     // 19  goto 8
    this.wordFromOrder(14, 1, 57),    // 20  b[1] -= 1; if (b[1] != 0) goto 57
    this.wordFromOrder(13, 5, 40),    // 21  if (b[5] != 0) goto 40
    this.wordFromOrder(13, 3, 40),    // 22  if (b[3] != 0) goto 40
    this.wordFromOrder(13, 1, 9),     // 23  if (b[1] != 0) goto 9
    this.wordFromOrder(20, 0, 96),    // 24  output s[96]
    this.wordFromOrder( 6, 3, 14),    // 25  b[3] += 14
    this.wordFromOrder(13, 3, 28),    // 26  if (b[3] != 0) goto 28
    this.wordFromOrder(13, 1, 9),     // 27  if (b[1] != 0) goto 9
    this.wordFromOrder(10, 3, 96),    // 28  s[96] = b[3] = input
    this.wordFromOrder(13, 3, 31),    // 29  if (b[3] != 0) goto 31
    this.wordFromOrder( 5, 1, 15),    // 30  b[1] = 15
    this.wordFromOrder( 7, 3, 27),    // 31  b[3] -= 27
    this.wordFromOrder(13, 3, 24),    // 32  if (b[3] != 0) goto 24
    this.wordFromOrder( 5, 1, 0),     // 33  b[1] = 0
    this.wordFromOrder(26, 0, 24),    // 34  goto 24
    this.wordFromOrder(14, 1, 48),    // 35  b[1] -= 1; if (b[1] != 0) goto 48
    this.wordFromOrder(13, 3, 38),    // 36  if (b[3] != 0) goto 38
    this.wordFromOrder(26, 3, 9),     // 37  goto b[3] + 9
    this.wordFromOrder(13, 2, 46),    // 38  if (b[2] != 0) goto 46
    this.wordFromOrder(17, 0, 99),    // 39  add s[99] to next order
    this.wordFromOrder( 0, 0, 0),     // 40  execute s[99] or stop
    this.wordFromOrder( 5, 1, 1),     // 41  b[1] = 1
    this.wordFromOrder( 3, 1, 99),    // 42  b[1] += s[99]
    this.wordFromOrder( 1, 1, 99),    // 43  s[99] = b[1]
    this.wordFromOrder( 1, 1, 100),   // 44  s[100] = b[1]
    this.wordFromOrder(16, 0, 2046),  // 45  add 2046 to next order's address part
    this.wordFromOrder(40, 2, 100),   // 46  n = 98 or 100; s[(b[2] + n) % 2048] = m; m = l = 0
    this.wordFromOrder(26, 0, 2),     // 47  goto 2
    this.wordFromOrder(14, 1, 74),    // 48  b[1] -= 1; if (b[1] != 0) goto 74
    this.wordFromOrder(26, 0, 9),     // 49  goto 9
    this.wordFromOrder( 5, 1, 1024),  // 50  b[1] = 1024
    this.wordFromOrder(40, 1, 2047),  // 51  s[b[1] - 1] = m; m = l = 0
    this.wordFromOrder(14, 1, 51),    // 52  b[1] -= 1; if (b[1] != 0) goto 51
    this.wordFromOrder(26, 0, 0),     // 53  goto 0
    this.wordFromOrder( 7, 1, 26),    // 54  b[1] -= 26
    this.wordFromOrder(13, 1, 20),    // 55  if (b[1] != 0) goto 20
    this.wordFromOrder(26, 0, 83),    // 56  goto 83
    this.wordFromOrder(42, 0, 97),    // 57  m = s[97]
    this.wordFromOrder(12, 3, 61),    // 58  if (b[3] > 0) goto 61
    this.wordFromOrder(17, 0, 97),    // 59  add s[97] to next order
    this.wordFromOrder(42, 0, 100),   // 60  m = s[s[97] + 100]
    this.wordFromOrder(13, 4, 64),    // 61  if (b[4] != 0) goto 64
    this.wordFromOrder(40, 0, 97),    // 62  s[97] = m; m = l = 0
    this.wordFromOrder(44, 0, 97),    // 63  m -= s[97]
    this.wordFromOrder(14, 1, 69),    // 64  b[1] -= 1; if (b[1] != 0) goto 69
    this.wordFromOrder(38, 5, 14),    // 65  a <<= (b[5] + 14) % 2048
    this.wordFromOrder( 5, 5, 2045),  // 66  b[5] = 2045
    this.wordFromOrder(43, 0, 98),    // 67  m += s[98]
    this.wordFromOrder(26, 0, 5),     // 68  goto 5
    this.wordFromOrder(43, 0, 98),    // 69  m += s[98]
    this.wordFromOrder(14, 1, 35),    // 70  b[1] -= 1; if (b[1] != 0) goto 35
    this.wordFromOrder( 5, 4, 2046),  // 71  b[4] = 2046
    this.wordFromOrder( 5, 3, 1024),  // 72  b[3] = 1024
    this.wordFromOrder(26, 0, 6),     // 73  goto 6
    this.wordFromOrder( 6, 1, 21),    // 74  b[1] += 21
    this.wordFromOrder(13, 1, 81),    // 75  if (b[1] != 0) goto 81
    this.wordFromOrder(13, 2, 90),    // 76  if (b[2] != 0) goto 90
    this.wordFromOrder(40, 0, 99),    // 77  s[99] = m; m = l = 0
    this.wordFromOrder( 2, 1, 99),    // 78  b[1] = s[99]
    this.wordFromOrder( 1, 1, 100),   // 79  s[100] = b[1]
    this.wordFromOrder(26, 0, 4),     // 80  goto 4
    this.wordFromOrder(14, 1, 85),    // 81  b[1] -= 1; if (b[1] != 0) goto 85
    this.wordFromOrder( 5, 4, 2046),  // 82  b[4] = 2046
    this.wordFromOrder(13, 3, 40),    // 83  if (b[3] != 0) goto 40
    this.wordFromOrder(26, 0, 6),     // 84  goto 6
    this.wordFromOrder(14, 1, 94),    // 85  b[1] -= 1; if (b[1] != 0) goto 94
    this.wordFromOrder(12, 4, 72),    // 86  if (b[4] > 0) goto 72
    this.wordFromOrder(13, 3, 72),    // 87  if (b[3] != 0) goto 72
    this.wordFromOrder( 5, 2, 2046),  // 88  b[2] = 2046
    this.wordFromOrder(26, 0, 4),     // 89  goto 4
    this.wordFromOrder(21, 0, 94),    // 90  if (a < 0) goto 94
    this.wordFromOrder(40, 0, 98),    // 91  s[98] = m; m = l = 0
    this.wordFromOrder( 2, 2, 98),    // 92  b[2] = s[98]
    this.wordFromOrder(13, 2, 4),     // 93  if (b[2] != 0) goto 4
    this.wordFromOrder(15, 1, 21),    // 94  b[1] -= 2; if (b[1] != 0) goto 21
    this.wordFromOrder(26, 0, 36)     // 95  goto 36
  ];

  static stopReasons = {
    absolute: Symbol('absolute stop'),
    normal: Symbol('normal stop'),
    overshiftAfterNormalising: Symbol('overshift after normalising'),
    recoverableOverflow: Symbol('overflow in the D- or M- registers'),
    irrecoverableOverflow: Symbol('overflow in the S-register or in the M-register with an arithmetical left shift')
  };
  
  static wordFromOrder(...args) {
    let f, b, n;

    if (args.length == 1) {
      ({f, b, n} = args[0]);
    } else if (args.length == 3) {
      [f, b, n] = args.slice(0, 4);
    } else {
      throw new Error('wordFromOrder: invalid arguments');
    }
    
    let word = new MachineWord(20, false);
    word.number = ((f & 0b111111) << 14) | ((b & 0b111) << 11) | (n & 0b11111111111);
    return word;
  }

  constructor() {
    this.counter = new MachineWord(11, false, false);
    this.currentModifier = null;

    this.registers = {
      b: Array.from({length: 8}, () => new MachineWord(11, false)), //B-Registers   
  
      m: new MachineWord(21, false), //High half of double-length accumulator
      l: new MachineWord(19, false, false), //Low half of double-length accumulator
      d: new MachineWord(21), //The multiplier/quotient register      
      s: new MachineWord(20, false), //The store-transfer register
      c: new MachineWord(21), //The control register
      v: new MachineWord(21), //The inspection register
    }

    this.currentReadingStore = this.constructor.initialOrderStore;
    this.mainStore = Array.from({length: 512}, () => new MachineWord(20, false));
    
    this.stopReason = null;
    this.overflowed = false;
    this.underflowed = false;

    this.optionalStopEnabled = false;
    this.slowMode = false;
    this.singleShot = false;
    this.tape = [];

    this.outputHook = function () {};
    this.postOrderHook = function () {};
    this.stoppedHook = function () {};
  }

  initialSet() {
    this.counter.clear();
    this.registers.m.clear();
    this.registers.l.clear();
    this.registers.d.clear();
    this.registers.s.clear();
    this.registers.c.clear();
    this.registers.v.clear();
    this.stopReason = null;
    this.overflowed = false;
    this.underflowed = false;
    this.currentReadingStore = this.constructor.initialOrderStore;
  }
  
  setTape(tape) {
    this.tape = tape;
  }

  executeOrder(order) {
    let {f, b, n} = order;
    
    const lastStopReason = this.stopReason;
    const lastOverflowed = this.overflowed;
    const lastUnderflowed = this.underflowed;

    this.stopReason = null;
    this.overflowed = false;
    this.underflowed = false;
    
    const restoreStatusIndicators = () => {
      if (lastStopReason !== null && this.stopReason == this.constructor.stopReasons.normal) {
        this.stopReason = lastStopReason;
      }
      this.overflowed = lastOverflowed;
      this.underflowed = lastUnderflowed;
    };

    switch (f) {
      case 1:
        this.writeStore(n, this.registers.b[b]);
        break;
      case 2:
        this.registers.b[b].assign(this.readStore(n));
        break;
      case 3:
        this.registers.b[b].add(this.readStore(n));
        break;
      case 4:
        this.registers.b[b].subtract(this.readStore(n));
        break;
      case 5:
        this.registers.b[b].assign({number: n, size: 11});
        break;
      case 6:
        this.registers.b[b].add(n);
        break;
      case 7:
        this.registers.b[b].subtract(n);
        break;
      case 8:
        this.registers.b[b].and({number: n, size: 11});
        break;
      case 9:
        this.writeStore(n, this.registers.b[b], 'swap');
        break;
      case 10:
        const tapeInput = this.tape.read();
        this.registers.b[b].assign({number: tapeInput, size: 11});
        this.writeStore(n, {number: tapeInput, size: 20});
        break;
      case 12:
        if (this.registers.b[b].toNumber() > 0) this.counter.assign({number: n, size: 11});
        break;
      case 13:
        if (this.registers.b[b].toNumber() != 0) this.counter.assign({number: n, size: 11});
        break;
      case 14:
        this.registers.b[b].subtract(1);
        if (this.registers.b[b].toNumber() != 0) this.counter.assign({number: n, size: 11});
        break;
      case 15:
        this.registers.b[b].subtract(2);
        if (this.registers.b[b].toNumber() != 0) this.counter.assign({number: n, size: 11});
        break;
      case 16:
        n = this.applyModifier(b, n);
        this.currentModifier = new MachineWord(11, false, false);
        this.currentModifier.number = n & 0b11111111111;
        restoreStatusIndicators();
        break;
      case 17:
        n = this.applyModifier(b, n);
        this.currentModifier = this.readStore(n);
        restoreStatusIndicators();
        break;
      case 20:
        n = this.applyModifier(b, n);
        this.outputHook(this.readStore(n).toNumber());
        break;
      case 21:
        n = this.applyModifier(b, n);
        if (this.getAccumulator() < 0) this.counter.assign({number: n, size: 11});
        break;
      case 22:
        n = this.applyModifier(b, n);
        if (this.getAccumulator() > 0) this.counter.assign({number: n, size: 11});
        break;
      case 23:
        n = this.applyModifier(b, n);
        if (this.getAccumulator() != 0) this.counter.assign({number: n, size: 11});
        break;
      case 24:
        n = this.applyModifier(b, n);
        if (lastUnderflowed) this.counter.assign({number: n, size: 11});
        break;
      case 25:
        n = this.applyModifier(b, n);
        if (lastOverflowed) this.counter.assign({number: n, size: 11});
        break;
      case 26:
        n = this.applyModifier(b, n);
        this.counter.assign({number: n, size: 11});
        break;
      case 27:
        n = this.applyModifier(b, n);
        this.counter.assign({number: n, size: 11});
        if (Object.is(this.currentReadingStore, this.mainStore)) this.currentReadingStore = this.constructor.initialOrderStore;
        else this.currentReadingStore = this.mainStore;
        break;
      case 28:
        // TODO Figure how wire input/output works
        break;
      case 29:
        // TODO Figure how wire output works
        break;
      case 31:
        n = this.applyModifier(b, n);
        this.writeStore(n, {number: this.registers.l.number, size: 20});
        break;
      case 32:
        n = this.applyModifier(b, n);
        var s = this.readStore(n);
        var signBit = s.toNumber() < 0;
        this.registers.l.assign(s);
        this.registers.m.assign({number: signBit ? ~0 : 0, size: 20});
        break;
      case 33:
        n = this.applyModifier(b, n);
        var s = this.readStore(n);
        var signBit = s.toNumber() < 0;
        var lowSum = this.registers.l.number + (s.number & 0b1111111111111111111);
        var carry = lowSum >>> 19;
        var previousHighNumber = this.registers.m.toNumber();
        var highSum = this.registers.m.number + signBit + carry;
        this.registers.l.number = lowSum & 0b1111111111111111111;
        this.registers.m.number = highSum & 0b111111111111111111111;
        this.overflowed = previousHighNumber >= 0 && this.registers.m.toNumber() < 0;
        break;
      case 34:
        n = this.applyModifier(b, n);
        var s = this.readStore(n);
        var signBit = s.toNumber() < 0;
        var lowDiff = this.registers.l.number - (s.number & 0b1111111111111111111);
        var carry = lowDiff < 0;
        var previousHighNumber = this.registers.m.toNumber();
        var highDiff = this.registers.m.number - signBit - carry;
        this.registers.l.number = lowDiff & 0b1111111111111111111;
        this.registers.m.number = highDiff & 0b111111111111111111111;
        this.underflowed = previousHighNumber < 0 && this.registers.m.toNumber() >= 0;
      case 35:
        // TODO Normalisation
        break;
      case 36:
        n = this.applyModifier(b, n);
        n = interpretAsSigned(n, 11);
        if (n >= 0) this.arithmeticLeftShiftAccumulator(n);
        else this.arithmeticRightShiftAccumulator(-n);
        break;
      case 37:
        n = this.applyModifier(b, n);
        n = interpretAsSigned(n, 11);
        if (n >= 0) this.arithmeticRightShiftAccumulator(n);
        else this.arithmeticLeftShiftAccumulator(-n);
        break;
      case 38:
        n = this.applyModifier(b, n);
        n = interpretAsSigned(n, 11);
        if (n >= 0) this.logicLeftShiftAccumulator(n);
        else this.logicRightShiftAccumulator(-n);
        break;
      case 39:
        n = this.applyModifier(b, n);
        n = interpretAsSigned(n, 11);
        if (n >= 0) this.logicRightShiftAccumulator(n);
        else this.logicLeftShiftAccumulator(-n);
        break;
      default:
        this.stopReason = this.constructor.stopReasons.absolute;
        break;
      case 0:
        if (b == 0 && n == 0) this.stopReason = this.constructor.stopReasons.absolute;
        else if (b == 0) this.stopReason = this.constructor.stopReasons.normal; 
        else if (this.optionalStopEnabled) this.stopReason = this.constructor.stopReasons.normal;
        restoreStatusIndicators();
        break;
    }

    this.postOrderHook(this);
  }

  arithmeticLeftShiftAccumulator(n) {
    if (n >= 40) {
      if (this.registers.m.number != 0 || this.registers.l.number != 0) {
        this.overflowed = true;
        this.stopReason = this.constructor.stopReasons.recoverableOverflow;
      }

      this.registers.m.number = 0;
      this.registers.l.number = 0;
      return;
    }

    let remainingDigits = Math.max(21 - n, 0);
    let overshiftPartM = this.registers.m.number >>> remainingDigits;
    
    if (n >= 21) this.registers.m.number = 0;
    else this.registers.m.number = (this.registers.m.number << n) & 0b111111111111111111111;
    
    if ((overshiftPartM != 0 || this.registers.m.toNumber() < 0) &&
        (overshiftPartM != (((~0) & 0b111111111111111111111) >>> remainingDigits) || this.registers.m.toNumber() >= 0)) {
      this.overflowed = true;
      this.stopReason = this.constructor.stopReasons.recoverableOverflow;
    }
    
    let overshiftPartL = 0;

    if (n >= 19) {
      remainingDigits = Math.max(n - 21, 0);
      overshiftPartM = this.registers.l.number >>> (40 - n);
      overshiftPartL = (this.registers.l.number << (n - 19)) & 0b111111111111111111111;
      this.registers.l.number = 0;
    } else {
      remainingDigits = 0;
      overshiftPartM = 0;
      overshiftPartL = this.registers.l.number >>> (19 - n);
      this.registers.l.number = (this.registers.l.number << n) & 0b1111111111111111111;
    }

    this.registers.m.number |= overshiftPartL;

    if ((overshiftPartM != 0 || this.registers.m.toNumber() < 0) &&
        (overshiftPartM != (((~0) & 0b111111111111111111111) >>> remainingDigits) || this.registers.m.toNumber() >= 0)) {
      this.overflowed = true;
      this.stopReason = this.constructor.stopReasons.recoverableOverflow;
    }
  }
  
  arithmeticRightShiftAccumulator(n) {
    let originalSign = this.registers.m.toNumber() < 0;
    let fillPattern = originalSign ? ~0 : 0;

    if (n >= 40) {
      this.registers.m.number = fillPattern & 0b111111111111111111111;
      this.registers.l.number = fillPattern & 0b1111111111111111111;
      return;
    }

    if (n >= 19) {
      this.registers.l.number = interpretAsSigned(this.registers.m.number, 21) >> (n - 19);
    } else {
      this.registers.l.number = (this.registers.l.number >>> n) | this.registers.m.number << (19 - n);
    }
    
    this.registers.l.number &= 0b1111111111111111111;

    if (n >= 21) this.registers.m.number = fillPattern;
    else this.registers.m.number = interpretAsSigned(this.registers.m.number, 21) >> n;
    
    this.registers.m.number &= 0b111111111111111111111;
  }

  logicLeftShiftAccumulator(n) {
    if (n >= 40) {
      this.registers.m.number = 0;
      this.registers.l.number = 0;
      return;
    }

    if (n >= 21) this.registers.m.number = 0;
    else this.registers.m.number = (this.registers.m.number << n) & 0b111111111111111111111;

    let overshiftPartL = 0;

    if (n >= 19) {
      overshiftPartL = this.registers.l.number << (n - 19);
      this.registers.l.number = 0;
    } else {
      overshiftPartL = this.registers.l.number >>> (19 - n);
      this.registers.l.number = (this.registers.l.number << n) & 0b1111111111111111111;
    }

    this.registers.m.number |= overshiftPartL & 0b111111111111111111111;
  }

  logicRightShiftAccumulator(n) {
    if (n >= 40) {
      this.registers.m.number = 0;
      this.registers.l.number = 0;
      return;
    }

    if (n >= 19) {
      this.registers.l.number = this.registers.m.number >>> (n - 19);
    } else {
      this.registers.l.number = (this.registers.l.number >>> n) | this.registers.m.number << (19 - n);
    }
    
    this.registers.l.number &= 0b1111111111111111111;

    if (n >= 21) this.registers.m.number = 0;
    else this.registers.m.number = this.registers.m.number >>> n;
  }

  getAccumulator() {
    return this.registers.m.toNumber() * Math.pow(2, 19) + this.registers.l.toNumber();
  }
  
  applyModifier(b, n) {
    if (b != 0) return (this.registers.b[b].number + order.n) & 0b11111111111;
    return n;
  }

  executeNextOrder() {
    let orderLocation = this.counter.toNumber();

    if (orderLocation >= this.currentReadingStore.length) {
      this.stopReason = this.constructor.stopReasons.absolute;
      console.log("Invalid store location in control counter");
      return;
    }
    
    let s = this.readStore(orderLocation);

    let f = (s.number >>> 14) & 0b111111;
    let b = (s.number >>> 11) & 0b111;
    let n = s.number & 0b11111111111;

    this.executeOrder(new Order(f, b, n));
  }

  readStore(n){
    let v = this.currentReadingStore[n];
    this.registers.s.assign(v);
    return v;
  }

  writeStore(n, v, op = 'assign'){
    this.registers.s.assign(v);
    this.mainStore[n][op](v);
  }

  setsHooks(postOrder, output, stopped) {
    this.postOrderHook = postOrder;
    this.outputHook = output;
    this.stoppedHook = stop;
  }
}
