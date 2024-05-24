<script setup>
import graceList from "./grace.json";
import { DateTime } from "luxon";

definePageMeta({
  title: "Average Length of Stay",
});

const { $swal } = useNuxtApp();

const qProjectName = useRoute().query.project_name;
const qDataType = useRoute().query.data_type;
const qParkerType = useRoute().query.parker_type;
const qSurveyDate = useRoute().query.survey_date;
const qSurveyTimeFrom = useRoute().query.survey_time_from;
const qSurveyTimeTo = useRoute().query.survey_time_to;
const qGracePeriod = useRoute().query.grace_period;

const fileData = ref(null);

const filter = ref({
  projectName: qProjectName || "",
  dataType: qDataType || "",
  parkerType: qParkerType || "",
  surveyDate: qSurveyDate || "",
  surveyTimeFrom: qSurveyTimeFrom || "",
  surveyTimeTo: qSurveyTimeTo || "",
  gracePeriod: qGracePeriod || "",
});

const projectOptions = ref(null);
const gracePeriodOptions = ref(graceList);

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
} else {
  projectOptions.value = [
    {
      label: "No Project Available",
      value: "",
    },
  ];
}

const showReport = ref(false);
const reportData = ref(null);

const { data: matchingReport } = await useFetch(
  "/api/survey/report/average-length-of-stay/get",
  {
    method: "GET",
    query: {
      projectName: filter.value.projectName,
      dataType: filter.value.dataType,
      parkerType: filter.value.parkerType,
      surveyDate: filter.value.surveyDate,
      surveyTimeFrom: filter.value.surveyTimeFrom,
      surveyTimeTo: filter.value.surveyTimeTo,
      gracePeriod: filter.value.gracePeriod,
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
    survey_date: filter.value.surveyDate,
    survey_time_from: filter.value.surveyTimeFrom,
    survey_time_to: filter.value.surveyTimeTo,
    grace_period: filter.value.gracePeriod,
  };

  navigateTo({ query });
};

// const computedSurveyDateFrom = computed(() => {
//   return filter.value.surveyTimeFrom
//     ? DateTime.fromISO(filter.value.surveyTimeFrom).toFormat("yyyy-MM-dd")
//     : "";
// });

// const computedSurveyDateTo = computed(() => {
//   return filter.value.surveyTimeTo
//     ? DateTime.fromISO(filter.value.surveyTimeTo).toFormat("yyyy-MM-dd")
//     : "";
// });

const optionDate = ref([
  {
    label: "Select Project Name to get the available dates",
    value: "",
  },
]);

onMounted(async () => {
  if (filter.value.projectName) {
    await assignedDateOption(filter.value.projectName);
  }
});

watch(
  () => filter.value.projectName,
  async (value) => {
    if (value) {
      await assignedDateOption(value);
    }
  },
  {
    deep: true,
  }
);

const assignedDateOption = async (name) => {
  const { data: dateList } = await useFetch("/api/survey/list/date", {
    method: "GET",
    params: {
      projectName: name,
      type: "select",
    },
  });

  if (dateList.value.statusCode == 200) {
    optionDate.value = dateList.value.data;

    // Check if the query date is available in the list
    if (qSurveyDate) {
      const isDateAvailable = optionDate.value.find(
        (date) => date.value == qSurveyDate
      );

      if (!isDateAvailable) {
        filter.value.surveyDate = "";
      }
    }
  } else {
    optionDate.value = [
      {
        label: "No Date Available",
        value: "",
      },
    ];
  }
};

const exportReport = async () => {
  try {
    const { data } = await useFetch(
      "/api/survey/report/average-length-of-stay/export",
      {
        method: "POST",
        body: {
          projectName: filter.value.projectName,
          dateOfReport: reportData.value.dateOfReport,
          dataType: filter.value.dataType,
          parkerType: filter.value.parkerType,
          surveyDate: filter.value.surveyDate,
          surveyTimeFrom: filter.value.surveyTimeFrom,
          surveyTimeTo: filter.value.surveyTimeTo,
          gracePeriod: filter.value.gracePeriod,
          alsList: reportData.value.alsList,
          totalVehicle: reportData.value.totalVehicle,
          gracePeriodVolume: reportData.value.gracePeriodVolume,
          grandTotalVolume: reportData.value.grandTotalVolume,
          averageALS: reportData.value.averageALS,
          totalAllALSHours: reportData.value.totalAllALSHours,
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
          v-model="filter.surveyDate"
          :options="optionDate"
          type="select"
          label="Survey Date"
          help="Select Project Name first to get the available dates."
          validation="required"
        />

        <!-- <FormKit
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
        /> -->
        <label class="formkit-label formkit-label-global formkit-outer-text">
          Time of Survey
        </label>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormKit v-model="filter.surveyTimeFrom" type="time" label="From" />
          <FormKit v-model="filter.surveyTimeTo" type="time" label="To" />
        </div>

        <FormKit
          v-model="filter.gracePeriod"
          type="select"
          label="Grace Period (Hours)"
          :options="gracePeriodOptions"
        />

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
            <span class="text-base font-semibold">Total Vehicle:</span>
            <span class="text-lg">
              {{ reportData.totalVehicle }}
            </span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-base font-semibold">Grace Period Volume:</span>
            <span class="text-lg">
              {{ reportData.gracePeriodVolume }}
            </span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-base font-semibold">Grand Total of Volume:</span>
            <span class="text-lg">
              {{ reportData.grandTotalVolume }}
            </span>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-base font-semibold">Average ALS (hh:mm):</span>
            <span class="text-lg">
              {{ reportData.averageALS }}
            </span>
          </div>
        </div>

        <rs-table
          v-if="reportData.alsList && reportData.alsList.length > 0"
          :data="reportData.alsList"
          :field="[
            'Length Of Stay',
            'Volume',
            'Total Average Length Of Stay Volume',
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
