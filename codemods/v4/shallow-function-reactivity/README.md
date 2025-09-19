# shallow-function-reactivity

Add deep: true option to useLazyAsyncData, useAsyncData, useFetch, and useLazyFetch calls

## Installation

```bash
# Install from registry
npx codemod@latest run @nuxt/shallow-function-reactivity

# Or run locally
npx codemod@latest run -w workflow.yaml
```

## Usage

This codemod adds the deep: true option to Nuxt composables to ensure proper reactivity for function-based data.

### Before

```tsx
// biome-ignore lint/correctness/useHookAtTopLevel: <explanation>
const { data } = useLazyAsyncData("/api/test");
```

### After

```tsx
// biome-ignore lint/correctness/useHookAtTopLevel: <explanation>
const { data } = useLazyAsyncData("/api/test", { deep: true });
```

## License

MIT