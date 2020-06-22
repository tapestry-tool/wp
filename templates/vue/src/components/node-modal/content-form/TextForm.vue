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
  <div>
  <vue-editor
    id="node-text-content"
    v-model="node.typeData.textContent"
    data-testid="node-textContent"
    placeholder="Enter text here"
  ></vue-editor>
      <editor :content.sync="contentForEditor"></editor>
</div>
</template>

<script>
import { VueEditor, Quill } from "vue2-editor"
import Editor from "./Editor.vue";

export default {
  components: {
    VueEditor,
    Editor
  },
  props: {
    node: {
      type: Object,
      required: true,
    },
  },
  data: () => ({
    contentForEditor: '<h3>Some Initial Content</h3>'
  }),
}
</script>
