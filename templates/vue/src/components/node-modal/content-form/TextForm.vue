<template>
<!--
  <b-form-group label="Text content">
    <b-form-textarea
      id="node-text-content"
      v-model="node.typeData.textContent"
      data-testid="node-textContent"
      placeholder="Enter text here"
    ></b-form-textarea>
  </b-form-group>
  -->
   <vue-editor  id="node-text-content"
      v-model="node.typeData.textContent"
      data-testid="node-textContent"
      placeholder="Enter text here"></vue-editor>
</template>

<script>
import { VueEditor } from "vue2-editor";

export default {
  components: {
    VueEditor,
  },
  props: {
    node: {
      type: Object,
      required: true,
    },
  },
}
</script>
