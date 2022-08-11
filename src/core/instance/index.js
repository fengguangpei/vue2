import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
// 控制台警告方法
import { warn } from '../util/index'
/** Vue构造函数 */
function Vue (options) {
  /** 避免构造函数被直接调用 */
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue) 
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}
/** 
 * Vue构造函数constructor
 * cid: number
 * compile: function
 * component: function
 * delete: function
 * directive: function
 * extend: function
 * filter: function
 * mixin: function
 * nextTick: function
 * observable: function
 * options: {
 *  // 内置组件、全局组件
 *  components: {
 *    KeepAlive: {},
 *    Transition: {},
 *    TransitionGroup: {},
 *    // 其他通过Vue.component()组册的全局组件
 *  },
 *  // 内置指令、全局指令
 *  directives: {
 *    model: {},
 *    show: {}
 *  }
 *  // 全局过滤器
 *  filters: {},
 *  _base: {}
 * }
 * set: function
 * use: function
 * util: {
 *  defineReactive: function,
 *  extend: function,
 *  mergeOptions: function,
 *  warn: function
 * }
 * version: 版本号
 * FunctionalRenderContext: function
 * config: {
 *  async: true
 *  devtools: true
 *  errorHandler: null
 *  getTagNamespace: ƒ getTagNamespace(tag)
 *  ignoredElements: []
 *  isReservedAttr: ƒ (val)
 *  isReservedTag: ƒ (tag)
 *  isUnknownElement: ƒ isUnknownElement(tag)
 *  keyCodes: Proxy {}
 *  mustUseProp: ƒ (tag, type, attr)
 *  optionMergeStrategies: {propsData: ƒ, el: ƒ, data: ƒ, beforeCreate: ƒ, created: ƒ, …}
 *  parsePlatformTagName: ƒ (_)
 *  performance: false
 *  productionTip: true
 *  silent: false
 *  warnHandler: null
 *  _lifecycleHooks: [
 *   "beforeCreate"
 *   "created"
 *   "beforeMount"
 *   "mounted"
 *   "beforeUpdate"
 *   "updated"
 *   "beforeDestroy"
 *   "destroyed"
 *   "activated"
 *   "deactivated"
 *   "errorCaptured"
 *   "serverPrefetch"
 *  ]
 * }
 * length: 1 接收参数个数
 * name: Vue 构造函数名称
 * 
*/
/**
 * Vue构造函数：prototype
 * $delete: ƒ del(target, key)
 * $destroy: ƒ ()
 * $emit: ƒ (event)
 * $forceUpdate: ƒ ()
 * $mount: ƒ ( el, hydrating )
 * $nextTick: ƒ (fn)
 * $off: ƒ (event, fn)
 * $on: ƒ (event, fn)
 * $once: ƒ (event, fn)
 * $set: ƒ (target, key, val)
 * $watch: ƒ ( expOrFn, cb, options )
 * __patch__: ƒ patch(oldVnode, vnode, hydrating, removeOnly)
 * _b: ƒ bindObjectProps( data, tag, value, asProp, isSync )
 * _d: ƒ bindDynamicKeys(baseObj, values)
 * _e: ƒ (text)
 * _f: ƒ resolveFilter(id)
 * _g: ƒ bindObjectListeners(data, value)
 * _i: ƒ looseIndexOf(arr, val)
 * _init: ƒ (options)
 * _k: ƒ checkKeyCodes( eventKeyCode, key, builtInKeyCode, eventKeyName, builtInKeyName )
 * _l: ƒ renderList( val, render )
 * _m: ƒ renderStatic( index, isInFor )
 * _n: ƒ toNumber(val)
 * _o: ƒ markOnce( tree, index, key )
 * _p: ƒ prependModifier(value, symbol)
 * _q: ƒ looseEqual(a, b)
 * _render: ƒ ()
 * _s: ƒ toString(val)
 * _t: ƒ renderSlot( name, fallbackRender, props, bindObject )
 * _u: ƒ resolveScopedSlots( fns, // see flow/vnode res, // the following are added in 2.6 hasDynamicKeys, contentHashKey )
 * _update: ƒ (vnode, hydrating)
 * _v: ƒ createTextVNode(val)
 * $data: (...)
 * $isServer: (...)
 * $props: (...)
 * $ssrContext: (...)
 * constructor: ƒ Vue(options)
 * get $data: ƒ ()
 * set $data: ƒ ()
 * get $isServer: ƒ ()
 * get $props: ƒ ()
 * set $props: ƒ ()
 * get $ssrContext: ƒ ()
 */
/** 原型挂载初始化方法 */
initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)
export default Vue
