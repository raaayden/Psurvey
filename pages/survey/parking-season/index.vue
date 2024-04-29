<script setup>
definePageMeta({
  title: "Parking Season Configuration",
});

const { $swal } = useNuxtApp();
const seasonParkingList = ref([]);
const isAllInactive = ref(false);

const ruleId = ref(null);
const averageLengthStay = ref(null);
const multipleEntryPeriod = ref(null);
const status = ref(null);

const averageLengthStayOptions = ref([
  0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60,
]);

const showAddModal = ref(false);

const { data: parkingSeason } = await useFetch(
  "/api/survey/parking-season/get-rule",
  {
    method: "GET",
  }
);

if (parkingSeason.value.statusCode == 200) {
  ruleId.value = parkingSeason.value.data.ruleID;
  averageLengthStay.value = parkingSeason.value.data.alsPeriod;
  multipleEntryPeriod.value = parkingSeason.value.data.multipleEntryPeriod;
  status.value = parkingSeason.value.data.status;
}

const getVehicleList = async () => {
  const { data } = await useFetch("/api/survey/parking-season/list", {
    method: "GET",
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

const vehicleValue = ref([]);
const optionsAvailableVehicle = ref([]);

const openAddModal = async () => {
  const { data } = await useFetch("/api/survey/parking-season/vehicle/list", {
    method: "GET",
  });

  if (data.value.statusCode == 200) {
    optionsAvailableVehicle.value = data.value.data;
  }

  showAddModal.value = true;
};

const addSeasonParking = async () => {
  try {
    const { data } = await useFetch("/api/survey/parking-season/vehicle/add", {
      method: "POST",
      body: {
        vehicle: vehicleValue.value,
      },
    });

    if (data.value.statusCode == 200) {
      $swal.fire({
        icon: "success",
        title: "Success",
        text: "Vehicle has been added successfully",
      });

      await getVehicleList();
      showAddModal.value = false;
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

const updateStatusParkingSeason = async (id, status) => {
  try {
    const { data } = await useFetch(
      `/api/survey/parking-season/vehicle/update-status`,
      {
        method: "POST",
        body: {
          seasonId: id,
          status: status,
        },
      }
    );

    if (data.value.statusCode == 200) {
      $swal.fire({
        icon: "success",
        title: "Success",
        text: "Vehicle status has been updated successfully",
      });
    } else {
      $swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update vehicle status",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const setAllStatus = async () => {
  try {
    $swal
      .fire({
        title: "Are you sure?",
        text: `You want to ${
          isAllInactive ? "Active" : "Inactive"
        } all parking season vehicle status`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
      })
      .then(async (result) => {
        if (result.isConfirmed) {
          const { data } = await useFetch(
            `/api/survey/parking-season/vehicle/set-all-status`,
            {
              method: "POST",
              body: {
                status: isAllInactive.value ? "ACTIVE" : "INACTIVE",
              },
            }
          );

          if (data.value.statusCode == 200) {
            $swal.fire({
              icon: "success",
              title: "Success",
              text: "All vehicle status has been updated successfully",
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
      <template #header> Adjusted Data Rules </template>
      <template #body>
        <FormKit type="form" :actions="false" @submit="saveSeasonRule">
          <div class="grid grid-cols-3 gap-5">
            <FormKit
              v-model="averageLengthStay"
              :options="averageLengthStayOptions"
              type="select"
              label="Average Length of Stay Period"
              validation="required|number|min:0|max:60"
            />
            <FormKit
              v-model="multipleEntryPeriod"
              type="number"
              label="Multiple Entry Period"
              validation="required|number|min:1|max:1000"
            />
            <FormKit
              v-model="status"
              type="select"
              label="Status"
              name="status"
              :options="['ACTIVE', 'INACTIVE']"
            />
          </div>

          <rs-button btn-type="submit"> Save Rules </rs-button>
        </FormKit>
      </template>
    </rs-card>

    <rs-card>
      <div class="flex justify-between p-5">
        <h4 class="font-medium">Season Parking Vehicle</h4>

        <div class="flex gap-3">
          <rs-button @click="openAddModal">
            <Icon name="ph:plus" class="mr-1" />
            Add Vehicle
          </rs-button>
          <rs-button variant="primary-outline" @click="setAllStatus">
            <Icon
              v-if="!isAllInactive"
              name="ph:x-square-duotone"
              class="mr-1"
            />
            <Icon v-else name="ph:check-square-duotone" class="mr-1" />
            {{ isAllInactive ? "Active" : "Inactive" }} All
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
            column: 'createdAt',
            direction: 'desc',
          }"
          advanced
        >
          <template v-slot:status="data">
            <FormKit
              type="select"
              :classes="{
                outer: 'mb-0',
              }"
              v-model="data.text.status"
              @change="
                updateStatusParkingSeason(data.text.id, data.text.status)
              "
              :options="['ACTIVE', 'INACTIVE']"
            />
          </template>
        </rs-table>
        <div v-else>
          <p class="text-center text-gray-500">- No data found -</p>
        </div>
      </div>
    </rs-card>

    <rs-modal v-model="showAddModal" title="Add Vehicle" size="lg">
      <template #body>
        <div class="h-[400px]">
          <label
            class="formkit-label formkit-label-global formkit-outer-text"
            for="input_1"
          >
            Select Vehicle Number (Multiple Selection Allowed)
          </label>
          <v-select
            v-model="vehicleValue"
            name="country"
            :options="optionsAvailableVehicle"
            multiple
          ></v-select>

          <rs-button class="mt-4" @click="addSeasonParking">
            Add Vehicle
          </rs-button>
        </div>
      </template>
      <template #footer> </template>
    </rs-modal>
  </div>
</template>
