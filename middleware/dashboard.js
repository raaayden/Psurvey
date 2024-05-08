export default defineNuxtRouteMiddleware((to, from) => {
  return navigateTo("/survey/upload-csv");
});
