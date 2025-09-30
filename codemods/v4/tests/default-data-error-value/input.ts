const { data: userData, error } = useAsyncData(
  () => client.value.v1.users.fetch(),
  {
    default: () => shallowRef(),
  }
);

const { data: listData, error: listError } = useFetch(
  () => client.value.v1.lists.fetch(),
  {
    default: () => shallowRef(),
  }
);

if (userData.value === null) {
  if (listData.value === null) {
    if (error.value === null) {
      // Something
    } else if (listError.value === null) {
      // Something else
    }
  }
}

let x =
  userData.value === null
    ? "Hello"
    : error.value === null
    ? "Morning"
    : listError.value === null
    ? "Hello"
    : listData.value === null
    ? "Morning"
    : "Night";
