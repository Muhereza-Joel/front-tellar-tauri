module.exports = {
  testEnvironment: "jest-environment-jsdom",
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.cjs"],
  testMatch: [
    "<rootDir>/app/**/*.test.(ts|tsx)", // look inside app folder
    "<rootDir>/app/**/__tests__/*.(ts|tsx)",
  ],
};
