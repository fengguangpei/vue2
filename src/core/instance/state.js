/* @flow */

import config from '../config'
import Watcher from '../observer/watcher'
import Dep, { pushTarget, popTarget } from '../observer/dep'
import { isUpdatingChildComponent } from './lifecycle'

import {
  set,
  del,
  observe,
  defineReactive,
  toggleObserving
} from '../observer/index'

import {
  warn, // 控制台打印警告
  bind, // bind方法
  noop, // 空函数
  hasOwn, // 是否有自身属性
  hyphenate, // 驼峰转kebab-case
  isReserved, // 是否是保留字
  handleError, // 统一错误处理函数
  nativeWatch,
  validateProp, // 校验props
  isPlainObject,  // 纯对象，而不是Set、Map等Object
  isServerRendering,  // 是否是服务端渲染
  isReservedAttribute, // 是否是保留属性
  invokeWithErrorHandling // 封装函数的执行，监听错误
} from '../util/index'

const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

export function proxy (target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
/** 初始化options选项，注意先后顺序 */
export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  /** 处理props */
  if (opts.props) initProps(vm, opts.props)
  /** 处理methods方法 */
  if (opts.methods) initMethods(vm, opts.methods)
  /** 初始化data */
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  /** 初始化computed */
  if (opts.computed) initComputed(vm, opts.computed)
  /** 初始化watch */
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
/** 初始化props */
function initProps (vm: Component, propsOptions: Object) {
  // 父组件绑定的props，模板编译的时候收集
  const propsData = vm.$options.propsData || {}
  const props = vm._props = {}
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  const keys = vm.$options._propKeys = []
  // 是否是根组件
  const isRoot = !vm.$parent
  // root instance props should be converted
  if (!isRoot) {
    toggleObserving(false)
  }
  for (const key in propsOptions) {
    keys.push(key)
    // 校验props
    const value = validateProp(key, propsOptions, propsData, vm)
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      // 判断是否是Vue保留字
      const hyphenatedKey = hyphenate(key)
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        )
      }
      // 响应式prop，并在开发环境拦截setter设置器，修改props控制台打印警告
      defineReactive(props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
            `overwritten whenever the parent component re-renders. ` +
            `Instead, use a data or computed property based on the prop's ` +
            `value. Prop being mutated: "${key}"`,
            vm
          )
        }
      })
    } else {
      // 生产环境直接响应式数据
      defineReactive(props, key, value)
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    // 代理props的直接访问
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  toggleObserving(true)
}
/** 初始化Data */
function initData (vm: Component) {
  let data = vm.$options.data
  // 判断是否是工厂函数
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  // 开发环境，如果不是纯对象，控制台打印警告
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  // 代理属性
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    // 成员属性和成员方法同名，控制台打印警告
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    // 成员属性和props同名，控制台打印警告
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      // 如果不是保留字 代理属性
      proxy(vm, `_data`, key)
    }
  }
  // observe data
  // 响应式Data
  observe(data, true /* asRootData */)
}

export function getData (data: Function, vm: Component): any {
  // #7573 disable dep collection when invoking data getters
  pushTarget()
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, `data()`)
    return {}
  } finally {
    popTarget()
  }
}

const computedWatcherOptions = { lazy: true }
// 初始化Computed
/**
 * 第一步：计算属性的getter会传给watch构造函数实例化一个watcher，并且watcher的实例属性dirty：true
 * 第二步：计算属性的getter会被computedGetter #285行
 * 第三步：模版使用计算属性时，会访问它的getter获取值，所以computedGetter会执行
 * 第四步：computedGetter执行时,会判断dirty属性是否为true，为true则重新执行传给watch的getter，计算最新的值
 *        。这个过程触发依赖的属性的依赖收集，把computed的watch收集为依赖
 * 第五步：通知计算属性依赖的属性，把当前组件实例的watcher收集为依赖
 * 第六步：计算属性的依赖的属性发生变化时，会通知依赖更新，就包括计算属性的watcher、组件的watcher
 * 第七步：计算属性的watcher会把dirty设置为true，等待computed来取值
 * 第八步：通知组件的watcher更新视图
 * 第九步：更新视图过程中，会再次访问计算属性，为了获取其值，就会执行computedGetter函数，从而获取最新值
 *        。如果没有用到就不会执行，从而实现缓存和惰性求值
 */
function initComputed (vm: Component, computed: Object) {
  // $flow-disable-line
  const watchers = vm._computedWatchers = Object.create(null)
  // computed properties are just getters during SSR
  const isSSR = isServerRendering()

  for (const key in computed) {
    const userDef = computed[key]
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    // 抛出警告，没有设置getter
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        `Getter is missing for computed property "${key}".`,
        vm
      )
    }

    if (!isSSR) {
      // create internal watcher for the computed property.
      // 内部watcher
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      )
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    /** 判断computed是否和其他选项冲突 */
    if (!(key in vm)) {
      // 如果没有则调用为当前实例设置计算属性
      defineComputed(vm, key, userDef)
    } else if (process.env.NODE_ENV !== 'production') {
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      } else if (vm.$options.methods && key in vm.$options.methods) {
        warn(`The computed property "${key}" is already defined as a method.`, vm)
      }
    }
  }
}
// 为当前实例设置计算属性
export function defineComputed (
  target: any,
  key: string,
  userDef: Object | Function
) {
  const shouldCache = !isServerRendering()
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key) // 创建一个具有缓存功能的getter
      : createGetterInvoker(userDef)
    sharedPropertyDefinition.set = noop
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop
    sharedPropertyDefinition.set = userDef.set || noop
  }
  // 如果没有set设置器，则设置一个默认的设置器，拦截错误的设置
  if (process.env.NODE_ENV !== 'production' &&
      sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      )
    }
  }
  // sharedPropertyDefinition是一个默认属性描述符
  /**
   * {
   *    enumerable: true,
   *    configurable: true,
   *    get
   *    set
   * }
   * 模版使用
   */
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
// 为computed设置一个带缓存功能的getter
// 模版使用到这个属性时，会通过get函数获取值，computed的get就是这里返回的computedGetter
function createComputedGetter (key) {
  return function computedGetter () {
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      // dirty用来标记是否需要重新计算获取新值
      if (watcher.dirty) {
        // 触发watcher重新计算获取值
        // 获取值时，会执行getter的执行，访问computed依赖的属性
        // 对应的属性会把computed对应的watch收集为依赖，
        // 属性变化时触发更新
        // 即把dirty属性设置为true，下次访问计算属性时就会重新计算
        watcher.evaluate()
      }
      // 虚拟DOM渲染视图时，是放在一个watcher中执行的，并且这个watcher会被设置为
      // 依赖，渲染视图过程中读到某个属性时就会触发这个属性的依赖收集，把渲染视图的那个
      // watch收集为依赖。
      // 计算属性不同的是，它会通知计算属性依赖的属性触发依赖收集，计算属性本身并不进行
      // 依赖收集，所以计算属性依赖的属性发生变化时，会通知视图更新
      if (Dep.target) {
        // 通知计算属性依赖的属性进行依赖收集，这里收集的代表组件的watcher
        watcher.depend()
      }
      return watcher.value
    }
  }
}

function createGetterInvoker(fn) {
  return function computedGetter () {
    return fn.call(this, this)
  }
}
/** 初始化方法 */
function initMethods (vm: Component, methods: Object) {
  const props = vm.$options.props
  for (const key in methods) {
    if (process.env.NODE_ENV !== 'production') {
      // 开发环境，判断methods中的值类型是否是方法，控制台打印警告
      if (typeof methods[key] !== 'function') {
        warn(
          `Method "${key}" has type "${typeof methods[key]}" in the component definition. ` +
          `Did you reference the function correctly?`,
          vm
        )
      }
      // 和props冲突
      if (props && hasOwn(props, key)) {
        warn(
          `Method "${key}" has already been defined as a prop.`,
          vm
        )
      }
      // 是否是保留字
      if ((key in vm) && isReserved(key)) {
        warn(
          `Method "${key}" conflicts with an existing Vue instance method. ` +
          `Avoid defining component methods that start with _ or $.`
        )
      }
    }
    // 设置空函数，绑定当前实例为this
    vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm)
  }
}
/** 初始化watch */
function initWatch (vm: Component, watch: Object) {
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}
/** 创建watch */
function createWatcher (
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: Object
) {
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  return vm.$watch(expOrFn, handler, options)
}
// 数据相关的实例属性\实例方法
export function stateMixin (Vue: Class<Component>) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  const dataDef = {}
  dataDef.get = function () { return this._data }
  const propsDef = {}
  propsDef.get = function () { return this._props }
  if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function () {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      )
    }
    propsDef.set = function () {
      warn(`$props is readonly.`, this)
    }
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  Object.defineProperty(Vue.prototype, '$props', propsDef)

  Vue.prototype.$set = set
  Vue.prototype.$delete = del
  // VUE实例API $watch
  Vue.prototype.$watch = function (
    expOrFn: string | Function,
    cb: any,
    options?: Object
  ): Function {
    const vm: Component = this
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {}
    // 标记是否是用户创建的watcher实例
    options.user = true
    const watcher = new Watcher(vm, expOrFn, cb, options)
    // 立即执行回调函数
    if (options.immediate) {
      const info = `callback for immediate watcher "${watcher.expression}"`
      pushTarget()
      invokeWithErrorHandling(cb, vm, [watcher.value], vm, info)
      popTarget()
    }
    // 返回一个取消观察函数
    return function unwatchFn () {
      watcher.teardown()
    }
  }
}
