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

if (userData.value === undefined) {
  if (listData.value === undefined) {
    if (error.value === undefined) {
      // Something
    } else if (listError.value === undefined) {
      // Something else
    }
  }
}

let x =
  userData.value === undefined
    ? "Hello"
    : error.value === undefined
    ? "Morning"
    : listError.value === undefined
    ? "Hello"
    : listData.value === undefined
    ? "Morning"
    : "Night";
