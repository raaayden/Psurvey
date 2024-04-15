<script setup>
  import axios from 'axios';
  import { saveAs } from 'file-saver';
  const { $swal } = useNuxtApp();
  definePageMeta({
    title: "List Data",
  });

  const { data: listParkings } = await useFetch("/api/psurvey/list-parking", {
    method: "GET",
  });

  async function generateReport() {
    try {
      const response = await useFetch("/api/psurvey/generate-pdf", {
        method: "POST",
      });

      console.log("response:", response);
      // console.log("response data:", response.data.value);

      if (response && response.status.value === "success" && response.data) {
        console.log("PDF data:", response.data.value.data); // Log the PDF data
        const pdfData = response.data.value.data;
        const pdfBlob = base64ToBlob(pdfData, 'application/pdf');
        saveAs(pdfBlob, 'parking_log_report.pdf');
      } else {
        console.error("Invalid response format:", response);
        throw new Error("Failed to generate report.");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      $swal.fire({
        title: 'Error!',
        text: 'Failed to generate report.',
        icon: 'error',
      });
    }
  };


  function base64ToBlob(base64Data, contentType) {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }

</script>
<template>
  <div>
    <LayoutsBreadcrumb />

    <rs-card class="p-5">
      <h3>List Parking Logs</h3>
      <br/>
      <rs-button @click="generateReport" variant="primary">Generate Report</rs-button>
      <rs-table
        v-if="listParkings && listParkings.data && listParkings.data.length > 0"
        :data="listParkings.data"
        :field="['Car Plate Number','Project','Time In','Time Out','Entry Exit Code','Parker Type']"
        :options="{
          variant: 'default',
          striped: true,
          borderless: true,
        }"
        :options-advanced="{
          sortable: true,
          responsive: true,
          fitlerable: false,
        }"
        advanced
      >
        <template v-slot: Action="data">
        </template>
      </rs-table>
    </rs-card>
  </div>
</template>
