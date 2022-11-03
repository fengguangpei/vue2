/* @flow */

import config from '../config'
import Watcher from '../observer/watcher'
import { mark, measure } from '../util/perf'
import { createEmptyVNode } from '../vdom/vnode'
import { updateComponentListeners } from './events'
import { resolveSlots } from './render-helpers/resolve-slots'
import { toggleObserving } from '../observer/index'
import { pushTarget, popTarget } from '../observer/dep'

import {
  warn,
  noop, // 空函数
  remove,
  emptyObject,
  validateProp,
  invokeWithErrorHandling
} from '../util/index'
// 存储当前激活实例
export let activeInstance: any = null
export let isUpdatingChildComponent: boolean = false
// 设置当前激活实例
export function setActiveInstance(vm: Component) {
  const prevActiveInstance = activeInstance
  activeInstance = vm
  // 返回一个还原当前激活实例的方法
  return () => {
    activeInstance = prevActiveInstance
  }
}
// 初始化生命周期
export function initLifecycle (vm: Component) {
  const options = vm.$options

  // locate first non-abstract parent
  let parent = options.parent
  // 把当前实例添加到父组件的$children数组
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }
  // 父组件
  vm.$parent = parent
  // 根组件
  vm.$root = parent ? parent.$root : vm
  // 子组件列表
  vm.$children = []
  // ref列表
  vm.$refs = {}
  // 代表该组件的watcher实例
  vm._watcher = null
  vm._inactive = null
  vm._directInactive = false
  // 是否挂载
  vm._isMounted = false
  // 是否销毁
  vm._isDestroyed = false
  // 是否正在销毁
  vm._isBeingDestroyed = false
}
// 原型上挂载生命周期函数
// 生命周期是组件从实例化到销毁的过程中会用到的实例方法，而不是简简单单的钩子函数
export function lifecycleMixin (Vue: Class<Component>) {
  Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
    const vm: Component = this
    const prevEl = vm.$el // 旧的根元素
    const prevVnode = vm._vnode // 旧的虚拟DOM
    // 设置当前实例为激活实例
    const restoreActiveInstance = setActiveInstance(vm)
    vm._vnode = vnode
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    // 如果没有旧的虚拟DOM，则是第一个渲染
    if (!prevVnode) {
      // initial render
      // 根组件没有使用insert添加到父元素，而是直接替换
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
    }
    // 对比新旧虚拟DOM
    else {
      // updates
      vm.$el = vm.__patch__(prevVnode, vnode)
    }
    // 还原激活实例
    restoreActiveInstance()
    // update __vue__ reference
    if (prevEl) {
      prevEl.__vue__ = null
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm
    }
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
  }

  Vue.prototype.$forceUpdate = function () {
    const vm: Component = this
    if (vm._watcher) {
      vm._watcher.update()
    }
  }

  Vue.prototype.$destroy = function () {
    // 第一步：从父组件中删除自己
    // 第二步：卸载渲染组件的watcher
    // 第三步：卸载数据相关的watchers
    // 第四步：调用patch，从组件树中删除自己
    // 第五步：删除事件绑定$off()
    // 删除一些应用
    const vm: Component = this
    // 防止重复销毁
    if (vm._isBeingDestroyed) {
      return
    }
    callHook(vm, 'beforeDestroy')
    vm._isBeingDestroyed = true
    // remove self from parent
    // 从父组件中删除自己
    const parent = vm.$parent
    // 存在父组件 && 父组件没有销毁 && 父组件不是抽象组件
    if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
      remove(parent.$children, vm)
    }
    // teardown watchers
    // 组件渲染的watcher
    if (vm._watcher) {
      vm._watcher.teardown()
    }
    // 其他watcher
    let i = vm._watchers.length
    while (i--) {
      vm._watchers[i].teardown()
    }
    // remove reference from data ob
    // frozen object may not have observer.
    if (vm._data.__ob__) {
      vm._data.__ob__.vmCount--
    }
    // call the last hook...
    vm._isDestroyed = true
    // invoke destroy hooks on current rendered tree
    vm.__patch__(vm._vnode, null)
    // fire destroyed hook
    callHook(vm, 'destroyed')
    // turn off all instance listeners.
    vm.$off()
    // remove __vue__ reference
    if (vm.$el) {
      vm.$el.__vue__ = null
    }
    // release circular reference (#6759)
    if (vm.$vnode) {
      vm.$vnode.parent = null
    }
  }
}
// 挂载组件, $mount方法会调用这个方法
export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  // 挂载的目标元素
  vm.$el = el
  // 是否有渲染函数
  if (!vm.$options.render) {
    // 空渲染函数
    vm.$options.render = createEmptyVNode
    if (process.env.NODE_ENV !== 'production') {
      /* istanbul ignore if */
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        )
      } else {
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        )
      }
    }
  }
  // 调用钩子函数
  callHook(vm, 'beforeMount')
  // 定义更新组件的函数
  let updateComponent
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    updateComponent = () => {
      const name = vm._name
      const id = vm._uid
      const startTag = `vue-perf-start:${id}`
      const endTag = `vue-perf-end:${id}`

      mark(startTag)
      const vnode = vm._render()
      mark(endTag)
      measure(`vue ${name} render`, startTag, endTag)

      mark(startTag)
      vm._update(vnode, hydrating)
      mark(endTag)
      measure(`vue ${name} patch`, startTag, endTag)
    }
  } else {
    updateComponent = () => {
      // 调用_update方法，把虚拟DOM渲染成真实的DOM，第一次渲染和数据更新触发渲染时会用到
      vm._update(vm._render(), hydrating)
    }
  }

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  // 创建组件对应的watcher实例，实例化过程会执行updateComponent函数，从而收集当前watcher为依赖
  new Watcher(vm, updateComponent, noop, {
    // 更新前调用beforeUpdate钩子函数
    before () {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true /* isRenderWatcher */)
  hydrating = false

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    // 标记已经挂载
    vm._isMounted = true
    // 调用mounted钩子函数
    callHook(vm, 'mounted')
  }
  return vm
}
// prepatch这个hook会调用这个函数
export function updateChildComponent (
  vm: Component, // componentInstance
  propsData: ?Object, // 更新后的propsData
  listeners: ?Object, // 更新后的listeners
  parentVnode: MountedComponentVNode, // 子组件在父组件中的Vnode，和组件内部render的Vnode不是一回事
  renderChildren: ?Array<VNode> // 当前Vnode下的children
) {
  if (process.env.NODE_ENV !== 'production') {
    isUpdatingChildComponent = true
  }

  // determine whether component has slot children
  // we need to do this before overwriting $options._renderChildren.

  // check if there are dynamic scopedSlots (hand-written or compiled but with
  // dynamic slot names). Static scoped slots compiled from template has the
  // "$stable" marker.
  // 新的插槽
  const newScopedSlots = parentVnode.data.scopedSlots
  // 旧的插槽
  const oldScopedSlots = vm.$scopedSlots
  // 是否是动态插槽
  const hasDynamicScopedSlot = !!(
    // 新插槽不稳定，$stable标记是模版编译时标记的
    (newScopedSlots && !newScopedSlots.$stable) ||
    // 旧插槽不稳定
    (oldScopedSlots !== emptyObject && !oldScopedSlots.$stable) ||
    // 新旧插槽绑定的key不同
    (newScopedSlots && vm.$scopedSlots.$key !== newScopedSlots.$key) ||
    // 没有新插槽，旧插槽有Key
    (!newScopedSlots && vm.$scopedSlots.$key)
  )

  // Any static slot children from the parent may have changed during parent's
  // update. Dynamic scoped slots may also have changed. In such cases, a forced
  // update is necessary to ensure correctness.
  const needsForceUpdate = !!(
    renderChildren ||               // has new static slots
    vm.$options._renderChildren ||  // has old static slots
    hasDynamicScopedSlot
  )

  vm.$options._parentVnode = parentVnode
  vm.$vnode = parentVnode // update vm's placeholder node without re-render

  if (vm._vnode) { // update child tree's parent
    vm._vnode.parent = parentVnode
  }
  vm.$options._renderChildren = renderChildren

  // update $attrs and $listeners hash
  // these are also reactive so they may trigger child update if the child
  // used them during render
  vm.$attrs = parentVnode.data.attrs || emptyObject
  vm.$listeners = listeners || emptyObject

  // update props
  // 更新props
  if (propsData && vm.$options.props) {
    toggleObserving(false)
    const props = vm._props
    const propKeys = vm.$options._propKeys || []
    for (let i = 0; i < propKeys.length; i++) {
      const key = propKeys[i]
      const propOptions: any = vm.$options.props // wtf flow?
      props[key] = validateProp(key, propOptions, propsData, vm)
    }
    toggleObserving(true)
    // keep a copy of raw propsData
    vm.$options.propsData = propsData
  }

  // update listeners
  // 更新listeners
  listeners = listeners || emptyObject
  const oldListeners = vm.$options._parentListeners
  vm.$options._parentListeners = listeners
  updateComponentListeners(vm, listeners, oldListeners)

  // resolve slots + force update if has children
  // 是否需要强制更新子组件
  if (needsForceUpdate) {
    vm.$slots = resolveSlots(renderChildren, parentVnode.context)
    vm.$forceUpdate()
  }

  if (process.env.NODE_ENV !== 'production') {
    isUpdatingChildComponent = false
  }
}

function isInInactiveTree (vm) {
  while (vm && (vm = vm.$parent)) {
    if (vm._inactive) return true
  }
  return false
}

export function activateChildComponent (vm: Component, direct?: boolean) {
  if (direct) {
    vm._directInactive = false
    if (isInInactiveTree(vm)) {
      return
    }
  } else if (vm._directInactive) {
    return
  }
  if (vm._inactive || vm._inactive === null) {
    vm._inactive = false
    for (let i = 0; i < vm.$children.length; i++) {
      activateChildComponent(vm.$children[i])
    }
    callHook(vm, 'activated')
  }
}

export function deactivateChildComponent (vm: Component, direct?: boolean) {
  if (direct) {
    vm._directInactive = true
    if (isInInactiveTree(vm)) {
      return
    }
  }
  if (!vm._inactive) {
    vm._inactive = true
    for (let i = 0; i < vm.$children.length; i++) {
      deactivateChildComponent(vm.$children[i])
    }
    callHook(vm, 'deactivated')
  }
}

export function callHook (vm: Component, hook: string) {
  // #7573 disable dep collection when invoking lifecycle hooks
  pushTarget()
  const handlers = vm.$options[hook]
  const info = `${hook} hook`
  if (handlers) {
    for (let i = 0, j = handlers.length; i < j; i++) {
      invokeWithErrorHandling(handlers[i], vm, null, vm, info)
    }
  }
  /**
   * 父组件通过@hook:[xxx]监听子组件的生命周期，比如
   * <hello-world @hook:updated="hookUpdate"></hello-world>
   * 子组件初始化事件系统时，会判断事件名是否包括hook:，包括的话则会把_hasHookEvent设置为true，
   * callHook调用时，则会触发对应的事件
   */
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook)
  }
  popTarget()
}
