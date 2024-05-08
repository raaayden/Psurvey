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
      <FormKit type="form" :actions="false" @submit="addSeasonParking">
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
          type="date"
          name="surveyDate"
          label="Survey Date"
          validation="required"
        />

        <FormKit
          v-model="form.ALSHour"
          type="select"
          name="ALSHour"
          label="ALS Hour"
          :options="optionsALSHour"
          validation="required"
        />

        <div class="flex flex-wrap justify-start">
          <rs-button
            class="mt-5"
            btn-type="submit"
            :disabled="!form.projectName"
          >
            Get Filter Data
          </rs-button>
        </div>
      </FormKit>
    </rs-card>
  </div>
</template>
