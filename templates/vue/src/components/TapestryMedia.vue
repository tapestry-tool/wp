<template>
  <div
    :class="[
      'media-wrapper',
      { 'media-wrapper-embed': node.mediaFormat === 'embed' },
    ]"
  >
    <text-media
      v-if="node.mediaType === 'text'"
      :node="node"
      @complete="completeNode(nodeId)"
    />
    <video-media
      v-if="node.mediaFormat === 'mp4'"
      :node="node"
      @load="handleLoad"
      @complete="completeNode(nodeId)"
      @timeupdate="updateProgress"
      @close="$emit('close')"
    />
    <external-media
      v-if="node.mediaType === 'url-embed'"
      :node="node"
      :dimensions="dimensions"
      @mounted="handleLoad"
      @complete="completeNode(nodeId)"
    />
    <h5p-media
      v-if="node.mediaFormat === 'h5p'"
      :node="node"
      :width="dimensions.width"
      :height="dimensions.height"
      :settings="h5pSettings"
      @load="handleLoad"
      @update-settings="updateH5pSettings"
      @timeupdate="updateProgress"
      @complete="completeNode(nodeId)"
      @close="$emit('close')"
    />
    <gravity-form
      v-if="node.mediaType === 'gravity-form' && !showCompletionScreen"
      :id="node.typeData.mediaURL"
      @submit="handleFormSubmit"
    ></gravity-form>
    <wp-post-media v-if="node.mediaType === 'wp-post'" :node="node"></wp-post-media>
    <completion-screen v-if="showCompletionScreen" />
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex"
import TextMedia from "./lightbox/TextMedia"
import VideoMedia from "./lightbox/VideoMedia"
import ExternalMedia from "./lightbox/ExternalMedia"
import H5PMedia from "./lightbox/H5PMedia"
import GravityForm from "./lightbox/GravityForm"
import WpPostMedia from "./lightbox/WpPostMedia"
import CompletionScreen from "./lightbox/quiz/CompletionScreen"

const SAVE_INTERVAL = 5

export default {
  name: "tapestry-media",
  components: {
    TextMedia,
    VideoMedia,
    ExternalMedia,
    "h5p-media": H5PMedia,
    GravityForm,
    WpPostMedia,
    CompletionScreen,
  },
  props: {
    nodeId: {
      type: [Number, String],
      required: true,
    },
    dimensions: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      showCompletionScreen: false,
      timeSinceLastSaved: new Date(),
    }
  },
  computed: {
    ...mapGetters(["getNode"]),
    node() {
      return this.getNode(this.nodeId)
    },
  },
  async beforeDestroy() {
    await this.updateNodeProgress({
      id: this.nodeId,
      progress: this.node && this.node.typeData.progress[0].value,
    })
  },
  methods: {
    ...mapActions(["completeNode", "updateNodeProgress", "updateH5pSettings"]),
    handleFormSubmit() {
      this.showCompletionScreen = true
      this.completeNode(this.nodeId)
    },
    handleLoad(args) {
      this.$emit("load", args)
    },
    async updateProgress(type, amountViewed) {
      const now = new Date()
      const secondsDiff = Math.abs(
        (now.getTime() - this.timeSinceLastSaved.getTime()) / 1000
      )

      if (secondsDiff > SAVE_INTERVAL) {
        await this.updateNodeProgress({ id: this.nodeId, progress: amountViewed })

        if (type === "h5p") {
          await this.updateH5pSettings(this.h5pSettings)
        }

        this.timeSinceLastSaved = now
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.media-wrapper {
  background: #000;
  outline: none;
  border-radius: 15px;
  overflow: hidden;
  height: 100%;
}
.media-wrapper-embed {
  background: white;
}
</style>