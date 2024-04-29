<script setup>
definePageMeta({
  title: "Upload CSV",
});

const { $swal } = useNuxtApp();
const file = ref(null);

// const fileData = ref(null);
const pendingUpload = ref(false);

const onFileChange = (e) => {
  file.value = e.target.files[0];
};

const uploadFile = async () => {
  try {
    const formData = new FormData();
    formData.append("file", file.value);

    pendingUpload.value = true;

    const { data: uploadcsv } = await useFetch("/api/survey/upload/csv", {
      method: "POST",
      body: formData,
    });

    if (uploadcsv.value.statusCode == 200) {
      $swal.fire({
        title: "Success",
        text: "File uploaded successfully",
        icon: "success",
      });

      navigateTo({
        path: "/survey/list",
        query: {
          id: uploadcsv.value.data.file_id,
        },
      });
    } else {
      $swal.fire({
        title: "Error",
        text: data.value.message,
        icon: "error",
      });
    }

    pendingUpload.value = false;
  } catch (error) {
    console.error(error);
  }
};
</script>

<template>
  <div>
    <LayoutsBreadcrumb />

    <rs-card>
      <template #header> Import CSV </template>
      <template #body>
        <FormKit type="form" :actions="false" @submit="uploadFile">
          <FormKit type="file" @change="onFileChange" accept=".csv" />

          <rs-button btn-type="submit" :disabled="pendingUpload">
            <Icon
              v-if="pendingUpload"
              name="svg-spinners:12-dots-scale-rotate"
              class="mr-2"
            />
            {{ pendingUpload ? "Uploading..." : "Save Data" }}
          </rs-button>
        </FormKit>
      </template>
    </rs-card>
  </div>
</template>
