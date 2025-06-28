import type { PackageInfo } from '#/types/package-info.js'

// Real-world package.json samples from popular monorepos
export const realWorldPackages: PackageInfo[] = [
  // From Babel monorepo
  {
    path: '/workspace/packages/babel-core',
    name: '@babel/core',
    relativePath: 'packages/babel-core',
    scripts: {
      build: 'gulp build',
      test: 'jest',
      'test:cov': 'jest --coverage',
      lint: 'eslint src --ext .js,.ts',
      fix: 'eslint src --ext .js,.ts --fix',
      prepublishOnly: 'npm run build',
      version: 'npm run build',
    },
  },
  {
    path: '/workspace/packages/babel-parser',
    name: '@babel/parser',
    relativePath: 'packages/babel-parser',
    scripts: {
      build: 'gulp build:bundle',
      test: 'jest',
      lint: 'eslint src bin --ext .js,.ts',
      fix: 'eslint src bin --ext .js,.ts --fix',
      bench: 'node ./benchmark',
      prepublishOnly: 'npm run build',
    },
  },
  // From Jest monorepo
  {
    path: '/workspace/packages/jest-cli',
    name: 'jest-cli',
    relativePath: 'packages/jest-cli',
    scripts: {
      test: 'node ./bin/jest.js',
      'test:ci': 'yarn test --ci',
      'test:watch': 'yarn test --watch',
      typecheck: 'tsc --noEmit',
      lint: 'eslint . --ext js,ts,md',
      'lint:fix': 'eslint . --ext js,ts,md --fix',
      build:
        'babel src --out-dir build --extensions ".ts,.js" --source-maps --ignore "src/**/__tests__/**/*"',
      'build:watch': 'yarn build --watch',
      clean: 'rimraf build',
      prepare: 'yarn build',
    },
  },
  // From Lerna monorepo
  {
    path: '/workspace/packages/lerna',
    name: 'lerna',
    relativePath: 'packages/lerna',
    scripts: {
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:ci': 'jest --ci --coverage --maxWorkers=2',
      lint: 'eslint . --ext .js,.ts',
      build: 'tsc -b',
      watch: 'tsc -b --watch',
      clean: 'rimraf lib',
      prepublishOnly: 'npm run build',
    },
  },
  // From React Native monorepo
  {
    path: '/workspace/packages/react-native',
    name: 'react-native',
    relativePath: 'packages/react-native',
    scripts: {
      start: 'react-native start',
      test: 'jest',
      'test:ci': 'jest --ci --coverage --maxWorkers=2',
      flow: 'flow',
      'flow:check': 'flow check',
      lint: 'eslint .',
      'lint:fix': 'eslint . --fix',
      format: 'prettier --write "**/*.{js,md,json}"',
      'format:check': 'prettier --check "**/*.{js,md,json}"',
      'build:ios': 'react-native run-ios',
      'build:android': 'react-native run-android',
      'bundle:ios': 'react-native bundle --platform ios',
      'bundle:android': 'react-native bundle --platform android',
    },
  },
  // Complex enterprise app examples
  {
    path: '/workspace/apps/mobile-app',
    name: '@company/mobile-app',
    relativePath: 'apps/mobile-app',
    scripts: {
      start: 'expo start',
      'start:dev': 'expo start --dev',
      'start:prod': 'expo start --no-dev --minify',
      ios: 'expo start --ios',
      android: 'expo start --android',
      web: 'expo start --web',
      eject: 'expo eject',
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage',
      lint: 'eslint . --ext .js,.jsx,.ts,.tsx',
      'type-check': 'tsc --noEmit',
      'build:ios': 'eas build --platform ios',
      'build:android': 'eas build --platform android',
      'build:preview': 'eas build --platform all --profile preview',
      'submit:ios': 'eas submit --platform ios',
      'submit:android': 'eas submit --platform android',
    },
  },
  // Microservices examples
  {
    path: '/workspace/services/api-gateway',
    name: '@backend/api-gateway',
    relativePath: 'services/api-gateway',
    scripts: {
      dev: 'nodemon --exec ts-node src/index.ts',
      'dev:debug':
        'nodemon --exec "node -r ts-node/register --inspect-brk" src/index.ts',
      build: 'tsc',
      'build:docker': 'docker build -t api-gateway .',
      start: 'node dist/index.js',
      'start:prod': 'NODE_ENV=production node dist/index.js',
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:integration': 'jest --testPathPattern=integration',
      'test:e2e': 'jest --config jest.e2e.config.js',
      lint: 'eslint src --ext .ts',
      migrate: 'knex migrate:latest',
      'migrate:make': 'knex migrate:make',
      seed: 'knex seed:run',
    },
  },
  // Tools and utilities
  {
    path: '/workspace/tools/eslint-config',
    name: '@company/eslint-config',
    relativePath: 'tools/eslint-config',
    scripts: {
      test: 'mocha tests --recursive',
      lint: 'eslint .',
      prepublishOnly: 'npm test',
    },
  },
]

// Generate additional variations
export const generateRealWorldVariations = (): PackageInfo[] => {
  const variations: PackageInfo[] = []

  // Add variations with different naming patterns
  const namingPatterns = [
    { prefix: '@org/', separator: '-' },
    { prefix: '', separator: '-' },
    { prefix: '@company/', separator: '_' },
    { prefix: 'company.', separator: '.' },
  ]

  const packageTypes = ['web', 'mobile', 'api', 'lib', 'tool', 'service']
  const features = [
    'auth',
    'user',
    'admin',
    'payment',
    'notification',
    'analytics',
  ]

  namingPatterns.forEach(({ prefix, separator }) => {
    packageTypes.forEach((type) => {
      features.forEach((feature) => {
        const name = `${prefix}${type}${separator}${feature}`
        variations.push({
          path: `/workspace/packages/${name.replace(/[@/.]/g, '')}`,
          name,
          relativePath: `packages/${name.replace(/[@/.]/g, '')}`,
          scripts: {
            dev: 'vite',
            build: 'vite build',
            test: 'vitest',
            'test:ui': 'vitest --ui',
            lint: 'eslint src',
            'type-check': 'tsc --noEmit',
          },
        })
      })
    })
  })

  return variations
}
