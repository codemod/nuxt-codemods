# Nuxt v3 to v4 Migration Codemod

Complete migration toolkit for upgrading from Nuxt 3 to Nuxt 4. This codemod applies all essential transformations in one workflow.

## Installation

```bash
# Install and run the codemod
npx codemod@latest run @nuxt-v3-to-v4

# Or run locally
npx codemod@latest run -w workflow.yaml
```

## What it does

This codemod applies 5 essential transformations for Nuxt v4:

### 1. Absolute Watch Path (`absolute-watch-path`)

Transforms `nuxt.hook('builder:watch', ...)` calls to use absolute paths with `relative()` and `resolve()` from `node:fs`.

**Before:**

```typescript
nuxt.hook("builder:watch", (event, path) => {
  console.log("Processing:", path);
});
```

**After:**

```typescript
nuxt.hook("builder:watch", (event, path) => {
  path = relative(nuxt.options.srcDir, resolve(nuxt.options.srcDir, path));
  console.log("Processing:", path);
});
```

### 2. Default Data Error Value (`default-data-error-value`)

Transforms null checks to undefined for `useAsyncData` and `useFetch` data/error variables.

**Before:**

```typescript
if (userData.value === null) {
  // handle null case
}
```

**After:**

```typescript
if (userData.value === undefined) {
  // handle undefined case
}
```

### 3. Deprecated Dedupe Value (`deprecated-dedupe-value`)

Transforms deprecated boolean values for the dedupe option in `refresh()` calls.

**Before:**

```typescript
await refresh({ dedupe: true });
await refresh({ dedupe: false });
```

**After:**

```typescript
await refresh({ dedupe: "cancel" });
await refresh({ dedupe: "defer" });
```

### 4. Shallow Function Reactivity (`shallow-function-reactivity`)

Adds `{ deep: true }` option to data fetching hooks that need deep reactivity.

**Before:**

```typescript
const { data } = useLazyAsyncData(() => $fetch("/api/users"));
```

**After:**

```typescript
const { data } = useLazyAsyncData(() => $fetch("/api/users"), { deep: true });
```

### 5. Template Compilation Changes (`template-compilation-changes`)

Transforms `addTemplate` calls from using `src` property with `.ejs` files to `getContents` function with lodash template compilation.

**Before:**

```typescript
addTemplate({
  fileName: "plugin.js",
  src: resolver.resolve("./runtime/plugin.ejs"),
});
```

**After:**

```typescript
import { readFileSync } from "node:fs";
import { template } from "lodash-es";

addTemplate({
  fileName: "plugin.js",
  getContents({ options }) {
    const contents = readFileSync(
      resolver.resolve("./runtime/plugin.ejs"),
      "utf-8"
    );
    return template(contents)({ options });
  },
});
```

## Important Notes

⚠️ **Backup First**: This codemod modifies code! Run it only on Git-tracked files, and commit or stash changes first.

⚠️ **Complete Migration**: This codemod performs all necessary transformations in the correct order to ensure your code properly migrates to Nuxt v4.

⚠️ **Manual Review**: Some complex patterns may need manual adjustment after running the codemod.

## Testing Individual Codemods

```bash
# Test all codemods
npx codemod@latest jssg test -l typescript scripts/absolute-watch-path.ts
npx codemod@latest jssg test -l typescript scripts/default-data-error-value.ts
npx codemod@latest jssg test -l typescript scripts/deprecated-dedupe-value.ts
npx codemod@latest jssg test -l typescript scripts/shallow-function-reactivity.ts
npx codemod@latest jssg test -l typescript scripts/template-compilation-changes.ts

# Run individual codemod on specific files
npx codemod@latest jssg run --language typescript --target ./your-file.ts scripts/absolute-watch-path.ts
```

## Development

```bash
# Install dependencies
npm install

# Type check
npm run check-types
```

## License

MIT
