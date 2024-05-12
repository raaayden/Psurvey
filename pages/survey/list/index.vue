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

const optionDate = ref([
  {
    label: "Select Project Name to get the available dates",
    value: "",
  },
]);

const optionEntryExitCode = ref([
  {
    label: "Select Project Name to get the available entry exit code",
    value: "",
  },
]);

onMounted(async () => {
  if (filter.value.projectID) {
    await assignedDateOption(filter.value.projectID);
    await assignedEntryExitCodeOption(filter.value.projectID);
  }
});

watch(
  () => filter.value.projectID,
  async (value) => {
    if (value) {
      await assignedDateOption(value);
      await assignedEntryExitCodeOption(value);
    }
  },
  {
    deep: true,
  }
);

const assignedDateOption = async (projectId) => {
  const { data: dateList } = await useFetch("/api/survey/list/date", {
    method: "GET",
    params: {
      projectID: projectId,
    },
  });

  if (dateList.value.statusCode == 200) {
    optionDate.value = dateList.value.data;
  } else {
    optionDate.value = [
      {
        label: "No Date Available",
        value: "",
      },
    ];
  }
};

const assignedEntryExitCodeOption = async (projectId) => {
  const { data: entryExitCodeList } = await useFetch(
    "/api/survey/list/entry-exit-code",
    {
      method: "GET",
      params: {
        projectID: projectId,
        type: "select",
      },
    }
  );

  if (entryExitCodeList.value.statusCode == 200) {
    optionEntryExitCode.value = entryExitCodeList.value.data;
  } else {
    optionEntryExitCode.value = [
      {
        label: "No Entry Exit Code Available",
        value: "",
      },
    ];
  }
};

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
            :options="optionDate"
            type="select"
            label="Survey Date"
            help="Select Project Name first to get the available dates."
          />

          <FormKit
            v-model="filter.entryExitCode"
            :options="optionEntryExitCode"
            type="select"
            label="Entry Exit Code"
            help="Select Project Name first to get the available entry exit code."
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
