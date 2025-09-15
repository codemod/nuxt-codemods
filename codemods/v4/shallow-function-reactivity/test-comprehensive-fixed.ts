// Comprehensive test for shallow-function-reactivity-jssg

// Test 1: Basic useLazyAsyncData
const { data: userData } = useLazyAsyncData('/api/user', { deep: true });
const { data: postsData } = useLazyAsyncData('/api/posts', { deep: true });

// Test 2: useLazyAsyncData with options
const { data: settingsData } = useLazyAsyncData('/api/settings', { server: false });
const { data: configData } = useLazyAsyncData('/api/config', { default: () => ({}) });

// Test 3: useLazyAsyncData with key and options
const { data: profileData } = useLazyAsyncData('profile', () => $fetch('/api/profile'));
const { data: statsData } = useLazyAsyncData('stats', () => $fetch('/api/stats'), { server: true });

// Test 4: Should NOT transform - already has deep option
const { data: existingData } = useLazyAsyncData('/api/existing', { deep: true });
const { data: otherData } = useLazyAsyncData('/api/other', { deep: false });

// Test 5: Should transform - useAsyncData and useFetch (according to legacy)
const { data: regularData } = useAsyncData('/api/regular', { deep: true });
const { data: fetchData } = useFetch('/api/fetch', { deep: true });

// Test 6: Should transform - useLazyFetch
const { data: lazyFetchData } = useLazyFetch('/api/lazy', { deep: true });

// Test 7: Complex nested calls
function setupData() {
  const { data: nestedData } = useLazyAsyncData('/api/nested', { deep: true });
  return nestedData;
}
