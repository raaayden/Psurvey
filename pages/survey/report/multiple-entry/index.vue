<script setup>
import { DateTime } from "luxon";

definePageMeta({
  title: "Multiple Entry",
});

const { $swal } = useNuxtApp();

const qProjectName = useRoute().query.project_name;
const qDataType = useRoute().query.data_type;
const qParkerType = useRoute().query.parker_type;
const qSurveyDate = useRoute().query.survey_date;
const qSurveyTimeFrom = useRoute().query.survey_time_from;
const qSurveyTimeTo = useRoute().query.survey_time_to;
const qEntryNo = useRoute().query.entry_no;

const fileData = ref(null);

const filter = ref({
  projectName: qProjectName || "",
  dataType: qDataType || "",
  parkerType: qParkerType || "",
  surveyDate: qSurveyDate || "",
  surveyTimeFrom: qSurveyTimeFrom || "",
  surveyTimeTo: qSurveyTimeTo || "",
  entryNo: qEntryNo || "",
});

const projectOptions = ref(null);

const selectedVehicleNo = ref([]);

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
  "/api/survey/report/multiple-entry/get",
  {
    method: "GET",
    query: {
      projectName: filter.value.projectName,
      dataType: filter.value.dataType,
      parkerType: filter.value.parkerType,
      surveyDate: filter.value.surveyDate,
      surveyTimeFrom: filter.value.surveyTimeFrom,
      surveyTimeTo: filter.value.surveyTimeTo,
      entryNo: filter.value.entryNo,
    },
  }
);

if (matchingReport.value.statusCode == 200) {
  reportData.value = matchingReport.value.data;
  showReport.value = true;
}

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
    },
  });

  if (dateList.value.statusCode == 200) {
    optionDate.value = dateList.value.data;

    // Check if the query date is available in the list
    if (filter.value.surveyDate) {
      const isDateAvailable = optionDate.value.find(
        (date) => date.value == filter.value.surveyDate
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

const assignVehicleNo = (vehicleNo) => {
  if (selectedVehicleNo.value.includes(vehicleNo)) {
    selectedVehicleNo.value = selectedVehicleNo.value.filter(
      (item) => item !== vehicleNo
    );
  } else {
    selectedVehicleNo.value.push(vehicleNo);
  }
};

const submitFilter = async () => {
  const query = {
    project_name: filter.value.projectName,
    data_type: filter.value.dataType,
    parker_type: filter.value.parkerType,
    survey_date: filter.value.surveyDate,
    survey_time_from: filter.value.surveyTimeFrom,
    survey_time_to: filter.value.surveyTimeTo,
    entry_no: filter.value.entryNo,
  };

  navigateTo({ query });
};

const exportReport = async () => {
  try {
    const { data } = await useFetch(
      "/api/survey/report/multiple-entry/export",
      {
        method: "POST",
        body: {
          projectName: filter.value.projectName,
          dateOfReport: reportData.value.dateOfReport,
          dataType: filter.value.dataType,
          parkerType: filter.value.parkerType,
          surveyDate: reportData.value.surveyDate,
          surveyTimeFrom: reportData.value.surveyTimeFrom,
          surveyTimeTo: reportData.value.surveyTimeTo,
          multipleEntryList: reportData.value.multipleEntryList,
          totalVehicle: reportData.value.totalVehicle,
          entryNo: reportData.value.entryNo,
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
      const fileName = "multiple-entry.pdf";

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

const addSeasonParking = async (vehicleNoList) => {
  try {
    const { data } = await useFetch(
      "/api/survey/parking-season/add-vehicle/add",
      {
        method: "POST",
        body: {
          projectID: reportData.value.projectID,
          vehicleList: vehicleNoList,
        },
      }
    );

    if (data.value.statusCode == 200) {
      $swal.fire({
        icon: "success",
        title: "Success",
        text: "Vehicle has been added successfully",
      });
    } else {
      $swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add vehicle",
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
              label: 'Raw',
              value: '',
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
          <FormKit v-model="filter.surveyTimeFrom" type="time" label="From" />
          <FormKit v-model="filter.surveyTimeTo" type="time" label="To" />
        </div>

        <FormKit
          v-model="filter.entryNo"
          type="number"
          label="No. of Entry"
          validation="number|min:1"
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
        <div
          class="overflow-x-scroll flex items-center justify-center bg-gray-50 p-5"
        >
          <div class="border py-8 px-12 w-[794px] h-[1123px] bg-white">
            <div class="mt-4 mb-8 flex flex-col items-center justify-center">
              <h3 class="font-normal">First Parking</h3>
              <h3 class="underline">MULTIPLE ENTRY REPORT</h3>
              <h3>Page 1 of 1</h3>
            </div>
            <div class="grid grid-cols-5 gap-3 mb-8">
              <h6>Date of Report:</h6>
              <span class="col-span-4">{{ reportData.dateOfReport }}</span>
              <h6>Project Name:</h6>
              <span class="col-span-4">{{ reportData.projectName }}</span>
              <h6>Survey Date:</h6>
              <span class="col-span-4">{{
                reportData.surveyDate
                  ? DateTime.fromISO(reportData.surveyDate).toFormat(
                      "dd/MM/yyyy"
                    )
                  : "All"
              }}</span>
              <h6>Parker Type:</h6>
              <span class="col-span-4">{{
                reportData.parkerType ? reportData.parkerType : "All"
              }}</span>
              <h6>Time of Survey:</h6>
              <h6>From</h6>
              <span>
                {{
                  reportData.surveyTimeFrom ? reportData.surveyTimeFrom : "-"
                }}
              </span>
              <h6>To</h6>
              <span>
                {{ reportData.surveyTimeTo ? reportData.surveyTimeTo : "-" }}
              </span>

              <h6>No. of Entry:</h6>
              <span class="col-span-4">{{
                reportData.entryNo ? reportData.entryNo : "-"
              }}</span>

              <h6>Total Vehicle:</h6>
              <span class="col-span-4">{{
                reportData.totalVehicle ? reportData.totalVehicle : 0
              }}</span>
            </div>

            <div class="flex justify-end my-4 gap-2">
              <rs-button
                variant="primary"
                @click="addSeasonParking(selectedVehicleNo)"
                :disabled="selectedVehicleNo.length === 0"
              >
                <Icon name="ph:plus-circle" class="mr-1 !w-5 !h-5" />
                Add Selected Vehicle
              </rs-button>

              <rs-button
                variant="secondary"
                @click="
                  addSeasonParking(
                    reportData.multipleEntryList.map((item) => item.vehicleNo)
                  )
                "
              >
                <Icon name="ph:plus-circle" class="mr-1 !w-5 !h-5" />
                Add All Vehicle
              </rs-button>

              <rs-button
                variant="primary-outline"
                @click="selectedVehicleNo = []"
              >
                Reset
              </rs-button>
            </div>
            <NuxtScrollbar style="max-height: 580px">
              <rs-table
                v-if="
                  reportData.multipleEntryList &&
                  reportData.multipleEntryList.length > 0
                "
                :field="['select', 'vehicleNo', 'entryCount']"
                :data="reportData.multipleEntryList"
                advanced
              >
                <template v-slot:select="data">
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      class="w-5 h-5 accent-primary text-primary bg-gray-100 border-gray-200 rounded-lg focus:ring-primary cursor-pointer"
                      :checked="
                        selectedVehicleNo.includes(data.value.vehicleNo)
                      "
                      @change="assignVehicleNo(data.value.vehicleNo)"
                    />
                  </div>
                </template>
              </rs-table>
            </NuxtScrollbar>
          </div>
        </div>
      </template>
    </rs-card>
  </div>
</template>
