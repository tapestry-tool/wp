<template>
  <transition name="fade">
    <g
      v-show="isVisible"
      ref="node"
      :class="{ opaque: !visibleNodes.includes(node.id) }"
      :style="{
        cursor: node.accessible || hasPermission('edit') ? 'pointer' : 'not-allowed',
      }"
      @click="handleClick"
      @mouseover="handleMouseover"
      @mouseleave="$emit('mouseleave')"
    >
      <circle
        ref="circle"
        :cx="node.coordinates.x"
        :cy="node.coordinates.y"
        :fill="fill"
      ></circle>
      <progress-bar
        v-show="
          node.nodeType !== 'grandchild' &&
            node.nodeType !== '' &&
            !node.hideProgress
        "
        :x="node.coordinates.x"
        :y="node.coordinates.y"
        :radius="radius"
        :progress="progress"
        :locked="!node.accessible"
      ></progress-bar>
      <g v-show="node.nodeType !== 'grandchild' && node.nodeType !== ''">
        <foreignObject
          v-if="!node.hideTitle"
          class="metaWrapper"
          :width="(140 * 2 * 5) / 6"
          :height="(140 * 2 * 5) / 6"
          :x="node.coordinates.x - (140 * 5) / 6"
          :y="node.coordinates.y - (140 * 5) / 6"
        >
          <div class="meta">
            <p class="title">{{ node.title }}</p>
            <p v-if="node.mediaDuration" class="timecode">{{ formatDuration() }}</p>
          </div>
        </foreignObject>
        <g v-show="!transitioning">
          <foreignObject
            v-if="!node.hideMedia"
            class="node-button-wrapper"
            :x="node.coordinates.x - 30"
            :y="node.coordinates.y - radius - 30"
          >
            <button class="node-button" @click="openNode">
              <tapestry-icon
                v-if="node.mediaType !== 'text'"
                :icon="icon"
              ></tapestry-icon>
              <span v-else>Aa</span>
            </button>
          </foreignObject>
          <add-child-button
            v-if="hasPermission('add')"
            :node="node"
            :x="node.coordinates.x - 65"
            :y="node.coordinates.y + radius - 30"
          ></add-child-button>
          <foreignObject
            v-if="hasPermission('edit')"
            class="node-button-wrapper"
            :x="node.coordinates.x + 5"
            :y="node.coordinates.y + radius - 30"
          >
            <button class="node-button" @click.stop="editNode">
              <tapestry-icon icon="pen"></tapestry-icon>
            </button>
          </foreignObject>
        </g>
      </g>
      <defs v-if="node.imageURL">
        <pattern :id="`node-image-${node.id}`" width="1" height="1">
          <image
            preserveAspectRatio="xMidYMid slice"
            :href="
              node.lockedImageURL && !node.accessible
                ? node.lockedImageURL
                : node.imageURL
            "
            x="0"
            y="0"
            :width="radius * 2"
            :height="radius * 2"
          />
        </pattern>
      </defs>
    </g>
  </transition>
</template>

<script>
import * as d3 from "d3"
import { mapActions, mapGetters, mapState, mapMutations } from "vuex"
import TapestryIcon from "@/components/TapestryIcon"
import { bus } from "@/utils/event-bus"
import AddChildButton from "./tapestry-node/AddChildButton"
import ProgressBar from "./tapestry-node/ProgressBar"

export default {
  name: "tapestry-node",
  components: {
    AddChildButton,
    ProgressBar,
    TapestryIcon,
  },
  props: {
    node: {
      type: Object,
      required: true,
    },
    root: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      transitioning: false,
    }
  },
  computed: {
    ...mapState(["selection", "visibleNodes"]),
    ...mapGetters(["getNode", "getDirectChildren"]),
    icon() {
      switch (this.node.mediaType) {
        case "h5p":
        case "video":
          return "play"
        case "text":
          return "text"
        case "activity":
        case "gravity-form":
          return "tasks"
        case "url-embed":
          return "window-maximize"
        case "accordion":
          return "bars"
        case "wp-post":
          return "post"
        default:
          return "exclamation"
      }
    },
    isVisible() {
      return this.node.nodeType !== ""
    },
    radius() {
      if (!this.isVisible) {
        return 0
      }
      if (this.root) {
        return 210
      }
      if (this.node.nodeType === "grandchild") {
        return 40
      }
      return 140
    },
    fill() {
      if (this.node.imageURL && this.node.nodeType !== "grandchild") {
        return `url(#node-image-${this.node.id})`
      }
      if (this.selected) {
        return "#11a6d8"
      }
      if (!this.node.accessible) {
        return "#8a8a8c"
      }
      return "#8396a1"
    },
    selected() {
      return this.selection.includes(this.node.id)
    },
    progress() {
      if (this.node.mediaType !== "accordion") {
        return this.node.progress
      }
      const rows = this.getDirectChildren(this.node.id)
      return rows.map(this.getNode).filter(row => row.completed).length / rows.length
    },
  },
  watch: {
    radius(newRadius) {
      d3.select(this.$refs.circle)
        .transition()
        .duration(800)
        .ease(d3.easePolyOut)
        .on("start", () => {
          this.transitioning = true
        })
        .on("end", () => {
          this.transitioning = false
        })
        .attr("r", newRadius)
    },
  },
  mounted() {
    this.$refs.circle.setAttribute("r", this.radius)
    const nodeRef = this.$refs.node
    d3.select(nodeRef).call(
      d3
        .drag()
        .on("start", () => {
          if (this.selection.length) {
            this.coordinates = this.selection.reduce((coordinates, nodeId) => {
              const node = this.getNode(nodeId)
              coordinates[nodeId] = { x: node.coordinates.x, y: node.coordinates.y }
              return coordinates
            }, {})
          } else {
            this.originalX = this.node.coordinates.x
            this.originalY = this.node.coordinates.y
          }
        })
        .on("drag", () => {
          if (this.selection.length) {
            this.selection.forEach(id => {
              const node = this.getNode(id)
              node.coordinates.x += d3.event.dx
              node.coordinates.y += d3.event.dy
            })
          } else {
            this.node.coordinates.x += d3.event.dx
            this.node.coordinates.y += d3.event.dy
          }
        })
        .on("end", () => {
          this.$emit("dragend")
          if (this.hasPermission("edit")) {
            if (this.selection.length) {
              this.selection.forEach(id => {
                const node = this.getNode(id)
                this.updateNodeCoordinates({
                  id: node.id,
                  coordinates: {
                    x: node.coordinates.x,
                    y: node.coordinates.y,
                  },
                }).catch(() => {
                  alert("Failed to save coordinates.")
                  node.coordinates.x = this.coordinates[id].x
                  node.coordinates.y = this.coordinates[id].y
                })
              })
            } else {
              this.updateNodeCoordinates({
                id: this.node.id,
                coordinates: {
                  x: this.node.coordinates.x,
                  y: this.node.coordinates.y,
                },
              }).catch(() => {
                alert("Failed to save coordinates.")
                this.node.coordinates.x = this.originalFx
                this.node.coordinates.y = this.originalFy
              })
            }
          }
        })
    )
  },
  methods: {
    ...mapActions(["updateNodeCoordinates"]),
    ...mapMutations(["select", "unselect", "updateSelectedNode"]),
    openNode() {
      this.$router.push(`/nodes/${this.node.id}`)
    },
    editNode() {
      this.$root.$emit("edit-node", this.node.id)
    },
    formatDuration() {
      const seconds = this.node.mediaDuration
      const hours = Math.floor(seconds / 3600)
      let minutes = Math.floor((seconds - hours * 3600) / 60)
      let sec = seconds - hours * 3600 - minutes * 60

      if (sec < 10) sec = "0" + sec

      if (hours > 0 && minutes < 10) minutes = "0" + minutes

      if (hours === 0) return minutes + ":" + sec

      return hours + ":" + minutes + ":" + sec
    },
    handleMouseover() {
      bus.$emit("mouseover", this.node.id)
      this.$emit("mouseover")
    },
    handleClick(evt) {
      if (evt.ctrlKey || evt.metaKey || evt.shiftKey) {
        this.selected ? this.unselect(this.node.id) : this.select(this.node.id)
      } else if (this.node.accessible || this.hasPermission("edit")) {
        this.root && this.node.hideMedia
          ? this.openNode()
          : this.updateSelectedNode(this.node.id)
      }
    },
    hasPermission(action) {
      // Check 1: Has edit permissions for Tapestry
      if (wpData.wpCanEditTapestry === "1") {
        return true
      }

      // Check 2: User is the author of the node
      if (wpData.currentUser.ID == this.node.author.id) {
        return true
      }

      // Check 3: User has a role with general edit permissions
      const { ID, roles } = wpData.currentUser
      const allowedRoles = ["administrator", "editor", "author"]
      if (allowedRoles.some(role => roles.includes(role))) {
        return true
      }

      const { public: publicPermissions, authenticated } = this.node.permissions
      // Check 4: Node has public permissions
      if (publicPermissions.includes(action)) {
        return true
      }

      // Check 5: Node has authenticated permissions
      if (wpData.currentUser.ID && authenticated.includes(action)) {
        return true
      }

      // Check 6: User has a role that is allowed in the node
      const isRoleAllowed = roles.some(role => {
        const permissions = this.node.permissions[role]
        return permissions.includes(action)
      })
      if (isRoleAllowed) {
        return true
      }

      // Check 7: User has a permission associated with its ID
      const userPermissions = this.node.permissions[`user-${ID}`]
      if (userPermissions) {
        return userPermissions.includes(action)
      }

      return false
    },
  },
}
</script>

<style lang="scss" scoped>
.opaque {
  opacity: 0.2;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>

<style lang="scss">
.node-button {
  height: 55px;
  width: 55px;
  background: #666;
  border-radius: 50%;
  border: 3px solid white;
  color: white;
  font-size: 30px;
  position: relative;

  > * {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  span {
    font-size: 24px;
  }

  &-wrapper {
    width: 65px;
    height: 65px;
  }
}
</style>