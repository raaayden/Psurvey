<script setup>
definePageMeta({
  title: "Season Parking",
});

const { $swal } = useNuxtApp();

const qProjectName = useRoute().query.project_name;
const qDate = useRoute().query.date;

const fileData = ref(null);

const filter = ref({
  projectName: qProjectName || "",
  date: qDate || "",
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
  "/api/survey/report/season-parking/get",
  {
    method: "GET",
    query: {
      projectName: filter.value.projectName,
      date: filter.value.date,
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
    date: filter.value.date,
  };

  navigateTo({ query });
};

const exportReport = async () => {
  try {
    const { data } = await useFetch(
      "/api/survey/report/season-parking/export",
      {
        method: "POST",
        body: {
          projectName: filter.value.projectName,
          dateOfReport: reportData.value.dateOfReport,
          date: filter.value.date,
          seasonParkingList: reportData.value.seasonParkingList,
          totalVehicle: reportData.value.totalVehicle,
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
      const fileName = "season-parking.pdf";

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

        <!-- <FormKit v-model="filter.date" type="date" label="Date" /> -->

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
              <h3 class="underline">SEASON PARKING REPORT</h3>
              <h3>Page 1 of 1</h3>
            </div>
            <div class="grid grid-cols-5 gap-3 mb-8">
              <h6>Date of Report:</h6>
              <span class="col-span-4">{{ reportData.dateOfReport }}</span>
              <h6>Project Name:</h6>
              <span class="col-span-4">{{ reportData.projectName }}</span>
              <!-- <h6>Date:</h6>
              <span class="col-span-4">{{
                reportData.date
                  ? new Date(reportData.date).toLocaleDateString()
                  : "-"
              }}</span> -->
              <h6>Total Vehicle:</h6>
              <span class="col-span-4">{{ reportData.totalVehicle }}</span>
            </div>

            <rs-table
              v-if="
                reportData.seasonParkingList &&
                reportData.seasonParkingList.length > 0
              "
              :data="reportData.seasonParkingList"
            />
          </div>
        </div>
      </template>
    </rs-card>
  </div>
</template>
