<script setup>
definePageMeta({
  title: "Parking Season Configuration",
});

const { $swal } = useNuxtApp();
const seasonParkingList = ref([]);
const isAllInactive = ref(false);

const showAddModal = ref(false);

const projectID = useRoute().query.project_id;

const filter = ref({
  projectID: projectID ? projectID : "",
});

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

const getVehicleList = async () => {
  seasonParkingList.value = [];

  const { data } = await useFetch("/api/survey/parking-season/list", {
    method: "GET",
    params: {
      projectID: filter.value.projectID,
    },
  });

  if (data.value.statusCode == 200) {
    seasonParkingList.value = data.value.data.parkingSeasonList;
    isAllInactive.value = data.value.data.isAllInactive;
  }
};

await getVehicleList();

const saveSeasonRule = async () => {
  try {
    const { data } = await useFetch("/api/survey/parking-season/rule/edit", {
      method: "POST",
      body: {
        ruleID: ruleId.value,
        alsPeriod: averageLengthStay.value,
        multipleEntryPeriod: multipleEntryPeriod.value,
        status: status.value,
      },
    });

    if (data.value.statusCode == 200) {
      $swal.fire({
        icon: "success",
        title: "Success",
        text: "Season Rule has been saved successfully",
      });
    } else {
      $swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save season rule",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const submitFilter = async () => {
  const query = {
    project_id: filter.value.projectID,
  };

  navigateTo({ query });
};

const openAddModal = async () => {
  showAddModal.value = true;
};

const deleteSeasonVehicle = async (id) => {
  try {
    $swal
      .fire({
        title: "Are you sure?",
        text: "You want to delete this vehicle season data?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
      })
      .then(async (result) => {
        if (result.isConfirmed) {
          const { data } = await useFetch(
            `/api/survey/parking-season/vehicle/delete`,
            {
              method: "POST",
              body: {
                parkingSeasonID: id,
              },
            }
          );

          if (data.value.statusCode == 200) {
            $swal.fire({
              icon: "success",
              title: "Success",
              text: "Vehicle Season has been deleted successfully",
            });

            await getVehicleList();
          } else {
            $swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to update vehicle status",
            });
          }
        }
      });
  } catch (error) {
    console.log(error);
  }
};

const deleteAllSeasonVehicle = async () => {
  try {
    $swal
      .fire({
        title: "Are you sure?",
        text: "You want to delete all season parking vehicle data?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
      })
      .then(async (result) => {
        if (result.isConfirmed) {
          const { data } = await useFetch(
            `/api/survey/parking-season/vehicle/delete-all`,
            {
              method: "POST",
            }
          );

          if (data.value.statusCode == 200) {
            $swal.fire({
              icon: "success",
              title: "Success",
              text: "All vehicle has been deleted successfully",
            });

            await getVehicleList();
          } else {
            $swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to update all vehicle status",
            });
          }
        }
      });
  } catch (error) {
    console.log(error);
  }
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
          />

          <rs-button btn-type="submit"> Fetch Data </rs-button>
        </FormKit>
      </template>
    </rs-card>

    <rs-card>
      <div class="flex justify-between p-5">
        <h4 class="font-medium">Season Parking Vehicle</h4>

        <div class="flex gap-3">
          <NuxtLink to="/survey/parking-season/add-vehicle">
            <rs-button>
              <Icon name="ph:plus" class="mr-1" />
              Add Vehicle
            </rs-button>
          </NuxtLink>
          <rs-button
            v-if="seasonParkingList && seasonParkingList.length > 0"
            variant="primary-outline"
            @click="deleteAllSeasonVehicle"
          >
            <Icon name="ph:trash-simple-duotone" class="mr-1" />
            Delete All Vehicle
          </rs-button>
        </div>
      </div>

      <div class="pb-3 py-3">
        <rs-table
          v-if="seasonParkingList && seasonParkingList.length > 0"
          :key="seasonParkingList"
          :data="seasonParkingList"
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
        >
          <template v-slot:action="data">
            <rs-button
              variant="primary-text"
              @click="deleteSeasonVehicle(data.text.id)"
            >
              <Icon name="ph:trash-simple-duotone" class="!w-4 !h-4" />
            </rs-button>
          </template>
        </rs-table>
        <div v-else>
          <p class="text-center text-gray-500">
            - Parking season vehicle not found -
          </p>
        </div>
      </div>
    </rs-card>
  </div>
</template>
