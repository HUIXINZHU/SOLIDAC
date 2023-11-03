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
        c:new MachineWord(21), //The control register
        d:new MachineWord(21), //The multiplier/quptient register      
        i:new MachineWord(21), //The inspection register

        m:new MachineWord(21), //The double-length accumulator,high half
        I:new MachineWord(19,false,false)
      }
      this.store=Array.from({length:512},()=>new MachineWord(20,false));
    }
    executeOrder(order){
      const{f,b,n}=order;

      switch(f){
        case 1:
          this.store[n].assign(this.registers.b[b]);
          break;
        case 2:
          this.registers.b[b].assign(this.store[n]);
          break;
        case 3:
          this.registers.b[b].subtract(this.store[n]);
          break;
        case 4:
          this.registers.b[b].subtract(this.store[n]);
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
          this.store[n].swap(this.registers.b[b]);
          break;
        default:
          //Stop
          break;
              
      }
    }
  }

module.exports = { MachineWord, Order, SOLIDAC };
