<script setup>
definePageMeta({
  title: "Add User",
});

const { $swal } = useNuxtApp();

const showPassword = ref(false);
const form = ref({
  username: "",
  email: "",
  password: "",
});

async function submit() {
  try {
    const { data } = await useFetch("/api/demo/add-user", {
      method: "POST",
      body: {
        username: form.value.username,
        email: form.value.email,
        password: form.value.password,
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
      <h3>Add Info</h3>
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
        <FormKit
          v-model="form.password"
          :type="showPassword == true ? 'text' : 'password'"
          label="Password"
          validation="required"
        >
          <template #suffix>
            <rs-button
              class="!w-[50px] p-2"
              @click="showPassword = !showPassword"
            >
              <Icon name="ph:eye"></Icon>
            </rs-button>
          </template>
        </FormKit>
      </FormKit>
    </rs-card>
  </div>
</template>
