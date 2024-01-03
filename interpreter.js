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

    this.number = ((this.number>>>movableDigits)<<movableDigits)|(other.number<<discardedDigits)>>>discardedDigits;

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
  // @jsinger - check this calculation - it might be wrong    
  //fixed
        return(this.number<<(discardedDigits+i))>>>(discardedDigits+i);
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

    this.number-=other.toNumber();

    let negative =this.number<0;

    this.limitSize();

    //Negative as a restult of subtratcion, not over flow
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
  
      m:new MachineWord(21), //The double-length accumulator,high half
      l:new MachineWord(19, false, false), //The double-length accumulator,low half
      d:new MachineWord(21), //The multiplier/quptient register      
      s:new MachineWord(20, false), //The store-transfer register
      c:new MachineWord(21), //The control register
      v:new MachineWord(21), //The inspection register
    }
    this.overflown=false;
    this.underflown=false;
    this.store=Array.from({length:512},()=>new MachineWord(20,false));
    this.postOrderHook = function(){};
  }

  executeOrder(order){
    const{f,b,n}=order;

    switch(f){
      case 0:
        // TODO: stop execution
        break;
      case 1:
        this.writeStore(n, this.registers.b[b]);
        break;
      case 2:
        this.registers.b[b].assign(this.readStore(n));
        break;
      case 3:
        this.registers.b[b].subtract(this.readStore(n));
        break;
      case 4:
        this.registers.b[b].subtract(this.readStore(n));
        break;
      case 5:
        this.registers.b[b].assign({number:n,size:11});
        break;
      case 6:
        this.registers.b[b].add({toNumber:()=>n});
        break;
      case 7:
        this.registers.b[b].subtract({toNumber:()=>n});
        break;
      case 8:
        this.registers.b[b].and({number:n,size:11});
        break;
      case 9:
        this.writeStore(n, this.registers.b[b], 'swap');
        break;
      case 10:
        // TODO: when the input interface is completed
        break;
      case 12:
        if(this.registers.b[b].toNumber() > 0){
          this.registers.c.assign({number:n,size:11});
        }
        break;
      case 13:
        if(this.registers.b[b].toNumber() != 0){
          this.registers.c.assign({number:n,size:11});
        }
        break;
      case 14:
        this.registers.b[b].subtract({toNumber:()=>1});
        if(this.registers.b[b].toNumber() != 0){
          this.registers.c.assign({number:n,size:11});
        }
        break;
      case 15:
        this.registers.b[b].subtract({toNumber:()=>2});
        if(this.registers.b[b].toNumber() != 0){
          this.registers.c.assign({number:n,size:11});
        }
        break;
      case 16:
        // TODO: when order code parsing is done
        break;
      case 17:
        // TODO: ditto
        break;
      case 20:
        // TODO: when the output interface is completed
        break;
      case 21:
        if(this.getAccumulator().toNumber() < 0){
          this.registers.c.assign({number:n,size:11});
        }
        break;
      case 22:
        if(this.getAccumulator().toNumber() > 0){
          this.registers.c.assign({number:n,size:11});
        }
        break;
      case 23:
        if(this.getAccumulator().toNumber() != 0){
          this.registers.c.assign({number:n,size:11});
        }
        break;
      case 24:
        if(this.underflown){
          this.registers.c.assign({number:n,size:11});
        }
        break;
      case 25:
        if(this.overflown){
          this.registers.c.assign({number:n,size:11});
        }
        break;
      case 26:
        this.registers.c.assign({number:n,size:11});
        break;
      case 27:
        // TODO
        break;
      case 28:
        // TODO
        break;
      case 29:
        // TODO
        break;
      case 31:
        this.writeStore(n, {number:this.register.l.number,size:20});
        break;
      case 32:
        let s = this.readStore(n);
        let signBit = s.toNumber() < 0;
        this.register.l.assign(s);
        this.register.m.assign({number:signBit?~0:0,size:20});
        break;
      default:
        //Stop
        break;
            
    }

    this.postOrderHook(this);
  }
  
  getAccumulator(){
    let acc = new MachineWord(39, false);
    acc.number = ((this.registers.m.number << 19) & 0b11111111111111111111) | (this.registers.l.number & 0b1111111111111111111);
    return acc;
  }
  
  readStore(n){
    let v = this.store[n];
    s.assign(v);
    return v;
  }
  
  writeStore(n, v, op='assign'){
    s.assign(v);
    this.store[n][op](v);
  }

  setPostOrderHook(fn) {
    this.postOrderHook = fn;
  }
}

module.exports = { MachineWord, Order, SOLIDAC };
