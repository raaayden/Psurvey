<script setup>
definePageMeta({
  title: "List User",
});

const { data: listUsers } = await useFetch("/api/demo/list-user", {
  method: "GET",
});

console.log(listUsers.value);
</script>
<template>
  <div>
    <LayoutsBreadcrumb />

    <rs-card class="p-5">
      <h3>List Users</h3>
      <br />
      <rs-table
        v-if="listUsers && listUsers.data && listUsers.data.length > 0"
        :data="listUsers.data"
        :field="['Email', 'Username', 'Full Name', 'Action']"
        :options="{
          variant: 'default',
          striped: true,
          borderless: true,
        }"
        :options-advanced="{
          sortable: true,
          responsive: true,
          filterable: false,
        }"
        advanced
      >
        <template v-slot:Action="data">
          <nuxt-link :to="`/user/edit-user/${data.value.userUsername}`">
            <rs-button variant="primary-text" class="p-2">
              <Icon name="ph:pencil-duotone" class="w-5 h-5" />
            </rs-button>
          </nuxt-link>
        </template>
      </rs-table>
    </rs-card>
  </div>
</template>
