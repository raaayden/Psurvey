<script setup>
definePageMeta({
  title: "List of Surveys",
});

const { $swal } = useNuxtApp();
const fileData = ref(null);

const fileID = useRoute().query.id;

const optionFile = ref([
  {
    label: "No File",
    value: "",
  },
]);
const optionFileValue = ref(null);

if (fileID) {
  optionFileValue.value = fileID;
}

const { data: selectOptions } = await useFetch("/api/survey/list/file", {
  method: "GET",
});

if (selectOptions.value.statusCode == 200) {
  optionFile.value = selectOptions.value.data;
}

const { data: surveyList } = await useFetch("/api/survey/list/get", {
  method: "GET",
  params: {
    id: fileID,
  },
});

if (surveyList.value.statusCode == 200) {
  fileData.value = surveyList.value.data;
}

const submitFilter = () => {
  const query = {
    id: optionFileValue.value,
  };

  navigateTo({ query });
};
</script>

<template>
  <div>
    <LayoutsBreadcrumb />

    <rs-card>
      <template #header> Filter </template>
      <template #body>
        <FormKit
          v-model="optionFileValue"
          type="select"
          label="File Name"
          :options="optionFile"
        />

        <rs-button @click="submitFilter" :disabled="!optionFileValue">
          Fetch Data
        </rs-button>
      </template>
    </rs-card>

    <rs-card v-if="fileData && fileData.length > 0">
      <template #header> Survey List </template>
      <template #body>
        <rs-table
          v-if="fileData && fileData.length > 0"
          :data="fileData"
          :options="{
            variant: 'default',
            striped: true,
            borderless: true,
          }"
          advanced
        />
      </template>
    </rs-card>
  </div>
</template>
