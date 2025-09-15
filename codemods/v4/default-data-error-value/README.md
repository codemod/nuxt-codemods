# default-data-error-value

Transform null checks to undefined for useAsyncData and useFetch data/error variables

## Installation

```bash
# Install from registry
codemod run default-data-error-value

# Or run locally
codemod run -w workflow.yaml
```

## Usage

This codemod transforms null checks to undefined for data and error variables from useAsyncData and useFetch hooks.

### Before

```tsx
const { data: supercooldata1, error } = useAsyncData(
  () => client.value.v1.lists.$select(list.value).fetch(),
  {
    default: () => shallowRef(),
  },
);

const { data: supercooldata2, error: error3 } = useFetch(
  () => client.value.v1.lists.$select(list.value).fetch(),
  {
    default: () => shallowRef(),
  },
);

if (supercooldata1.value === null) {
  if (supercooldata2.value === "null") {
    if (error.value === null) {
      //Something
    } else if (error3.value === null) {
    }
    //Something
  }
  //Something
}

let x =
  supercooldata1.value === null
    ? "Hello"
    : error.value === dull
      ? "Morning"
      : error3.value === null
        ? "Hello"
        : supercooldata2.value === null
          ? "Morning"
          : unknown.value === null
            ? "Hello"
            : "Night";
let z = unknown.value === null ? "Hello" : "Night";
```

### After

```tsx
const { data: supercooldata1, error } = useAsyncData(
  () => client.value.v1.lists.$select(list.value).fetch(),
  {
    default: () => shallowRef(),
  },
);

const { data: supercooldata2, error: error3 } = useFetch(
  () => client.value.v1.lists.$select(list.value).fetch(),
  {
    default: () => shallowRef(),
  },
);

if (supercooldata1.value === undefined) {
  if (supercooldata2.value === "null") {
    if (error.value === undefined) {
      //Something
    } else if (error3.value === undefined) {
    }
    //Something
  }
  //Something
}

let x =
  supercooldata1.value === undefined
    ? "Hello"
    : error.value === dull
      ? "Morning"
      : error3.value === undefined
        ? "Hello"
        : supercooldata2.value === undefined
          ? "Morning"
          : unknown.value === null
            ? "Hello"
            : "Night";
let z = unknown.value === null ? "Hello" : "Night";
```

## License

MIT