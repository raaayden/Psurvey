<script setup>
import hourOpt from "./hour.json";

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
  surveyDate: "",
  ALSHour: "",
});

const optionsALSHour = ref(hourOpt);

const optionsProjectList = ref(
  props.projectList.map((project) => {
    return {
      label: project.value ? project.label : "Select Project Name",
      value: project.value,
    };
  })
);

const optionDate = ref([]);

onMounted(async () => {
  if (form.value.projectID) {
    await assignedDateOption(form.value.projectID);
  }
});

watch(
  () => form.value.projectID,
  async (value) => {
    if (value) {
      await assignedDateOption(value);
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
  }
};

const vehicleSeasonList = ref([]);

const previewFilteredData = async () => {
  try {
    const { data } = await useFetch(
      "/api/survey/parking-season/add-vehicle/preview-data",
      {
        method: "GET",
        params: {
          projectID: form.value.projectID,
          surveyDate: form.value.surveyDate,
          ALSHour: form.value.ALSHour,
        },
      }
    );

    if (data.value.statusCode == 200) {
      $swal.fire({
        icon: "success",
        title: "Success",
        text: "Data has been filtered successfully",
      });

      vehicleSeasonList.value = data.value.data;
    } else {
      $swal.fire({
        icon: "error",
        title: "Error",
        text: data.value.message,
      });
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};

const addSeasonParking = async () => {
  try {
    const { data } = await useFetch("/api/survey/parking-season/vehicle/add", {
      method: "POST",
      body: {
        projectID: form.value.projectID,
      },
    });

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
      <div class="flex flex-wrap justify-between gap-4 mb-5">
        <h4 class="font-medium">Form</h4>
      </div>
      <FormKit type="form" :actions="false" @submit="previewFilteredData">
        <FormKit
          v-model="form.projectID"
          type="select"
          name="projectName"
          label="Project Name"
          :options="optionsProjectList"
          validation="required"
          help="Select project name first to see available vehicle plate number"
        />

        <FormKit
          v-model="form.surveyDate"
          :options="optionDate"
          type="select"
          label="Survey Date"
          help="Select Project Name first to get the available dates."
        />

        <FormKit
          v-model="form.ALSHour"
          type="select"
          name="ALSHour"
          label="Min ALS Hour"
          :options="optionsALSHour"
        />

        <div class="flex flex-wrap justify-start">
          <rs-button class="mt-5" btn-type="submit" :disabled="!form.projectID">
            Preview Filtered Data
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
