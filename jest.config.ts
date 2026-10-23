import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  testEnvironment: "jest-environment-jsdom",
  roots: ["<rootDir>/tests", "<rootDir>/src"],
  testMatch: [
    "<rootDir>/tests/**/*.test.{ts,tsx}",
    "<rootDir>/src/**/*.test.{ts,tsx}",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // remark-gfm は ESM 専用パッケージで Jest が構文解析できないためモックに差し替える
    "^remark-gfm$": "<rootDir>/tests/__mocks__/remark-gfm.ts",
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
};

export default createJestConfig(config);
