# Nuxt v3 to v4 Migration Codemod

This codemod migrates your project from Nuxt v3 to v4, handling the breaking changes:

- Updates `nuxt.hook('builder:watch')` calls to use absolute paths with proper path normalization
- Transforms null checks to undefined for data fetching variables (`useAsyncData`, `useFetch`)
- Converts deprecated boolean `dedupe` values to new string format in `refresh()` calls
- Adds `{ deep: true }` option to data fetching hooks that need deep reactivity
- Modernizes `addTemplate` calls from `src` property to `getContents` function pattern

## Installation

```bash
# Install and run the codemod
npx codemod@latest run @nuxt-v3-to-v4

# Or run locally
npx codemod@latest run -w workflow.yaml --target /path/to/your/project --allow-dirty
```

## Important Notes

⚠️ **Backup First**: This codemod modifies code! Run it only on Git-tracked files, and commit or stash changes first.

⚠️ **Path Normalization**: The `absolute-watch-path` transformation assumes standard Nuxt project structure. Custom watch path handling may need manual adjustment.

⚠️ **Data Fetching Variables**: If you have custom null checking logic beyond simple equality comparisons, you may need to adjust these manually.

⚠️ **Complete Migration**: This codemod performs all necessary transformations in the correct order to ensure your code properly migrates to Nuxt v4.

## Testing Import Utils

Test the `ensureImport` utility function with various scenarios. Navigate to `codemods/v4/` and run:

```bash
# Replace case-X with: case-1-add-empty-file, case-2-no-action-exists, ...

# Test basic import scenarios (cases 1-5, 8-9)
codemod jssg run --language typescript --target tests/import-utils/case-X/input.ts tests/import-utils/test-runner.ts

# Test type to runtime conversion (case 6)
codemod jssg run --language typescript --target tests/import-utils/case-6-mixed-type-to-runtime/input.ts tests/import-utils/case-6-type-to-runtime-test.ts

# Test runtime to type conversion (case 7)
codemod jssg run --language typescript --target tests/import-utils/case-7-mixed-runtime-to-type/input.ts tests/import-utils/case-7-runtime-to-type-test.ts

```

**Verify results:** Compare output with the `expected.ts` file in each test directory.

## Resources

- [Nuxt v4 Migration Guide](https://nuxt.com/docs/getting-started/upgrade#nuxt-4)

## License

MIT
