<script setup>
definePageMeta({
  title: "demo",
});

var message = ref("Hello World!");

var form = ref({
  no1: 0,
  no2: 0,
});

var answer = ref(0);
var arrayAnswer = ref([]);

function changeHeader() {
  message.value = "Hello Vue 3!";
}

function calculateTwoNumbers() {
  answer.value = parseInt(form.value.no1) + parseInt(form.value.no2);
  arrayAnswer.value.push(answer.value);
}
</script>
<template>
  <div>
    <LayoutsBreadcrumb />

    <rs-card class="p-5">
      <h3>{{ message }}</h3>
      <br />
      <rs-button @click="changeHeader">Change Header</rs-button>
      <br />
      <br />
      <h3>Form</h3>
      <div class="flex items-center gap-5">
        <FormKit
          v-model="form.no1"
          type="text"
          label="NO 1"
          validation="required"
          validation-visibility="dirty"
        >
        </FormKit>
        <div>+</div>
        <FormKit
          v-model="form.no2"
          type="text"
          label="NO 2"
          validation="required"
          validation-visibility="dirty"
        >
        </FormKit>
        =
        <span>{{ answer }} </span>
      </div>
      <rs-button @click="calculateTwoNumbers">Calculate</rs-button>
      <br />
      <br />
      <h3>Message Validation</h3>
      <span v-if="answer < 0"> Number is Negative </span>
      <span v-else-if="answer > 0"> Number is Positive </span>
      <br />
      <br />
      <h3>Answer List</h3>
      <ul>
        <li v-for="(value, index) in arrayAnswer">
          {{ index }} => {{ value }}
        </li>
      </ul>
    </rs-card>
  </div>
</template>
