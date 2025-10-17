// Test case: useLazyAsyncData with single function argument
const { data: users } = useLazyAsyncData(() => $fetch("/api/users"));

// Test case: useAsyncData with object options already
const { data: posts } = useAsyncData("posts", () => $fetch("/api/posts"), {
  server: false,
});

// Test case: useFetch with just function
const { data: comments } = useFetch(() => $fetch("/api/comments"));

// Test case: useLazyFetch with key and function
const { data: likes } = useLazyFetch("likes", () => $fetch("/api/likes"));
