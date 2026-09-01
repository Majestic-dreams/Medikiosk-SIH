const {
    getCaseRecords
} = require("./services/datasetService");

const cases = getCaseRecords();

const targetCase = cases.find(
    record => record.case_id === "SIH-0013"
);

console.log("\n========== SIH-0013 ==========\n");

if (!targetCase) {
    console.log("SIH-0013 was NOT found.");
    process.exit(0);
}

console.log("CASE ID:");
console.log(targetCase.case_id);

console.log("\nCANONICAL COMPLAINT:");
console.log(targetCase.canonical_complaint);

console.log("\nPATIENT UTTERANCE:");
console.log(targetCase.patient_utterance);

console.log("\nDURATION:");
console.log(targetCase.duration);

console.log("\nSEVERITY:");
console.log(targetCase.severity);

console.log("\nASSOCIATED SYMPTOMS:");
console.log(targetCase.associated_symptoms);

console.log("\nMISSING INFORMATION:");
console.log(targetCase.missing_information);

console.log("\nPREFERRED AYUSH SYSTEM:");
console.log(targetCase.preferred_ayush_system);

console.log("\nPREFERRED CONSULTATION:");
console.log(targetCase.preferred_consultation);

console.log("\nALTERNATIVE CONSULTATION:");
console.log(targetCase.alternative_consultation);

console.log("\nROUTING CONFIDENCE:");
console.log(targetCase.routing_confidence);

console.log("\nCLARIFICATION REQUIRED:");
console.log(targetCase.clarification_required);

console.log("\nESCALATION REQUIRED:");
console.log(targetCase.escalation_required);

console.log("\n=================================\n");