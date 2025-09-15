# deprecated-dedupe-value

Transform deprecated dedupe boolean values to string values in refresh() calls

## Installation

```bash
# Install from registry
codemod run deprecated-dedupe-value

# Or run locally
codemod run -w workflow.yaml
```

## Usage

This codemod transforms deprecated boolean values for the dedupe option in refresh() calls to their new string equivalents.

### Before

```tsx
// biome-ignore lint/correctness/useHookAtTopLevel: <explanation>
await refresh({ dedupe: true });
await refresh({ dedupe: false });
```

### After

```tsx
// biome-ignore lint/correctness/useHookAtTopLevel: <explanation>
await refresh({ dedupe: "cancel" });
await refresh({ dedupe: "defer" });
```

## License

MIT