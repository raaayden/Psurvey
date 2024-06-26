<script setup>
/* eslint-disable */
import { useDropzone } from "vue3-dropzone";

const props = defineProps({
  context: Object,
});

const fileBase64 = ref([]);
const files = ref([]);
let err = ref(false);
let errmsg = ref("");

const accept = props.context.accept;
const multiple = props.context.multiple;
const maxSize = props.context.maxSize;
const minSize = props.context.minSize;
const maxFiles = props.context.maxFiles;
const disabled = props.context.disabled;

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

async function onDrop(fileList, fileError, event) {
  if (fileError.length == 0 && files.value.length < maxFiles) {
    err.value = false;
    errmsg.value = "";
    for (let i = 0; i < fileList.length; i++) {
      const base64 = await toBase64(fileList[i]);
      fileBase64.value.push({ data: fileList[i], base64 });
      files.value.push([fileList[i]]);
    }
  } else {
    if (files.value?.length == maxFiles) {
      err.value = true;
      errmsg.value = `Maximum files allowed is ${maxFiles}`;
    } else {
      if (fileError[0].errors[0].code == "file-too-large") {
        err.value = true;
        let convertedSize = maxSize / 100000;
        errmsg.value = `File size exceeds ${convertedSize}mb`;
      } else if (fileError[0].errors[0].code == "file-too-small") {
        err.value = true;
        let convertedSize = minSize / 100000;
        errmsg.value = `File size is less than ${convertedSize}mb`;
      } else if (fileError[0].errors[0].code == "too-many-files") {
        err.value = true;
        errmsg.value = `Maximum files allowed is ${maxFiles}`;
      } else if (fileError[0].errors[0].code == "file-invalid-type") {
        err.value = true;
        errmsg.value = `Invalid file type. Only ${accept} files are allowed`;
      }
    }
  }

  updateNodeValue();
}

async function removeFiles(index) {
  fileBase64.value.splice(index, 1);
  files.value.splice(index, 1);

  updateNodeValue();
}

function updateNodeValue() {
  props.context.node.input(files.value);
}

const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  accept,
  multiple: multiple === "true" ? true : false,
  maxSize: maxSize ? parseInt(maxSize) : Infinity,
  minSize: minSize ? parseInt(minSize) : 0,
  maxFiles: maxFiles ? parseInt(maxFiles) : 0,
  disabled: disabled === "true" ? true : false,
});
</script>

<template>
  <!-- eslint-disable -->

  <div :class="context.classes.dropzone">
    <div v-bind="getRootProps()" class="cursor-pointer">
      <input v-bind="getInputProps()" />
      <div
        class="flex items-center justify-center h-36"
        :class="{
          'text-red-500': err,
        }"
      >
        <div>
          <Icon
            class="!block m-auto mb-3"
            size="30px"
            name="ph:file-arrow-up"
          />
          <p class="text-center" v-if="isDragActive">Drop the files here ...</p>
          <p v-else>Drop files or click here to upload files</p>
        </div>
      </div>
    </div>
    <div
      id="fileList"
      class="grid sm:grid-cols-2 md:grid-cols-4 gap-4"
      v-auto-animate
    >
      <div
        v-for="(file, index) in fileBase64"
        class="relative overflow-hidden w-full h-20 md:h-36 rounded-lg border-2 border-gray-300 dark:border-gray-600"
        v-auto-animate
      >
        <img
          v-if="file.data.type.includes('image')"
          :src="file.base64"
          class="w-full h-20 md:h-36 object-cover object-center rounded-lg"
        />
        <div
          v-else
          class="h-full flex items-center justify-center opacity-50 text-primary font-semibold uppercase text-xl whitespace-nowrap"
        >
          {{
            file.data.name.slice(
              ((file.data.name.lastIndexOf(".") - 1) >>> 0) + 2
            )
          }}
        </div>
        <Icon
          name="ic:round-close"
          @click="removeFiles(index)"
          class="cursor-pointer absolute top-1 right-1 text-slate-600 hover:bg-slate-200 bg-white dark:bg-slate-800 dark:text-gray-300 dark:hover:dark:bg-slate-600 p-1 rounded-full"
          size="18"
        />
        <div
          class="absolute bottom-1 right-1 bg-white dark:bg-slate-800 px-2 rounded-lg"
        >
          <span
            class="font-semibold text-xs text-slate-600 dark:text-gray-300 line-clamp-1"
          >
            {{ file.data.path }}
          </span>
        </div>
      </div>
    </div>
    <ul
      v-if="err"
      class="formkit-messages list-none p-0 mt-1 mb-0 relative -bottom-5 -left-2"
      aria-live="polite"
    >
      <li
        class="formkit-message text-red-500 mb-3 text-xs formkit-invalid:text-red-500 dark:formkit-invalid:text-danger"
        id="input_9-rule_required"
        data-message-type="validation"
      >
        {{ errmsg }}
      </li>
    </ul>
  </div>
</template>
