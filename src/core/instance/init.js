/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0
/** Vue构造函数初始化函数 */
export function initMixin (Vue) {
  // _uid
  // _isVue
  // $options
  // _renderProxy
  // _self 当前实例
  Vue.prototype._init = function (options) {
    // 当前实例
    const vm = this
    // a uid
    vm._uid = uid++

    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    // 这里的_isComponent是在createComponentInstanceForVnode方法注入的
    if (options && options._isComponent) {
      // 虚拟DOM渲染时，遇到自定义组件没法通过createElement()创建节点，必须实例化该组件，此时选项的合并走这里
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      // new Vue()的时候走这里
      vm.$options = mergeOptions(
        // vm.constructor就是Vue构造函数
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    // 为vm._renderProxy设置值，这个值就是render函数执行时的指定对象
    // vnode = render.call(vm._renderProxy, vm.$createElement)
    // 这也是为什么我们render函数的this可以通过this访问实例属性
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    // 声明周期相关, 新增了一批属性
    // $parent、$rout $children $refs _watcher _inactive _directInactive _isMounted _isDestroyed _isBeingDestroyed
    initLifecycle(vm)
    // 事件处理相关
    // _events
    initEvents(vm)
    // render相关
    // _vnode、_staticTrees、$vnode、$slot、$scopeSlots
    // 这个render函数是给模版编译的render函数调用
    // vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
    // 这个render函数是给我们手写的render函数调用的
    // vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
    // $attrs、$listeners
    initRender(vm)
    // 调用beforeCreate钩子函数
    // beforeCreate只能访问上面的属性
    callHook(vm, 'beforeCreate')
    // 初始化依赖注入
    // inject会被遍历，并使用defineReactive(vm, key, result[key])设置到实例上
    initInjections(vm) // resolve injections before data/props
    // 初始化数据：initProps()、initMethods()、initData()、initComputed()、initWatch()
    // _watchers、_data, _props, $options._propKeys, _computedWatchers, 
    // proxy(vm, '_props', key)
    // proxy(vm, '_data', key)
    // 设置空函数，绑定当前实例为this
    // 方法可以访问实例属性的原因：vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm)
    initState(vm)
    // 初始化依赖注入
    // _provided
    initProvide(vm) // resolve provide after data/props
    // 调用created钩子函数
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }
    // 挂载组件
    // 这里的$mount方法是在runtime目录下添加的web/runtime/index.js
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  // parent是指父组件
  opts.parent = options.parent
  // 这里的_parentVnode是父级Vnode，值得注意的是，子组件在父组件中是一个Vnode，
  // 但子组件实例化时render生成的也是一个Vnode，这个Vnode和代表子组件的Vnode是父子层级关系
  opts._parentVnode = parentVnode
  // 所以这里通过_parentVnode存储组件在父组件的Vnode，从而获取data得数据
  const vnodeComponentOptions = parentVnode.componentOptions
  // 父组件绑定的值
  opts.propsData = vnodeComponentOptions.propsData
  // 父组件设置的事件监听函数
  opts._parentListeners = vnodeComponentOptions.listeners
  /**
   * <hello-world>
   *  <h1 #header></h1>
   *  <h1 #footer></h1>
   * </hello-world>
   * 其中的两个h1对应的Vnode就是children
   */
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions (Ctor: Class<Component>) {
  // 这里的options是在 initGlobalAPI() 时注入的，格式如下
  // { component, directive, filter }
  let options = Ctor.options
  // 判断当前构造函数是否是继承Vue
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
