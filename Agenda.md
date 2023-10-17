## First Meeting 9\21\2023
The first meeting with my supervisor, Jeremy Singer, involved discussing the project's timeline and the tasks to be completed at 
different stages. We established a regular weekly meeting schedule. Professor Singer provided materials about SOLIDAC and identified 
things to be completed before next meeting, as well as topics to be discussed.


## 09\28\2023
Discussed the initial emulator design with the professor and raised some questions about the project. Jeremy provided additional materials 
on SOLIDAC and offered suggestions and ideas for the project. Here are some feedbacks from this meeting:
- Complete the reading of materials before the next meeting.
- Draw a component diagram.
- Decide whether to create a web-based application or a standalone app.
- Begin thinking about the implementation plan.


## 10\04\2023
Discussed some details of SOLIDAC. Here are some feedbacks from this meeting:\
The suggestion is to begin modeling a computer system in JavaScript using objects. This modeling includes representing the machine state, which comprises a set of register variables (e.g., var a, var b[7], var c, var s), and defining the structure of an instruction, where each instruction consists of three fields: f, b, and n.

The proposed approach involves writing a function to interpret instructions, with the initial focus on interpreting instructions 1 to 9. These instructions include operations such as storing register values in memory, loading values from memory to registers, arithmetic operations, and logical operations, both with registers and constants.

For example, Instruction {f = 1; b = 3; s = 100} is interpreted as memory[100] = b[3].

The goal is to create a JavaScript prototype for this computer system modeling, with an emphasis on implementing the specified instructions. 


## 10\11\2023
Reviewed the code logic, and there don't appear to be any obvious issues. Also, set up the tasks to be completed next week on GitHub: 
- Writing some unit tests to verify the completed code
- Finished implementing order code.
