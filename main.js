// interactive test of machine words
// @jsinger
// 3 Nov 2023
//
// Run with:   node main.js

const interp = require("./interpreter");

var a = new interp.MachineWord(4);
a.number = 1;
var b = new interp.MachineWord(4);
b.number = 2;


console.log(a);
console.log(b);
a.add(b);
console.log(a);

