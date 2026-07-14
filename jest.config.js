module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],

    setupFiles: ['<rootDir>/tests/setup.ts'],

    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.test.json',
            },
        ],
    },
};