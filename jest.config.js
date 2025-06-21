// jest.config.js - Updated to use SWC instead of ts-jest
module.exports = {
  // Remove ts-jest preset
  // preset: 'ts-jest', // REMOVE THIS LINE
  
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // NEW: Use SWC for much faster TypeScript compilation
  transform: {
    '^.+\\.(ts|tsx)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: false,
          decorators: true,
        },
        target: 'es2020',
        keepClassNames: true,
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
      module: {
        type: 'commonjs',
      },
    }],
  },
  
  // Performance optimizations
  maxWorkers: '100%',
  testTimeout: 5000,
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  collectCoverage: process.env.CI === 'true',
  
  // SWC is so fast, we can remove some ts-jest specific optimizations
  // Remove the globals section entirely since we're not using ts-jest
  
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false,
  watchman: true,
  workerIdleMemoryLimit: '512MB',
  
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],
  
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/build/'],
  
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
    '<rootDir>/.jest-cache/'
  ]
};