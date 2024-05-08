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
  carPlate: "",
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

watch(
  () => form.value.projectID,
  async () => {
    if (form.value.projectID) {
      await getParkingSeasonByProject();
    }
  }
);

const getParkingSeasonByProject = async () => {
  const { data } = await useFetch(
    "/api/survey/parking-season/add-vehicle/list",
    {
      method: "GET",
      params: {
        projectID: form.value.projectID,
      },
    }
  );

  if (data.value.statusCode == 200) {
    optionsAvailableVehicle.value = data.value.data;
  }
};

const addSeasonParking = async () => {
  try {
    const { data } = await useFetch(
      "/api/survey/parking-season/add-vehicle/add",
      {
        method: "POST",
        body: {
          projectID: form.value.projectID,
          vehicleList: form.value.carPlate,
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
        <label
          class="formkit-label formkit-label-global formkit-outer-text"
          for="input_1"
        >
          Car Plate (Multiple Selection Allowed)
        </label>
        <v-select
          v-model="form.carPlate"
          name="country"
          :options="optionsAvailableVehicle"
          multiple
          taggable
          push-tags
        ></v-select>

        <div class="flex flex-wrap justify-start">
          <rs-button
            class="mt-5"
            btn-type="submit"
            :disabled="!form.projectName && form.carPlate.length == 0"
          >
            Save Vehicle
          </rs-button>
        </div>
      </FormKit>
    </rs-card>
  </div>
</template>
