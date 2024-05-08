<script setup>
definePageMeta({
  title: "Upload CSV",
});

const { $swal } = useNuxtApp();

const files = ref(null);
const project = ref({
  project_name: "",
  project_id: "",
});
const projectOptions = ref([]);

// const fileData = ref(null);
const pendingUpload = ref(false);

const { data: projectList } = await useFetch("/api/survey/project/list-name", {
  method: "GET",
});

if (projectList.value.statusCode == 200) {
  projectOptions.value = projectList.value.data;
}

// Watch if name same as project name in the list then set project id to the selected project.
// if not then set project id to null. doesnt matter if lowercase or uppercase
watch(
  () => project.value.project_name,
  (value) => {
    // Set to uppercase
    project.value.project_name = value.toUpperCase();

    const findPJ = projectOptions.value.find(
      (project) => project.project_name?.toLowerCase() === value?.toLowerCase()
    );

    if (findPJ) {
      project.value.project_id = findPJ.project_id;
    } else {
      project.value.project_id = "";
    }
  },
  {
    deep: true,
  }
);

const uploadFile = async () => {
  try {
    const formData = new FormData();

    // Loop through the files and append to the form data
    for (let i = 0; i < files.value.length; i++) {
      formData.append(`file_${i}`, files.value[i][0]);
    }

    formData.append("project_id", project.value.project_id);
    formData.append("project_name", project.value.project_name);

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
          project_id: uploadcsv.value.data.projectID,
        },
      });
    } else {
      $swal.fire({
        title: "Error",
        text: uploadcsv.value.message,
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
          <!-- <FormKit
            type="file"
            @change="onFileChange"
            accept=".csv"
            :multiple="true"
          /> -->
          <FormKit
            v-model="project.project_name"
            type="text"
            label="Project Name"
            placeholder="Type here or click below to select existing project name"
            validation="required"
          />

          <div class="flex flex-wrap gap-4 mb-5">
            <rs-button
              v-for="val in projectOptions"
              variant="primary-outline"
              class="py-1 px-4 rounded-full"
              @click="
                project.project_id = val.project_id;
                project.project_name = val.project_name;
              "
            >
              {{ val.project_name }}
            </rs-button>
          </div>

          <FormKit
            v-model="files"
            type="dropzone"
            label="Upload Survey Data"
            help="Upload your files here."
            accept=".csv, .xls, .xlsx"
            multiple="true"
            maxFiles="6"
          >
            <template #help>
              <ul class="mt-2 text-xs list-disc ml-4 text-gray-600">
                <li>
                  Only files with the following extensions are allowed:
                  <span class="font-semibold">.csv, .xls, .xlsx</span>.
                </li>
                <li>Maximum of 6 files allowed.</li>
                <li>
                  The more file you upload, the longer it will take to process.
                </li>
              </ul>
            </template>
          </FormKit>

          <rs-button btn-type="submit" :disabled="pendingUpload">
            <Icon
              v-if="pendingUpload"
              name="svg-spinners:12-dots-scale-rotate"
              class="mr-2"
            />
            {{ pendingUpload ? "Uploading..." : "Save Data" }}
          </rs-button>

          <div v-if="pendingUpload" class="mt-2 text-danger">
            Please wait while we process your upload. Larger datasets may
            require additional time for processing.
          </div>
        </FormKit>
      </template>
    </rs-card>
  </div>
</template>
