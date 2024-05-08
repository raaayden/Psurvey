<script setup>
definePageMeta({
  title: "List of Surveys",
});

const { $swal } = useNuxtApp();
const fileData = ref(null);

const projectID = useRoute().query.project_id;
const surveyDate = useRoute().query.survey_date;
const entryExitCode = useRoute().query.entry_exit_code;

const optionProject = ref([
  {
    label: "Select Project Name",
    value: "",
  },
]);
const optionProjectValue = ref(null);

const filter = ref({
  projectID: projectID ? projectID : "",
  surveyDate: surveyDate ? surveyDate : "",
  entryExitCode: entryExitCode ? entryExitCode : "",
});

const { data: projectList } = await useFetch("/api/survey/project/list-name", {
  method: "GET",
});

if (projectList.value.statusCode == 200) {
  // optionProject.value = projectList.value.data;

  projectList.value.data.forEach((project) => {
    optionProject.value.push({
      label: project.project_name,
      value: project.project_id,
    });
  });
}

const optionDate = ref([]);

const { data: dateList } = await useFetch("/api/survey/list/date", {
  method: "GET",
});

if (dateList.value.statusCode == 200) {
  optionDate.value = dateList.value.data;
}

const { data: surveyList } = await useFetch("/api/survey/list/get", {
  method: "GET",
  params: {
    projectID: projectID,
    surveyDate: surveyDate,
    entryExitCode: entryExitCode,
  },
});

if (surveyList.value.statusCode == 200) {
  fileData.value = surveyList.value.data;
}

const submitFilter = () => {
  const query = {
    project_id: filter.value.projectID,
    survey_date: filter.value.surveyDate,
    entry_exit_code: filter.value.entryExitCode,
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
        <FormKit type="form" :actions="false" @submit="submitFilter">
          <FormKit
            v-model="filter.projectID"
            type="select"
            label="Project Name"
            :options="optionProject"
            validation="required"
          />

          <FormKit
            v-model="filter.surveyDate"
            type="select"
            label="Survey Date"
            :options="optionDate"
          />

          <FormKit
            v-model="filter.entryExitCode"
            type="text"
            label="Entry Exit Code"
          />

          <rs-button btn-type="submit"> Fetch Data </rs-button>
        </FormKit>
      </template>
    </rs-card>

    <rs-card>
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
        <div v-else>
          <span
            class="text-sm text-gray-500 flex justify-center items-center mt-5"
          >
            - No survey list found for the selected filter -
          </span>
        </div>
      </template>
    </rs-card>
  </div>
</template>
