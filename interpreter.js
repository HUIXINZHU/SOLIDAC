class MachineWord {
    constructor(size,hasOverflowDigit = true,hasSignDigit = true) {
      this.number = 0;
      this.size = size;
      this.hasOverflowDigit=hasOverflowDigit;
      this.hasSignDigit=hasSignDigit;
    }
  
    assign(other, size=0) {
      let movableDigits = size?Math.min(size,other.size):other.size;
      let discardedDigits = 32 - movableDigits;

      this.limitSize();

      this.mumber = ((this.number>>>movableDigits)<<movableDigits)|(other.number<<discardedDigits)>>>discardedDigits;

      this.limitSize();

    }

    limitSize(){
      let discardedDigits=32-this.size;
      this.number=(this.number<<discardedDigits)>>>discardedDigits;
    }
  
    toNumber() {
      if(this.hasSignDigit){
        let discardedDigits=32-this.size;
        let i=this.hasOverflowDigit;

        let negative=(this.number<<(discardedDigits+i))>>>(this.size+discardedDigits-1);
        
        if (negative){
          return this.number | (((~0)>>>(this.size-i-1))<<(this.size-i-1));
        }
        else{
          return(this.number<<(discardedDigits+i))>>>(this.hasSignDigit+i);
        }
      }
      else{
        return this.number;
      }
    }
  
    add(other){
      this.limitSize();

      this.number +=other.toNumber();

      this.limitSize();
    }
    
    subtract(other){
      this.limitSize();

      this.mumber-=other.toNumber();

      let negative =this.mumber<0;

      this.limitSize();

      //Negative as a restult of substratcion, not over flow
      if(negative&&this.hasSignDigit){
        let i=1;

        if(this.hasOverflowDigit){
          //Set overflow digit to 0          
          this.number  = this.number&~(1<<(this.size-i));          
          i++
        }

        //Set sign sigit to 1
        //The remainder is already 2's complement
        this.number=this.number|(1<<(this.size-i));
      }
    }
    
    and(other){
      this.limitSize();

      this.number=this.number&other.number;

      this.limitSize();
    }

    swap(other){
      let t=other.number;

      other.assign(this);

      this.assign({number:t,s:other.size});
    }
  }
  
  class Order{
    constructor(f,b,n){
      this.f=f; //Function number
      this.b=b; //B-rigister index
      this.n=n; //Storage location
    }
  }

  class SOLIDAC{
    constructor(){
      this.registers={
        b:Array.from({length:8},()=>new MachineWord(11)), //B-Registers        
        c:new MachineWord(21), //The control register
        d:new MachineWord(21), //The multiplier/quptient register
        i:new MachineWord(21), //The inspection register

        m:new MachineWord(21), //The double-length accumulator,high half
        I:new MachineWord(19,false,false)
      }
      this.store=Array.from({length:512},()=>new MachineWord(20,false));
    }
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