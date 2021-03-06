<template>
  <div class="gf-container">
    <loading v-show="loading" label="Loading form..." />
    <div
      v-show="!loading"
      ref="formContainer"
      class="gf-form-container"
      @submit="handleSubmit"
      v-html="html"
    ></div>
  </div>
</template>

<script>
import axios from "axios"
import Loading from "@/components/Loading"
import GravityFormsApi from "@/services/GravityFormsApi"

export default {
  name: "gravity-form",
  components: {
    Loading,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      entry: null,
      html: "",
      loading: true,
    }
  },
  watch: {
    id(newId) {
      GravityFormsApi.getFormHtml(newId).then(html => (this.html = html))
    },
  },
  async mounted() {
    delete window[`gf_submitting_${this.id}`]

    const html = await GravityFormsApi.getFormHtml(this.id)
    this.html = html

    const entry = await GravityFormsApi.getFormEntry(this.id)
    this.entry = entry

    this.loading = false
    this.$emit("load")

    this.disableAutocomplete()

    if (this.entry) {
      this.populateForm()
    }
  },
  methods: {
    handleSubmit(event) {
      // stop the original form event
      event.preventDefault()

      const form = this.$refs.formContainer.querySelector("form")

      const data = new FormData(form)
      const url = form.action

      axios
        .post(url, data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then(response => {
          if (!this.isSubmitSuccessful(response)) {
            delete window[`gf_submitting_${this.id}`]
            this.html = response.data
          } else {
            this.$emit("submit")
          }
        })
    },
    isSubmitSuccessful(response) {
      return response.data.includes("gform_confirmation_message")
    },
    populateForm() {
      const inputs = Object.entries(this.entry).filter(
        entry => !isNaN(parseInt(entry[0]))
      )
      inputs.forEach(([id, value]) => {
        const inputName = `input_${id}`
        const inputElement = document.getElementsByName(inputName)[0]
        this.populateInput(inputElement, value)
      })
    },
    populateInput(input, value) {
      if (input.type === "text" || input.tagName.toLowerCase() === "textarea") {
        input.value = value
      } else if (input.type === "checkbox") {
        input.checked = input.value === value
      }
    },
    // Disables autocomplete of GravityForms by targetting generated ids
    disableAutocomplete() {
      const allInputs = document.getElementsByTagName("input")
      // Use splice to convert HTMLCollection to Array per: https://stackoverflow.com/a/222847
      const formInputs = Array.from(allInputs).filter(input =>
        // All GravityForm inputs are enumerated with the input_ prefix
        input.id.startsWith("input_")
      )

      formInputs.forEach(input => {
        // Manually sets autocomplete flag for each element of form
        input.autocomplete = "off"
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.gf-container {
  width: 100%;
  height: 100%;
}

.gf-form-container {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

<style lang="scss">
.gf-container .gform_fields {
  list-style-type: none;
  padding-left: 0;
}

.gform_wrapper {
  width: 100%;

  .image-choices-use-images .ginput_container {
    margin: 2em 0;

    .gfield_checkbox {
      display: flex;
      align-items: flex-start;
      padding-left: 0;
      width: 100%;

      > li {
        flex: 0 0 18%;
        display: flex;

        &:nth-last-child(-n + 4):first-child,
        &:nth-last-child(-n + 4):first-child ~ li {
          flex-grow: 1;
        }

        input {
          margin-right: -14px;
          margin-top: 2px;
          z-index: 10;
          transform: scale(1.5);
        }

        .image-choices-choice-image-wrap {
          padding-bottom: 0 !important;
          background: none !important;

          img {
            max-width: 100px;
            margin-right: 1em;
          }
        }
      }
    }
  }
}
</style>
