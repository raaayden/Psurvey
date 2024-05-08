<script setup>
definePageMeta({
  title: "Parking Season Vehicle",
});

const { $swal } = useNuxtApp();

const optionProject = ref([
  {
    label: "All Projects",
    value: "",
  },
]);

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

const addVehicleSeasonType = ref("single_entry");
const optionAddVehicleSeasonType = ref([
  {
    label: "Single Entry",
    value: "single_entry",
  },
  {
    label: "Upload CSV",
    value: "upload_csv",
  },
  {
    label: "ALS Hour",
    value: "als_hour",
  },
]);
</script>

<template>
  <div>
    <LayoutsBreadcrumb />

    <rs-card class="p-5">
      <header class="card-header !px-0 !pt-0 !pb-4">
        Category to Add Vehicle Season
      </header>

      <FormKit
        v-model="addVehicleSeasonType"
        type="radio"
        label="Category"
        :options="optionAddVehicleSeasonType"
        :classes="{
          fieldset: 'border-0 !p-0',
          legend: '!font-semibold !text-sm mb-0',
          options: '!flex !flex-row gap-4 mt-3',
          outer: 'mb-0',
        }"
      />
    </rs-card>

    <SeasonSingleEntry
      v-if="addVehicleSeasonType === 'single_entry'"
      :projectList="optionProject"
    />
    <SeasonUploadCSV
      v-else-if="addVehicleSeasonType === 'upload_csv'"
      :projectList="optionProject"
    />
    <SeasonALSHour
      v-else-if="addVehicleSeasonType === 'als_hour'"
      :projectList="optionProject"
    />
  </div>
</template>
