<script setup>
const emits = defineEmits(["update:modelValue"]);
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  projectList: {
    type: Object,
    default: () => ({}),
  },
});

const { $swal } = useNuxtApp();

const form = ref({
  projectID: "",
  file: null,
});

const optionsProjectList = ref(
  props.projectList.map((project) => {
    return {
      label: project.value ? project.label : "Select Project Name",
      value: project.value,
    };
  })
);
const optionsAvailableVehicle = ref([]);

const vehicleSeasonList = ref([]);

const onFileChange = (e) => {
  form.value.file = e.target.files[0];
};

const downloadSampleCSV = async () => {
  try {
    const { data } = await useFetch(
      "/api/survey/parking-season/add-vehicle/download-sample-csv",
      {
        method: "GET",
      }
    );

    if (data.value.statusCode == 200) {
      const linkSource = "data:text/csv;base64," + data.value.data;
      const downloadLink = document.createElement("a");
      downloadLink.href = linkSource;
      downloadLink.download = "sample.csv";
      downloadLink.click();

      $swal.fire({
        icon: "success",
        title: "Success",
        text: "Sample CSV has been downloaded",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const previewCSVData = async () => {
  try {
    const formData = new FormData();
    formData.append("project_id", form.value.projectID);
    formData.append("file", form.value.file);

    const { data } = await useFetch(
      "/api/survey/parking-season/add-vehicle/preview-csv",
      {
        method: "POST",
        body: formData,
      }
    );

    if (data.value.statusCode == 200) {
      $swal.fire({
        icon: "success",
        title: "Success",
        text: "Data has been retrieved successfully",
      });

      vehicleSeasonList.value = data.value.data;
    } else {
      $swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to preview data",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const addSeasonParking = async () => {
  try {
    let arrayPlate = [];

    vehicleSeasonList.value.forEach((vehicle) => {
      arrayPlate.push(vehicle.carPlateNumber);
    });

    const { data } = await useFetch(
      "/api/survey/parking-season/add-vehicle/add",
      {
        method: "POST",
        body: {
          projectID: form.value.projectID,
          vehicleList: arrayPlate,
        },
      }
    );

    if (data.value.statusCode == 200) {
      $swal.fire({
        icon: "success",
        title: "Success",
        text: "Vehicle has been added successfully",
      });

      navigateTo("/survey/parking-season");
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
    <rs-card class="p-5">
      <div class="flex flex-wrap justify-between gap-4 mb-2">
        <h4 class="font-medium">Form</h4>

        <rs-button variant="warning" @click="downloadSampleCSV">
          <Icon name="ph:download" class="mr-2" />
          Download Template
        </rs-button>
      </div>
      <FormKit type="form" :actions="false" @submit="previewCSVData">
        <FormKit
          v-model="form.projectID"
          type="select"
          name="projectName"
          label="Project Name"
          :options="optionsProjectList"
          validation="required"
        />

        <FormKit type="file" @change="onFileChange" accept=".csv" />

        <div class="flex flex-wrap justify-between mt-5 gap-4">
          <rs-button
            variant="primary-outline"
            btn-type="submit"
            :disabled="!form.projectName && !form.file"
          >
            Preview Data
          </rs-button>
        </div>
      </FormKit>
    </rs-card>

    <rs-card v-if="vehicleSeasonList && vehicleSeasonList.length > 0">
      <div class="flex justify-between p-5">
        <h4 class="font-medium">Preview Data CSV</h4>

        <div class="flex gap-3">
          <rs-button @click="addSeasonParking">
            <Icon name="ph:database-duotone" class="mr-1" />
            Save All Vehicle Parking Season
          </rs-button>
        </div>
      </div>
      <div class="pb-3 py-3">
        <rs-table
          :data="vehicleSeasonList"
          :key="vehicleSeasonList"
          :options-advanced="{
            sortable: true,
            responsive: true,
            filterable: false,
          }"
          :sort="{
            column: 'carPlateNumber',
            direction: 'asc',
          }"
          advanced
        />
      </div>
    </rs-card>
  </div>
</template>
