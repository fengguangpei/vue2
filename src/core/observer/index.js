/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array' // Array.prototype原型方法的代理原型,扮演中间人的角色
import {
  def,
  warn,
  hasOwn,
  hasProto, // 是否可以通过__proto__获取原型
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering // 判断是否是服务端渲染
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    // 数组、对象的依赖实例在这里定义，对象属性的依赖实例在defineReactive中定义
    // 对象的并不会用到
    this.dep = new Dep()
    this.vmCount = 0
    // 给value新增一个__ob__属性，值为该value的Observer实例
    // 相当于为value打上标记，表示它已经转化为响应式了，避免重复操作
    def(value, '__ob__', this)
    // 处理数组的响应式
    if (Array.isArray(value)) {
      // 是否可以通过__proto__获取原型
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      // 递归遍历数组
      this.observeArray(value)
    } else {
      // 处理对象的响应式
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
// 设置数组的中间代理对象原型
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
// 不支持__proto__的环境, 则直接拷贝到数组实例上
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {
  // 原始类型或者VNode跳过
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  // 是否已处理过响应式
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve &&  // 是否应该响应式
    !isServerRendering() && /// 是否是服务端渲染
    (Array.isArray(value) || isPlainObject(value)) && // 是否是数组或者对象，排除Set、Map等其他对象
    Object.isExtensible(value) && // 是否可以扩展
    !value._isVue // 不是Vue构造函数
  ) {
    ob = new Observer(value)
  }
  // 根对象，实例数量加一
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function, // 定义set时执行的拦截器
  shallow?: boolean // 是否要递归
) {
  // 对象属性的依赖实例
  const dep = new Dep()
  // 对象属性不可配置
  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
  // 处理没有传入具体的值
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }
  // ⚠️
  // 大部分情况shallow默认是false的，即默认递归observe。
  // - 当val是数组时，childOb被用来向当前watcher收集依赖
  // - 当val是普通对象时，set/del函数也会用childOb来通知val的属性添加/删除
  let childOb = !shallow && observe(val)
  // 监听get, 收集依赖
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend()
        // 现在问题是为什么要依赖 childOb 呢？
        // 考虑到如果 value 是数组，那么 value 的 push/shift 之类的操作，
        // 是触发不了下面的 setter 的，即 dep.depend 在这种情况不会被调用。
        // 此时，childOb 即value这个数组对应的 ob，数组的操作会通知到childOb，
        // 所以可以替代 dep 来通知 watcher。
        if (childOb) {
          // 数组的依赖收集也是在get中，因为递归数组优先
          childOb.dep.depend()
          if (Array.isArray(value)) {
            // 嵌套数组，都会把引用当前这个属性的实例watcher收集为watcher
            dependArray(value)
          }
        }
      }
      return value
    },
    // 
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      // 排除NaN
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      /** 自定义设置器，比如修改props时，开发环境打印警告 */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      // 访问器属性没有setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = !shallow && observe(newVal)
      // 触发依赖更新
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set (target: Array<any> | Object, key: any, val: any): any {
  // isUndef：判断undefined isPrimitive: 判断原始值
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  // 处理数组
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  // 处理对象
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  // 目标对象不能是vue实例或者vue实例根数据
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  // 不是响应式对象
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  // 通知更新
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  // 不是响应式对象
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
/**
 * 举个例子，
 * data() {
 *  return {
 *    test: [
 *       [],
 *       []
 *    ]
 *  }
 * }
 * 在VUE2中，如果模版使用了test这个属性，那么不管test数组中的嵌套数组有没有被用到，都会把用到test属性的
 * 组件实例对应的依赖收集为自己的依赖。这种情况下，执行test[0].push(3)原则上是不需要更新视图的，事实上却重新更新了视图。
 * 这是VUE2响应式的一个缺陷
 * 
 * test: [
 *  {
 *    name: 'fenggp'
 *  }
 * ]
 * 这种情况下只要没有引用到name属性，那么执行test[0].name = 'test'时不会更新视图，由此可见Object和Array的区别
 * 
 * VUE3解决了这个问题，只要模版中没有用到的，就不会被错误的收集依赖
 */
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
