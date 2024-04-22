<script setup>
definePageMeta({
  title: "Parking Prototype Survey",
});

const { $swal } = useNuxtApp();
const file = ref(null);

const fileData = ref(null);

const onFileChange = (e) => {
  file.value = e.target.files[0];
};

const uploadFile = async () => {
  try {
    const formData = new FormData();
    formData.append("file", file.value);

    const { data } = await useFetch("/api/psurvey/prototype/import", {
      method: "POST",
      body: formData,
    });

    if (data.value.statusCode == 200) {
      $swal.fire({
        title: "Success",
        text: "File uploaded successfully",
        icon: "success",
      });

      fileData.value = data.value.data;
    } else {
      $swal.fire({
        title: "Error",
        text: data.value.message,
        icon: "error",
      });
    }
  } catch (error) {
    console.error(error);
  }
};

const exportReport = async (type) => {
  try {
    if (!fileData.value) {
      $swal.fire({
        title: "Error",
        text: "No data to export",
        icon: "error",
      });
      return;
    }

    const { data } = await useFetch("/api/psurvey/prototype/export", {
      method: "POST",
      body: {
        data: fileData.value,
        type: type,
      },
    });

    if (data.value.statusCode == 200) {
      $swal.fire({
        title: "Success",
        text: "File exported successfully",
        icon: "success",
      });

      if (!data.value.data) return;

      let linkSource = "";
      let downloadLink = "";
      let fileName = "";

      if (type == "excel") {
        //   From base64 to file download
        linkSource = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.value.data}`;
        downloadLink = document.createElement("a");
        fileName = "report.csv";
      } else if (type == "pdf") {
        //   From base64 to file download
        linkSource = `data:application/pdf;base64,${data.value.data}`;
        downloadLink = document.createElement("a");
        fileName = "report.pdf";
      } else if (type == "pdf-table") {
        linkSource = `data:application/pdf;base64,${data.value.data}`;
        downloadLink = document.createElement("a");
        fileName = "report-table.pdf";
      }

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
    console.error(error);
  }
};
</script>
<template>
  <div>
    <LayoutsBreadcrumb />

    <rs-card>
      <template #header> Import CSV </template>
      <template #body>
        <FormKit type="form" :actions="true" @submit="uploadFile">
          <FormKit type="file" @change="onFileChange" accept=".csv" />
        </FormKit>
      </template>
    </rs-card>

    <rs-card v-if="fileData && fileData.length > 0">
      <template #header> CSV Data </template>
      <template #body>
        <div class="flex justify-end gap-5 mb-8">
          <rs-button variant="danger" @click="exportReport('pdf')">
            <Icon name="vscode-icons:file-type-pdf2" class="mr-2" />
            Export PDF
          </rs-button>

          <rs-button variant="danger" @click="exportReport('pdf-table')">
            <Icon name="vscode-icons:file-type-pdf2" class="mr-2" />
            Export PDF Table
          </rs-button>

          <rs-button variant="success" @click="exportReport('excel')">
            <Icon name="vscode-icons:file-type-excel2" class="mr-2" />
            Export Excel
          </rs-button>
        </div>

        <rs-table
          v-if="fileData && fileData.length > 0"
          :data="fileData"
          :field="[
            'id',
            'car plate number',
            'project',
            'time in',
            'time out',
            'exit code',
            'parker type',
            'surveyor',
          ]"
          :options="{
            variant: 'default',
            striped: true,
            borderless: true,
          }"
          advanced
        />
      </template>
    </rs-card>
  </div>
</template>
