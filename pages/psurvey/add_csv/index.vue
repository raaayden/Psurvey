<template>
  <div>
    <input type="file" @change="handleFileUpload" name="csvFile">
  </div>
</template>

<script>
import axios from 'axios'

export default {
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const csv = e.target.result;
        this.sendCSVToBackend(csv);
      };

      reader.readAsText(file);
    },
    sendCSVToBackend(csv) {
      // Assuming you are using Axios for HTTP requests
      axios.post('/api/upload_file2', { csv })
        .then(response => {
          console.log('CSV uploaded successfully');
        })
        .catch(error => {
          console.error('Error uploading CSV:', error);
        });
    }
  }
}
</script>