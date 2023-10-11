class MachineWord {
    constructor(size) {
      this.digits = Array.from({length: 100}, () => 0).join();
      this.size = size;
    }
  
    assign(other, size) {
      let movableDigits = Math.min(size, other.size);
  
      if (movableDigits >= this.digits) {
        this.digits = other.digits.slice(other.size - Math.min(this.size, movableDigits));
      } else {
        this.digits = this.digits.slice(0, this.size - movableDigits) + other.digits.slice(other.size - movableDigits);
      }
    }
  
    toNumber() {
      return parseInt(this.digits, 10);
    }
  
    // Addition, subtraction, multiple methods...
  }
  
  // Define the machine state as an object
  let machineState = {
    a: MachineWord(21),
    b: [MachineWord(11), MachineWord(11), MachineWord(11), MachineWord(11), MachineWord(11), MachineWord(11), MachineWord(11)],
    c: MachineWord(21),
    d: MachineWord(21),
    l: MachineWord(21),
    m: MachineWord(21),
    s: Array.from({length: 100}, () => MachineWord(21))
  };
  
  // Define the shape of an instruction
  class Instruction {
    constructor(f, b, n) {
      this.f = f; // Opcode
      this.b = b; // Register b
      this.n = n; // Constant value n
    }
  }
  
  // Function to interpret instructions
  function interpretInstruction(instruction) {
    const { f, b, n } = instruction;
  
    switch (f) {
      case 1:
        // Store register b to memory[s]
        machineState.s[n].assign(machineState.b[b]);
        break;
      case 2:
        // Load from memory[s] to register b
        machineState.b[b].assign(machineState.s[n]);
        break;
      // More orders waiting for implementation
      default:
        console.error("Invalid order: ", f);
    }
  }
  
  // Example instruction
  const instruction = new Instruction(1, 3, 10);
  
  // Interpret the instruction
  interpretInstruction(instruction);