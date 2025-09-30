// Test case: refresh calls with dedupe: true that should be transformed
await refresh({ dedupe: "cancel" });

await refresh({
  dedupe: "cancel",
  other: "option",
});

// Test case: refresh calls with dedupe: false that should be transformed
await refresh({ dedupe: "defer" });
