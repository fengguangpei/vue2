/* @flow */

import {
  warn,
  nextTick,
  emptyObject,
  handleError,
  defineReactive
} from '../util/index'
// 虚拟Node生成函数
import { createElement } from '../vdom/create-element'
import { installRenderHelpers } from './render-helpers/index'
import { resolveSlots } from './render-helpers/resolve-slots'
import { normalizeScopedSlots } from '../vdom/helpers/normalize-scoped-slots'
import VNode, { createEmptyVNode } from '../vdom/vnode'

import { isUpdatingChildComponent } from './lifecycle'

export function initRender (vm: Component) {
  vm._vnode = null // the root of the child tree
  vm._staticTrees = null // v-once cached trees
  const options = vm.$options
  const parentVnode = vm.$vnode = options._parentVnode // the placeholder node in parent tree
  const renderContext = parentVnode && parentVnode.context
  vm.$slots = resolveSlots(options._renderChildren, renderContext)
  vm.$scopedSlots = emptyObject
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  // 这个render函数是给模版编译的render函数调用
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false /* alwaysNormalize */)
  // normalization is always applied for the public version, used in
  // user-written render functions.
  // 这个render函数是给我们手写的render函数调用的
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true /* alwaysNormalize */)

  // $attrs & $listeners are exposed for easier HOC creation.
  // they need to be reactive so that HOCs using them are always updated
  const parentData = parentVnode && parentVnode.data

  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    // 通过传入第四个参数，监听修改$attrs时打印错误
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$attrs is readonly.`, vm)
    }, true)
    // 通过传入第四个参数，监听修改listeners时打印错误
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$listeners is readonly.`, vm)
    }, true)
  } else {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true)
  }
}
// 设置当前正在render的实例
export let currentRenderingInstance: Component | null = null

// for testing only
// 设置当前正在render的实例
export function setCurrentRenderingInstance (vm: Component) {
  currentRenderingInstance = vm
}

export function renderMixin (Vue: Class<Component>) {
  // install runtime convenience helpers
  // 安装运行时的工具函数
  installRenderHelpers(Vue.prototype)

  Vue.prototype.$nextTick = function (fn: Function) {
    return nextTick(fn, this)
  }
  // 静态render方法，把当前实例渲染成VNode
  Vue.prototype._render = function (): VNode {
    const vm: Component = this
    // 子组件在父组件中的Vnode，和组件内部render的Vnode不是一回事
    // 这里的_parentVnode就是子组件在父组件中的Vnode，后面通过_parentVnode即可拿到传给子组件的绑定值
    // 比如：
    /**
     * export default {
     *  render(h) {
     *    return h(
     *      'div',
     *      [
     *        h('TestComponent', {
     *            scopedSlots: {
     *              default: () => 'Hello world'
     *            }
     *        })
     *      ]
     *    )
     *  }
     * }
     */
    // _parentVnode就是h('TestComponent')这个Vnode
    const { render, _parentVnode } = vm.$options
    // 获取父组件传入子组件的作用域插槽
    if (_parentVnode) {
      vm.$scopedSlots = normalizeScopedSlots(
        _parentVnode.data.scopedSlots,
        vm.$slots,
        vm.$scopedSlots
      )
    }
    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    vm.$vnode = _parentVnode
    // render self
    let vnode
    try {
      // There's no need to maintain a stack because all render fns are called
      // separately from one another. Nested component's render fns are called
      // when parent component is patched.
      currentRenderingInstance = vm
      /**
       * 执行render函数，生成虚拟DOM
       * vm._renderProxy，render函数执行上下文
       * vm.$createElement，我们平时写render函数时接收的参数
       */
      vnode = render.call(vm._renderProxy, vm.$createElement)
    } catch (e) {
      handleError(e, vm, `render`)
      // return error render result,
      // or previous vnode to prevent render error causing blank component
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production' && vm.$options.renderError) {
        try {
          vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e)
        } catch (e) {
          handleError(e, vm, `renderError`)
          vnode = vm._vnode
        }
      } else {
        vnode = vm._vnode
      }
    } finally {
      currentRenderingInstance = null
    }
    // if the returned array contains only a single node, allow it
    if (Array.isArray(vnode) && vnode.length === 1) {
      vnode = vnode[0]
    }
    // return empty vnode in case the render function errored out
    // 不允许有多个根节点
    if (!(vnode instanceof VNode)) {
      if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        )
      }
      vnode = createEmptyVNode()
    }
    // set parent
    // 这是一个很细节的点，子组件在父组件中是一个Vnode，子组件内部的render函数是一个Vnode，
    // 不要误以为两者是一回事
    // 两者是父子层级关系
    vnode.parent = _parentVnode
    return vnode
  }
}
