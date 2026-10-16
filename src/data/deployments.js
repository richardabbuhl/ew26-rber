export const deployments = [
  {
    specificationId: "spec-001",
    provider: "Claude Factory",
    implementation: "Implementation B",
    environments: [
      { name: "Development", status: "Succeeded" },
      { name: "Test", status: "Succeeded" },
      { name: "Acceptance", status: "Succeeded" },
      { name: "Production", status: "Running" },
    ],
  },
];