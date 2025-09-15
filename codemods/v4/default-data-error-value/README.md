# Nuxt 4 Default Data Error Value jssg Codemod

## Overview

This jssg (JavaScript ast-grep) codemod updates `null` comparisons to `undefined` for default `data` and `error` values in `useAsyncData` and `useFetch` hooks when migrating from Nuxt 3 to Nuxt 4.

## What Changed

The `data` and `error` objects returned from `useAsyncData` and `useFetch` will now default to `undefined` instead of `null` in Nuxt 4.

## Before and After Examples

### Before

```javascript
const { data, error } = useAsyncData(
  () => client.value.v1.lists.$select(list.value).fetch(),
  {
    default: () => shallowRef(),
  },
);

if (data.value === null) {
  // Handle case where data is null
}
```

### After

```javascript
const { data, error } = useAsyncData(
  () => client.value.v1.lists.$select(list.value).fetch(),
  {
    default: () => shallowRef(),
  },
);

if (data.value === undefined) {
  // Handle case where data is undefined
}
```

## Usage

### Running the Codemod

```bash
npx codemod jssg run -l tsx ./scripts/codemod.ts <target-directory>
```

### Testing

```bash
# Run tests
npm test

# Update test snapshots
npm run test:update
```

### Bundling

```bash
npm run bundle
```

## Architecture

This codemod uses the jssg (JavaScript ast-grep) architecture, which provides:

- **Type Safety**: Full TypeScript support with language-specific AST node types
- **Modular Design**: Organized transformation logic with utility functions
- **Testing Framework**: Built-in test runner with snapshot testing
- **Cross-Platform**: Works seamlessly across different operating systems

## Transformation Logic

The codemod:

1. **Identifies target variables**: Finds destructured `data` and `error` variables from `useAsyncData` and `useFetch` calls
2. **Handles aliasing**: Properly handles both direct destructuring (`{ data, error }`) and aliased destructuring (`{ data: userData, error: userError }`)
3. **Locates comparisons**: Finds all binary expressions where these variables are compared to `null`
4. **Updates comparisons**: Replaces `=== null` with `=== undefined`
5. **Handles nested expressions**: Updates ternary operators and nested conditional expressions

## Files

- `scripts/codemod.ts` - Main transformation logic
- `codemod.yaml` - Codemod configuration and metadata
- `tests/` - Test fixtures with input/expected file pairs
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration