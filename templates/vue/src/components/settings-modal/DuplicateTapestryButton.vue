<template>
  <div>
    <b-button block variant="light" @click="duplicateTapestry">
      <b-spinner v-if="loading"></b-spinner>
      <div v-else>Duplicate Tapestry</div>
    </b-button>
    <b-alert :show="showConfirmation" variant="success" style="margin-top: 1em;">
      Your new Tapestry is ready! Click on the link below to view it.
      <br />
      <a :href="link" target="_blank">{{ link }}</a>
    </b-alert>
  </div>
</template>

<script>
import { mapGetters } from "vuex"
import client from "@/services/TapestryAPI"

export default {
  name: "duplicate-tapestry-button",
  data() {
    return {
      showConfirmation: false,
      link: null,
      loading: false,
    }
  },
  computed: {
    ...mapGetters(["settings", "tapestryJson"]),
  },
  methods: {
    duplicateTapestry() {
      this.loading = true
      const tapestry = this.tapestryJson
      client
        .addTapestry({ title: this.settings.title, ...tapestry })
        .then(res => {
          const href = `${location.origin}/tapestry/${res.settings.tapestrySlug}`
          this.link = href
          this.showConfirmation = true
        })
        .finally(() => {
          this.loading = false
        })
    },
  },
}
</script>
