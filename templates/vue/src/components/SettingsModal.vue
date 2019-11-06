<template>
  <b-modal id="settings-modal" size="lg" title="Tapestry Settings" body-class="p-0">
    <b-container fluid class="px-0">
      <b-tabs card>
        <b-tab title="Appearance" active>
          <b-form-group
            label="Background URL"
            description="Add a background image to the page where this tapestry
              appears."
          >
            <b-form-input
              id="background-url"
              v-model="backgroundUrl"
              placeholder="Enter background URL"
              autofocus
              required
            />
          </b-form-group>
          <b-form-group
            label="Auto-Layout"
            description="With auto-layout enabled, nodes will place themselves in
              the best position possible. If this is disabled, you will need to manually place the nodes where
              you want them to appear."
          >
            <b-form-checkbox v-model="autoLayout" switch>
              {{ autoLayout ? "Enabled" : "Disabled" }}
            </b-form-checkbox>
          </b-form-group>
        </b-tab>
      </b-tabs>
    </b-container>
    <template slot="modal-footer">
      <p class="mb-0 p-0 text-muted small">
        <strong>Note:</strong>
        Page will refresh when you save to apply your new settings.
      </p>
      <span style="flex-grow:1;"></span>
      <b-button size="sm" variant="secondary" @click="closeModal">
        Cancel
      </b-button>
      <b-button size="sm" variant="primary" @click="updateSettings">
        Save
      </b-button>
    </template>
  </b-modal>
</template>

<script>
import { mapGetters } from "vuex"
export default {
  name: "settings-modal",
  data() {
    return {
      backgroundUrl: "",
      autoLayout: false,
    }
  },
  computed: {
    ...mapGetters(["settings"]),
  },
  mounted() {
    window.addEventListener("open-settings-modal", this.openModal)
  },
  beforeDestroy() {
    window.removeEventListener("open-settings-modal")
  },
  methods: {
    openModal() {
      this.$bvModal.show("settings-modal")
      this.getSettings()
    },
    closeModal() {
      this.$bvModal.hide("settings-modal")
    },
    getSettings() {
      const { backgroundUrl = "", autoLayout = false } = this.settings
      this.backgroundUrl = backgroundUrl
      this.autoLayout = autoLayout
    },
    async updateSettings() {
      const settings = Object.assign(this.settings, {
        backgroundUrl: this.backgroundUrl,
        autoLayout: this.autoLayout,
      })
      await this.$store.dispatch("updateSettings", settings)
      // TODO: Improve behavior so refresh is not required (currently auto-layout and setting the background image only happen initially)
      // this.$emit("settings-updated", settings);
      // this.closeModal();
      location.reload()
    },
  },
}
</script>

<style scoped></style>