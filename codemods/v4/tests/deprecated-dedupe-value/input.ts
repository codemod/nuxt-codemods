// Test case: refresh calls with dedupe: true that should be transformed
await refresh({ dedupe: true });

await refresh({
  dedupe: true,
  other: "option",
});

// Test case: refresh calls with dedupe: false that should be transformed
await refresh({ dedupe: false });
