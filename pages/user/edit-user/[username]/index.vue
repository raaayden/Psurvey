<script setup>
definePageMeta({
  title: "Edit User",
});

const username = useRoute().params.username;
const { $swal } = useNuxtApp();

const showPassword = ref(false);
const form = ref({
  username: "",
  email: "",
});

const { data: getUser } = await useFetch("/api/demo/get-user", {
  method: "GET",
  query: {
    username: username,
  },
});

if (getUser.value.statusCode == 200) {
  form.value.username = getUser.value.data.userUsername;
  form.value.email = getUser.value.data.userEmail;
}

async function submit() {
  try {
    const { data } = await useFetch("/api/demo/edit-user", {
      method: "POST",
      body: {
        username: form.value.username,
        email: form.value.email,
      },
    });

    console.log(data.value);

    if (data.value.statusCode == 200) {
      $swal.fire({
        title: "Success",
        text: data.value.message,
        icon: "success",
        confirmButtonText: "Ok",
      });
    } else {
      $swal.fire({
        title: "Error",
        text: data.value.message,
        icon: "error",
        confirmButtonText: "Ok",
      });
    }
  } catch (error) {
    console.log(error);
  }
}
</script>
<template>
  <div>
    <LayoutsBreadcrumb />

    <rs-card class="p-5">
      <h3>Edit Info</h3>
      <br />
      <FormKit type="form" @submit="submit">
        <FormKit
          v-model="form.username"
          type="text"
          label="Username"
          validation="required|length:6,255"
        ></FormKit>
        <FormKit
          v-model="form.email"
          type="email"
          label="Email"
          validation="required|email"
        ></FormKit>
      </FormKit>
    </rs-card>
  </div>
</template>
