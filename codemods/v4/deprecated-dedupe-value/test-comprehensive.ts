// Comprehensive test for deprecated-dedupe-value-jssg

// Test 1: Basic refresh calls
await refresh({ dedupe: "cancel" });
await refresh({ dedupe: "defer" });

// Test 2: Refresh with other options
await refresh({ dedupe: "cancel", server: false });
await refresh({ dedupe: "defer", server: true });

// Test 3: Nested refresh calls
function handleRefresh() {
  await refresh({ dedupe: "cancel" });
  await refresh({ dedupe: "defer" });
}

// Test 4: Should NOT transform - different values
await refresh({ dedupe: "cancel" });
await refresh({ dedupe: "defer" });

// Test 5: Should NOT transform - no dedupe option
await refresh({ server: false });
await refresh();

// Test 6: Complex object
await refresh({
  dedupe: "cancel",
  server: false,
  lazy: true
});
