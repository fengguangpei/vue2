import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
// 是否是服务端渲染
import { isServerRendering } from 'core/util/env'
// 服务端渲染相关
import { FunctionalRenderContext } from 'core/vdom/create-functional-component'
// 挂载全局API
initGlobalAPI(Vue)
/** 挂载原型方法 */
Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

Object.defineProperty(Vue.prototype, '$ssrContext', {
  get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
})

// expose FunctionalRenderContext for ssr runtime helper installation
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
})
/** 挂载原型方法 */
Vue.version = '__VERSION__'
/** 暴露Vue构造函数  */
export default Vue
