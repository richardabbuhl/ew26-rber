export const qualityGates = [
  { id: "gate-001", specificationId: "spec-001", name: "Unit Tests", status: "Passed", score: 100, description: "All unit tests executed successfully." },
  { id: "gate-002", specificationId: "spec-001", name: "Integration Tests", status: "Passed", score: 98, description: "Service integrations validated." },
  { id: "gate-003", specificationId: "spec-001", name: "SonarQube", status: "Passed", score: 94, description: "Code quality threshold achieved." },
  { id: "gate-004", specificationId: "spec-001", name: "Checkmarx", status: "Passed", score: 96, description: "No critical vulnerabilities detected." },
  { id: "gate-005", specificationId: "spec-001", name: "Architecture Tests", status: "Passed", score: 100, description: "Architecture rules validated using ArchUnit." },
  { id: "gate-006", specificationId: "spec-001", name: "CLM", status: "Passed", score: 100, description: "Dependencies comply with policy." },
];