<script setup>
  import { useFetch } from '@vueuse/core';
  import { ref } from 'vue';
  import axios from 'axios';
  definePageMeta({
    title: "Add data",
  });

  const { $swal } = useNuxtApp();
  
  const form = ref({
    car_plate_no: "",
    project: "",
    time_in: "",
    time_out: "",
    exit_code: "",
    parker_type: "",
  });

  async function submit() {
    try{

      const body  = {
        car_plate_no: form.value.car_plate_no,
        project: form.value.project,
        time_in: form.value.time_in,
        time_out: form.value.time_out,
        exit_code: form.value.exit_code,
        parker_type: form.value.parker_type,
      }

      const{ data } = await useFetch("/api/psurvey/add-parking", {
        method: "POST",
        body: body
      });

      console.log(data.value);

      if(data.value.statusCode == 200) {
        $swal.fire({
          title: "Success",
          text: data.value.message,
          icon: "success",
          confirmButtonText: "Ok",
        });
      } else {
        $swal.fire({
          title: "Error",
          text: data.value.message,
          icon: "error",
          confirmButtonText: "Ok",
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  const complete = ref(false);
  async function handleSubmit(data) {
    const body = new FormData();
    data.parking_csv.forEach((fileItem) => {
      body.append('parking_csv', fileItem.file)
    })

    const res = await useFetch('/api/upload_file', {
      method: 'POST',
      body: body
    });

    if (res.ok) {
      complete.value = true
    } else {
      setErrors('uploadCSV', ['The server didn’t like our request.'])
    }

  }

  
  const fileInput = ref(null);

  function handleFileChange(event) {
    const file = event.target.files[0];
    fileInput.value = file;
  }

  async function uploadCSV() {
    const formData = new FormData();
    formData.append('csvFile', fileInput.value);

    try {
      const response = await axios.post('/api/upload_file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('CSV uploaded:', response.data);
      // Handle response data as needed
    } catch (error) {
      console.error('Error uploading CSV:', error);
      // Handle error
    }
  }



</script>
<template>
  <div>
    <LayoutsBreadcrumb />

    <rs-card class="p-5">
      <h3>Add a Parking</h3>
      <br/>
      <FormKit
        type="form"
        submit-label="Save"
        @submit="submit"
      >
        <FormKit
          v-model="form.car_plate_no"
          type="text"
          name="car_plate_no"
          label="Plate No"
          validation="required"
        />
        <FormKit
          v-model="form.project"
          type="text"
          name="project"
          label="Location"
          validation="required"
        />
        <FormKit
          v-model="form.time_in"
          type="datetime-local"
          name="time_in"
          label="Time In"
          validation="required"
        />
        <FormKit
          v-model="form.time_out"
          type="datetime-local"
          name="time_out"
          label="Time Out"
          validation="required|date_after"
        />
        <FormKit
          v-model="form.exit_code"
          type="select"
          name="exit_code"
          label="Exit Code"
          validation="required"
          :options="[
            'Please Select',
            'AWT',
            'AWL',
            'TRY',
          ]"
        />
        <FormKit
          v-model="form.parker_type"
          type="select"
          name="parker_type"
          label="Parker Type"
          validation="required"
          :options="[
            'Please Select',
            'CASUAL',
            'SEASONAL',
          ]"
        />
      </FormKit>
    </rs-card>

    <!-- <rs-card class="p-5">
      <h3>Upload CSV</h3>
      <br />
      <FormKit 
        v-if="!complete" 
        id="uploadCSV"
        type="form"
        @submit="handleSubmit">
        <FormKit
          type="file"
          label="Parking Data"
          name="parking_csv"
          help="Please upload one csv file at a time"
          accept=".csv"
          validation="required"
          enctype="multipart/form-data"
        />  
      </FormKit>
      <div v-else class="complete">Upload complete 👍</div>
    </rs-card> -->
    
    <rs-card class="p-5">
      <h3>Upload CSV</h3>
      <br />
      <form @submit.prevent="uploadCSV">
        <input type="file" name="csvFile" accept=".csv" @change="handleFileChange">
        <button type="submit">Upload CSV</button>
      </form>
    </rs-card>

  </div>
</template>
      