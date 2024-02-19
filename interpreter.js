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
  
  hasOverflowed() {
    if (this.hasOverflowDigit) return !!(this.number >>> (this.size - 1));
    else return false;
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

  xor(other) {
    this.limitSize();

    if (Number.isInteger(other)) this.number ^= other;
    else this.number ^= other.number;

    this.limitSize();
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
    '1': 0b00001,    // 1
    '2': 0b00010,    // 2
    '3': 0b10011,    // 25
    '4': 0b00100,    // 4
    '5': 0b10101,    // 21
    '6': 0b10110,    // 22
    '7': 0b00111,    // 7
    '8': 0b01000,    // 8
    '9': 0b11001,    // 25
    '0': 0b10000,    // 15
    '+': 0b11010,    // 26
    '-': 0b01011,    // 11
    '.': 0b11100,    // 28
    '=': 0b01010,    // 10
    'n': 0b00011,    // 3
    'v': 0b01100,    // 12
    ' ': 0b01110,    // 13

    '\n': 0b01101,   // 13
    '\r': 0b11110,   // 30

    // We represent LS with a hash because its connection to modern-day comments
    '#': 0b11011     // 27
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
      let character = this.content[this.location];
      console.log(`Reading ${character} from tape`);
      this.location++;
      return character;
    }
  }
}

class SOLIDAC {
  static initialOrderStore = [
    this.wordFromOrder(55, 0, 10),    // 0
    this.wordFromOrder( 5, 2, 0),
    this.wordFromOrder( 5, 3, 15),
    this.wordFromOrder( 5, 4, 0),
    this.wordFromOrder(40, 0, 98),
    this.wordFromOrder(31, 0, 97),
    this.wordFromOrder(10, 1, 96),
    this.wordFromOrder(32, 0, 35),
    this.wordFromOrder(43, 0, 64),
    this.wordFromOrder(38, 1, 0),
    this.wordFromOrder(22, 0, 31),    // 10
    this.wordFromOrder(56, 0 ,97),
    this.wordFromOrder( 8, 1, 2),
    this.wordFromOrder( 1, 1, 96),
    this.wordFromOrder(33, 0, 96),
    this.wordFromOrder( 6, 4, 1),
    this.wordFromOrder(26, 0, 5),
    this.wordFromOrder(12, 1, 6),
    this.wordFromOrder( 6, 1, 20),
    this.wordFromOrder(13, 1, 22),
    this.wordFromOrder(41, 0, 99),    // 20
    this.wordFromOrder(26, 0, 47),
    this.wordFromOrder(14, 1, 26),
    this.wordFromOrder( 5, 3, 0),
    this.wordFromOrder(13, 4, 42),
    this.wordFromOrder(26, 0, 4),
    this.wordFromOrder(14, 1, 28),
    this.wordFromOrder(26, 0, 91),
    this.wordFromOrder(15, 1, 32),
    this.wordFromOrder(13, 4, 40),
    this.wordFromOrder(26, 0, 6),     // 30
    this.wordFromOrder(13, 1, 54),
    this.wordFromOrder(13, 2, 42),
    this.wordFromOrder( 6, 1, 8),
    this.wordFromOrder(13, 1, 29),
    this.wordFromOrder(12, 4, 37),
    this.wordFromOrder( 0, 0, 0),
    this.wordFromOrder( 2, 1, 97),
    this.wordFromOrder(12, 1, 46),
    this.wordFromOrder( 0, 0, 0),
    this.wordFromOrder(13, 1, 42),    // 40
    this.wordFromOrder(17, 0, 99),
    this.wordFromOrder( 0, 0, 0),
    this.wordFromOrder(42, 0, 11),
    this.wordFromOrder(39, 0, 19),
    this.wordFromOrder(45, 0, 99),
    this.wordFromOrder(42, 0, 99),
    this.wordFromOrder(48, 0, 95),
    this.wordFromOrder(40, 1, 100),
    this.wordFromOrder(26, 0, 1),
    this.wordFromOrder( 5, 1, 1024),  // 50
    this.wordFromOrder(40, 1, 2047),
    this.wordFromOrder(14, 1, 51),
    this.wordFromOrder(26, 0, 0),
    this.wordFromOrder(42, 0, 97),
    this.wordFromOrder(12, 4, 58),
    this.wordFromOrder(17, 0, 97),
    this.wordFromOrder(42, 0, 100),
    this.wordFromOrder(13, 3, 61),
    this.wordFromOrder(40, 0, 97),
    this.wordFromOrder(44, 0, 97),    // 60
    this.wordFromOrder( 7, 1, 26),
    this.wordFromOrder(13, 1, 65),
    this.wordFromOrder( 5, 3, 15),
    this.wordFromOrder(26, 3, 9),
    this.wordFromOrder(14, 1, 81),
    this.wordFromOrder(13, 4, 42),
    this.wordFromOrder(13, 2, 42),
    this.wordFromOrder(20, 0, 96),
    this.wordFromOrder( 6, 1, 18),
    this.wordFromOrder(13, 1, 72),    // 70
    this.wordFromOrder(12, 4, 6),
    this.wordFromOrder(10, 1, 96),
    this.wordFromOrder(13, 1, 75),
    this.wordFromOrder( 5, 4, 0),
    this.wordFromOrder( 7, 1, 27),
    this.wordFromOrder(13, 1, 78),
    this.wordFromOrder( 5, 4, 1024),
    this.wordFromOrder( 7, 1, 4),
    this.wordFromOrder(12, 1, 72),
    this.wordFromOrder(26, 0, 68),    // 80
    this.wordFromOrder(14, 1, 88),
    this.wordFromOrder(12, 4, 84),
    this.wordFromOrder( 0, 0, 0),
    this.wordFromOrder(38, 2, 14),
    this.wordFromOrder( 5, 2, 2045),
    this.wordFromOrder(43, 0, 98),
    this.wordFromOrder(26, 0, 2),
    this.wordFromOrder(43, 0, 98),
    this.wordFromOrder(14, 1, 93),
    this.wordFromOrder( 5, 3, 0),     // 90
    this.wordFromOrder( 5, 4, 1024),
    this.wordFromOrder(26, 0, 4),
    this.wordFromOrder(14, 1, 17),
    this.wordFromOrder(26, 0, 29),
    this.wordFromOrder( 0, 0, 2047)
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
  
      m: new MachineWord(21), //High half of double-length accumulator
      l: new MachineWord(19, false, false), //Low half of double-length accumulator
      d: new MachineWord(21), //The multiplier/quotient register      
      s: new MachineWord(21), //The store-transfer register
      c: new MachineWord(21), //The control register
      v: new MachineWord(21), //The inspection register
    }

    this.currentReadingStore = this.constructor.initialOrderStore;
    this.mainStore = Array.from({length: 512}, () => new MachineWord(20, false));

    this.jumpInstruction = false;
    this.stopReason = null;
    this.overflowed = false;
    this.underflowed = false;

    this.optionalStopEnabled = false;
    this.slowMode = false;
    this.tape = null;

    this.outputHook = function () {};
    this.postOrderHook = function () {};
    this.stoppedHook = function () {};
    
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.audioNodes = {};
  }

  initialSet() {
    this.counter.clear();
    this.currentModifier = null;
    this.registers.m.clear();
    this.registers.l.clear();
    this.registers.d.clear();
    this.registers.s.clear();
    this.registers.c.clear();
    this.registers.v.clear();
    this.jumpInstruction = false;
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
        this.registers.b[b].and(this.readStore(n));
        break;
      case 9:
        this.writeStore(n, this.registers.b[b], 'swap');
        break;
      case 10:
        if (this.tape == null) {
          this.stopReason = this.constructor.stopReasons.absolute;
          alert('Trying to read tape but no tape is given.');
        } else {
          const tapeInput = this.tape.read();
          this.registers.b[b].assign({number: tapeInput, size: 11});
          this.writeStore(n, {number: tapeInput, size: 20});
        }
        break;
      case 12:
        if (this.registers.b[b].toNumber() > 0) {
          this.counter.assign({number: n, size: 11});
          this.jumpInstruction = true;
        }
        break;
      case 13:
        if (this.registers.b[b].toNumber() != 0) {
          this.counter.assign({number: n, size: 11});
          this.jumpInstruction = true;
        }
        break;
      case 14:
        this.registers.b[b].subtract(1);
        if (this.registers.b[b].toNumber() != 0) {
          this.counter.assign({number: n, size: 11});
          this.jumpInstruction = true;
        }
        break;
      case 15:
        this.registers.b[b].subtract(2);
        if (this.registers.b[b].toNumber() != 0) {
          this.counter.assign({number: n, size: 11});
          this.jumpInstruction = true;
        }
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
        if (this.getAccumulator() < 0) {
          this.counter.assign({number: n, size: 11});
          this.jumpInstruction = true;
        }
        break;
      case 22:
        n = this.applyModifier(b, n);
        if (this.getAccumulator() > 0) {
          this.counter.assign({number: n, size: 11});
          this.jumpInstruction = true;
        }
        break;
      case 23:
        n = this.applyModifier(b, n);
        if (this.getAccumulator() != 0) {
          this.counter.assign({number: n, size: 11});
          this.jumpInstruction = true;
        }
        break;
      case 24:
        n = this.applyModifier(b, n);
        if (lastUnderflowed) {
          this.counter.assign({number: n, size: 11});
          this.jumpInstruction = true;
        }
        break;
      case 25:
        n = this.applyModifier(b, n);
        if (lastOverflowed) {
          this.counter.assign({number: n, size: 11});
          this.jumpInstruction = true;
        }
        break;
      case 26:
        n = this.applyModifier(b, n);
        this.counter.assign({number: n, size: 11});
        this.jumpInstruction = true;
        break;
      case 27:
        n = this.applyModifier(b, n);
        this.counter.assign({number: n, size: 11});
        this.jumpInstruction = true;
        if (Object.is(this.currentReadingStore, this.mainStore)) this.currentReadingStore = this.constructor.initialOrderStore;
        else this.currentReadingStore = this.mainStore;
        break;
      case 28:
        // We use wire output for audio
        if (n % 2 === 0) {
          let oscillator;

          if (n in this.audioNodes) {
            oscillator = this.audioNodes[n];
          } else {
            oscillator = this.audioContext.createOscillator();
            oscillator.type = "triangle";
            this.audioNodes[n] = oscillator;
            oscillator.start();
          }

          oscillator.frequency.setValueAtTime(this.registers.b[b].toNumber(), this.audioContext.currentTime);
          oscillator.connect(this.audioContext.destination);
        }
        break;
      case 29:
        if (n % 2 === 0 && n in this.audioNodes) {
          let oscillator = this.audioNodes[n];
          oscillator.disconnect(this.audioContext.destination);
        }
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
      case 40:
        n = this.applyModifier(b, n);
        this.writeStore(n, this.registers.m);
        this.registers.m.clear();
        this.registers.l.clear();
        break;
      case 41:
        n = this.applyModifier(b, n);
        this.writeStore(n, this.registers.m);
        break;
      case 42:
        n = this.applyModifier(b, n);
        this.registers.m.clear();
        this.registers.m.assign(this.readStore(n));
        break;
      case 43:
        n = this.applyModifier(b, n);
        this.registers.m.add(this.readStore(n));
        break;
      case 44:
        n = this.applyModifier(b, n);
        this.registers.m.subtract(this.readStore(n));
        break;
      case 45:
        n = this.applyModifier(b, n);
        this.readStore(n);
        this.registers.s.add(this.registers.m);
        if (this.registers.s.hasOverflowed()) this.stopReason = this.constructor.stopReasons.irrecoverableOverflow;
        this.writeStore(n, this.registers.s);
        break;
      case 46:
        n = this.applyModifier(b, n);
        this.readStore(n);
        this.registers.s.subtract(this.registers.m);
        if (this.registers.s.hasOverflowed()) this.stopReason = this.constructor.stopReasons.irrecoverableOverflow;
        this.writeStore(n, this.registers.s);
        break;
      case 47:
        n = this.applyModifier(b, n);
        this.registers.m.xor(this.readStore(n));
        break;
      case 48:
        n = this.applyModifier(b, n);
        this.registers.m.and(this.readStore(n));
        break;
      case 49:
        n = this.applyModifier(b, n);
        this.writeStore(n, this.registers.m, 'swap');
        if (this.registers.s.hasOverflowed()) this.stopReason = this.constructor.stopReasons.irrecoverableOverflow;
        break;
      case 51:
        n = this.applyModifier(b, n);
        this.writeStore(n, this.registers.d);
        if (this.registers.s.hasOverflowed()) this.stopReason = this.constructor.stopReasons.irrecoverableOverflow;
        break;
      case 52:
        n = this.applyModifier(b, n);
        this.registers.d.clear();
        this.registers.d.assign(this.readStore(n));
        break;
      case 53:
        n = this.applyModifier(b, n);
        this.registers.d.add(this.readStore(n));
        break;
      case 54:
        n = this.applyModifier(b, n);
        this.registers.d.subtract(this.readStore(n));
        break;
      case 55:
        n = this.applyModifier(b, n);
        this.registers.d.clear();
        this.registers.d.assign({number: n, size: 11});
        break;
      case 56:
        n = this.applyModifier(b, n);
        var s = this.readStore(n);
        var prod = s.toNumber() * this.registers.d.toNumber();
        this.registers.m.number = Math.trunc(prod / Math.pow(2, 19)) & 0b111111111111111111111;
        this.registers.l.number = prod & 0b1111111111111111111;
        break;
      case 58:
        // TODO Division
        break;
      case 59:
        this.registers.m.swap(this.registers.d);
        break;
      case 60:
        this.registers.v.clear();
        this.registers.v.assign(this.readStore(n));
        break;
      case 61:
        // TODO Binding of hand switches
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
    if (b != 0) return (this.registers.b[b].number + n) & 0b11111111111;
    return n;
  }

  executeNextOrder() {
    this.jumpInstruction = false;

    let orderLocation = this.counter.toNumber();

    if (orderLocation >= this.currentReadingStore.length) {
      this.stopReason = this.constructor.stopReasons.absolute;
      console.log("Invalid store location in control counter");
      return;
    }
    
    this.registers.c.assign(this.readStore(orderLocation));

    if (this.currentModifier != null) {
      this.registers.c.number = ((this.registers.c.number >>> this.currentModifier.size) << this.currentModifier.size) |
        interpretAsUnsigned(this.registers.c.number + this.currentModifier.number, this.currentModifier.size);

      this.currentModifier = null;
    }

    let f = (this.registers.c.number >>> 14) & 0b111111;
    let b = (this.registers.c.number >>> 11) & 0b111;
    let n = this.registers.c.number & 0b11111111111;

    this.executeOrder(new Order(f, b, n));
  }

  readStore(n) {
    let v;
    
    if (Object.is(this.currentReadingStore, this.constructor.initialOrderStore) && this.currentReadingStore.length <= n) {
      v = this.mainStore[n];
    } else {
      v = this.currentReadingStore[n];
    }

    this.registers.s.clear();
    this.registers.s.assign(v);
    return v;
  }

  writeStore(n, v, op = 'assign') {
    if (!Object.is(v, this.registers.s)) {
      this.registers.s.clear();
    }
    this.registers.s[op](v);
    this.mainStore[n].assign(this.registers.s);
  }

  setsHooks(postOrder, output, stopped) {
    this.postOrderHook = postOrder;
    this.outputHook = output;
    this.stoppedHook = stop;
  }
}
