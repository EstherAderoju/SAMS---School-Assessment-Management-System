/**
 * Downloadable CSV templates and sample files for SAMS
 */

export const STUDENT_TEMPLATE_CSV = `AdmissionNumber,FirstName,Surname,MiddleName,Gender,Class,ClassArm,DateOfBirth,GuardianName,GuardianPhone,GuardianEmail,Address
UDGS/2025/J001,Chukwuemeka,Obi,David,Male,JSS 1,JSS 1 Gold,2013-05-14,Chief Emmanuel Obi,+234 803 222 1100,emmanuel.obi@gmail.com,12 Iwo Road Ibadan
UDGS/2025/J002,Amina,Bello,Zahra,Female,JSS 1,JSS 1 Gold,2013-08-22,Alhaji Mansur Bello,+234 802 333 4411,mbello@consulting.ng,8 Bodija Ibadan
UDGS/2025/J003,Babatunde,Adeyemi,Oluwaseun,Male,JSS 1,JSS 1 Gold,2013-03-10,Barrister Gbenga Adeyemi,+234 805 111 9988,gbenga@adeyemilaw.com,25 Agodi GRA Ibadan`;

export const MCQ_TEMPLATE_CSV = `Question,Option A,Option B,Option C,Option D,Correct Answer,Marks,Subject,Class,Topic,Difficulty,Component
"What is the basic functional and structural unit of all living organisms?",Tissue,Cell,Organ,System,B,2,Biology,SSS 2,Cell Biology,easy,CA1
"Which gas is essential for green plants during photosynthesis?",Oxygen,Nitrogen,Carbon Dioxide,Hydrogen,C,2,Basic Science,JSS 1,Photosynthesis,medium,CA1
"Simplify the algebraic expression: 3(x + 4) - 2(x - 1)",x + 14,x + 10,5x + 14,x + 12,A,2,Mathematics,JSS 1,Algebraic Simplification,medium,CA2
"The kinetic energy of an object of mass m moving with velocity v is given by which formula?",m*v,0.5*m*v^2,m*g*h,0.5*m^2*v,B,3,Physics,SSS 2,Work and Energy,hard,EXAM`;

export const TRUE_FALSE_TEMPLATE_CSV = `Question,Option A,Option B,Correct Answer,Marks,Subject,Class,Topic,Difficulty,Component
"The sum of angles on a straight line is 180 degrees.",True,False,True,1,Mathematics,JSS 1,Geometry,easy,CA1
"Light travels slower in air than in water.",True,False,False,2,Physics,SSS 2,Optics,medium,CA2
"Nigeria operates a federal system of government with 36 states.",True,False,True,1,Civic Education,JSS 1,Governance,easy,CA1`;

export const SHORT_ANSWER_TEMPLATE_CSV = `Question,Expected Answer,Marks,Subject,Class,Topic,Difficulty,Component
"State the chemical symbol for Sodium.",Na,1,Chemistry,SSS 2,Elements,easy,CA1
"What type of sentence gives a direct command or request?",Imperative,2,English Language,JSS 1,Grammar,medium,CA2
"Calculate the value of x if 2x + 6 = 20.",7,2,Mathematics,JSS 1,Linear Equations,medium,CA1`;

export const ESSAY_TEMPLATE_CSV = `Question,Marking Guide / Model Answer,Marks,Subject,Class,Topic,Difficulty,Component
"Write a letter to your school principal requesting permission to organize a science exhibition.","Rubric: 1. Formal letter format (2 marks). 2. Reason for exhibition clearly stated (3 marks). 3. Logistics, proposed date and venue (3 marks). 4. Grammatical expression and polite closing (2 marks).",10,English Language,JSS 1,Formal Letter Writing,medium,CA2
"Describe the process of blood circulation through the human heart, differentiating between pulmonary and systemic circulation.","Rubric: 1. Deoxygenated blood from vena cava to right atrium and ventricle (3 marks). 2. Pulmonary artery to lungs for oxygenation (2 marks). 3. Oxygenated blood returns via pulmonary veins to left side (2 marks). 4. Aorta pumps blood to rest of body (3 marks).",10,Biology,SSS 2,Transport System,hard,EXAM`;

export function downloadCsvFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
