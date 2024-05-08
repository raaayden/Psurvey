<script setup>
useHead({
  title: "First Parking | Innovative solutions for captivating content",
  description: "Home page",
  htmlAttrs: {
    lang: "en",
  },
});

const nuxtApp = useNuxtApp();
const loading = ref(true);

onMounted(() => {
  // Hide loading indicator if not hydrating
  setTimeout(() => {
    loading.value = false;
  }, 1000);

  // Get theme from localStorage
  document.documentElement.setAttribute("data-theme", "default");
});
</script>

<template>
  <div>
    <VitePwaManifest />
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <Loading v-if="loading" />
      <NuxtPage :key="$route.fullPath" v-else />
    </NuxtLayout>
  </div>
</template>
