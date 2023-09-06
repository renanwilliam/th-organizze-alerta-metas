/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.(t|j)sx?$': '@swc/jest',
    },
    modulePathIgnorePatterns: [
        '<rootDir>/dist/',
    ],
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
    moduleFileExtensions: [
        'ts',
        'js',
        'json',
        'node',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: [
        'json-summary',
        'text',
        'lcov',
    ],
};

module.exports = config;