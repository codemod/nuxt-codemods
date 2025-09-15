// Comprehensive test for default-data-error-value-jssg

// Test 1: Basic useAsyncData with null checks
const { data: userData, error: userError } = useAsyncData(
  'user',
  () => $fetch('/api/user'),
  { default: () => null }
);

if (userData.value === undefined) {
  console.log('No user data');
}

if (userError.value === undefined) {
  console.log('No error');
}

// Test 2: useFetch with different variable names
const { data: posts, error: postsError } = useFetch('/api/posts', {
  default: () => []
});

if (posts.value === undefined) {
  console.log('No posts');
}

if (postsError.value === undefined) {
  console.log('No posts error');
}

// Test 3: Nested conditions
if (userData.value === undefined) {
  if (posts.value === undefined) {
    if (userError.value === undefined) {
      console.log('All null');
    }
  }
}

// Test 4: Ternary operators
const message = userData.value === undefined ? 'No data' : 'Has data';
const errorMessage = userError.value === undefined ? 'No error' : 'Has error';

// Test 5: Should NOT transform - different variables
const otherData = ref(null);
if (otherData.value === null) {
  console.log('This should stay null');
}

// Test 6: Should NOT transform - different comparison
if (userData.value === undefined) {
  console.log('This should stay undefined');
}
