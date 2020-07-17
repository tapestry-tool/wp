import Vue from "vue"
import VueRouter from "vue-router"
import Lightbox from "./components/Lightbox"
import NodeModal from "./components/NodeModal.vue"
import SettingsModal from "./components/SettingsModal.vue"

Vue.use(VueRouter)

const routes = [
  {
    path: "/nodes/view/:nodeId/:row?/:subrow?",
    component: Lightbox,
    props: true,
  },
  {
    path: "/nodes/add/:nodeId/:tab?",
    component: NodeModal,
    props: { modalType: "add" },
  },
  {
    path: "/nodes/edit/:nodeId/:tab?",
    component: NodeModal,
    props: { modalType: "edit" },
  },
  {
    path: "/settings/:tab?",
    component: SettingsModal,
  },
]

const router = new VueRouter({ routes })

let promise = new Promise(resolve => {
  router.start = resolve
})

router.beforeEach(async (to, from, next) => {
  await promise // wait until 'start' called
  next()
})

export default router
