<script setup>
definePageMeta({
  title: "Vehicle Movement & Bay Utilization",
});

const { $swal } = useNuxtApp();

const qProjectName = useRoute().query.project_name;
const qDataType = useRoute().query.data_type;
const qParkerType = useRoute().query.parker_type;
const qSurveyDateFrom = useRoute().query.survey_date_from;
const qSurveyDateTo = useRoute().query.survey_date_to;

const fileData = ref(null);

const filter = ref({
  projectName: qProjectName || "",
  dataType: qDataType || "",
  parkerType: qParkerType || "",
  surveyDateFrom: qSurveyDateFrom || "",
  surveyDateTo: qSurveyDateTo || "",
});

const projectOptions = ref(null);

const { data: projectList } = await useFetch(
  "/api/survey/report/filter/project-list",
  {
    method: "GET",
  }
);

if (projectList.value.statusCode == 200) {
  projectOptions.value = projectList.value.data;

  projectOptions.value.unshift({
    label: "Select Project Name",
    value: "",
  });
}

const showReport = ref(false);
const reportData = ref(null);

const { data: matchingReport } = await useFetch(
  "/api/survey/report/vehicle-movement-bay-utilization/get",
  {
    method: "GET",
    query: {
      projectName: filter.value.projectName,
      dataType: filter.value.dataType,
      parkerType: filter.value.parkerType,
      surveyDateFrom: filter.value.surveyDateFrom,
      surveyDateTo: filter.value.surveyDateTo,
    },
  }
);

if (matchingReport.value.statusCode == 200) {
  reportData.value = matchingReport.value.data;
  showReport.value = true;
}

const submitFilter = async () => {
  const query = {
    project_name: filter.value.projectName,
    data_type: filter.value.dataType,
    parker_type: filter.value.parkerType,
    survey_date_from: filter.value.surveyDateFrom,
    survey_date_to: filter.value.surveyDateTo,
  };

  navigateTo({ query });
};

const exportReport = async () => {
  try {
    const { data } = await useFetch(
      "/api/survey/report/vehicle-movement-bay-utilization/export",
      {
        method: "POST",
        body: {
          projectName: filter.value.projectName,
          dateOfReport: reportData.value.dateOfReport,
          dataType: filter.value.dataType,
          parkerType: filter.value.parkerType,
          surveyDateFrom: filter.value.surveyDateFrom,
          surveyDateTo: filter.value.surveyDateTo,
          alsList: reportData.value.alsList,
          totalAllALSHours: reportData.value.totalAllALSHours,
          totalVolume: reportData.value.totalVolume,
          averageALS: reportData.value.averageALS,
        },
      }
    );

    if (data.value.statusCode == 200) {
      $swal.fire({
        title: "Success",
        text: "File exported successfully",
        icon: "success",
      });

      const linkSource = `data:application/pdf;base64,${data.value.data}`;
      const downloadLink = document.createElement("a");
      const fileName = "average-length-stay.pdf";

      if (!downloadLink) return;

      downloadLink.href = linkSource;
      downloadLink.download = fileName;
      downloadLink.click();
    } else {
      $swal.fire({
        title: "Error",
        text: data.value.message,
        icon: "error",
      });
    }
  } catch (error) {
    console.log(error);
  }
};
</script>

<template>
  <div>
    <LayoutsBreadcrumb />

    <rs-card class="p-5">
      <h4 class="mb-4">Filter</h4>

      <FormKit type="form" :actions="false" @submit="submitFilter">
        <FormKit
          v-model="filter.projectName"
          type="select"
          label="Project Name"
          :options="projectOptions"
          validation="required"
        />

        <FormKit
          v-model="filter.dataType"
          type="radio"
          label="Data Type"
          :classes="{
            fieldset: 'border-0 !p-0',
            legend: '!font-semibold !text-sm mb-0',
            options: '!flex !flex-row gap-4 mt-3',
          }"
          :options="[
            {
              label: 'All',
              value: '',
            },
            {
              label: 'Raw',
              value: 'RAW',
            },
            {
              label: 'Adjusted',
              value: 'ADJUSTED',
            },
          ]"
        />

        <FormKit
          v-model="filter.parkerType"
          type="radio"
          label="Parker Type"
          :classes="{
            fieldset: 'border-0 !p-0',
            legend: '!font-semibold !text-sm mb-0',
            options: '!flex !flex-row gap-4 mt-3',
          }"
          :options="[
            {
              label: 'All',
              value: '',
            },
            {
              label: 'Casual',
              value: 'CASUAL',
            },
            {
              label: 'Season',
              value: 'SEASON',
            },
          ]"
        />
        <label class="formkit-label formkit-label-global formkit-outer-text">
          Time of Survey
        </label>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormKit
            v-model="filter.surveyDateFrom"
            type="datetime-local"
            label="From"
            :validation="`date_before:${filter.surveyDateTo}`"
          />
          <FormKit
            v-model="filter.surveyDateTo"
            type="datetime-local"
            label="To"
            :validation="`date_after:${filter.surveyDateFrom}`"
          />
        </div>

        <div class="flex items-center mt-2">
          <rs-button btn-type="submit"> Filter Report </rs-button>
          <rs-button
            variant="primary-outline"
            class="ml-2"
            @click="navigateTo({ query: {} })"
          >
            Reset
          </rs-button>
        </div>
      </FormKit>
    </rs-card>

    <rs-card v-if="reportData">
      <template #header>
        <div class="flex justify-between">
          <span>Report</span>
          <div class="flex justify-end gap-5 mb-8">
            <rs-button variant="danger" @click="exportReport">
              <Icon name="vscode-icons:file-type-pdf2" class="mr-2" />
              Export PDF
            </rs-button>
          </div>
        </div>
      </template>
      <template #body>
        <div class="border p-5 rounded-lg bg-secondary text-white">
          <div class="flex items-center gap-3">
            <span class="text-base font-semibold">Grand Total of Volume:</span>
            <span class="text-lg">
              {{ reportData.totalVolume }}
            </span>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-base font-semibold">Average ALS:</span>
            <span class="text-lg">
              {{ reportData.averageALS }}
            </span>
          </div>
        </div>

        <rs-table
          v-if="reportData.vmbuList && reportData.vmbuList.length > 0"
          :data="reportData.vmbuList"
          :field="[
            'No',
            'Date',
            'From Time',
            'To Time',
            'Car Entry',
            'Car Exit',
            'Car In Park',
          ]"
          :options="{
            variant: 'default',
            striped: true,
            borderless: true,
          }"
          :page-size="100"
          advanced
        >
        </rs-table>
      </template>
    </rs-card>
  </div>
</template>