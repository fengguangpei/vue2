/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { defineComputed, proxy } from '../instance/state'
import { extend, mergeOptions, validateComponentName } from '../util/index'

export function initExtend (Vue: GlobalAPI) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0
  let cid = 1

  /**
   * Class inheritance
   */
  Vue.extend = function (extendOptions: Object): Function {
    extendOptions = extendOptions || {}
    const Super = this // 指向父类，即Vue
    const SuperId = Super.cid // 唯一标识
    // 缓存池，缓存创建出来的类，这里extendOptions是我们传入的对象，这里会为其新增一个_Ctor属性，用来缓存创建的子类
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    // 缓存组件的构造函数，命中缓存直接返回，这个缓存是存在传入的对象上的
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }
    // 验证组件名
    const name = extendOptions.name || Super.options.name
    if (process.env.NODE_ENV !== 'production' && name) {
      validateComponentName(name)
    }
    // 这里的this指向Vue构造函数
    // Sub是Vue的子类
    const Sub = function VueComponent (options) {
      this._init(options)
    }
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    Sub.cid = cid++
    // 合并选项，super.options是Vue内部的选项，继承时会扩展这个选项，将来会和用户传入的option合并
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )
    // 存储父类
    Sub['super'] = Super

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    // 把props、computed代理到原型上，避免每个实例都执行一次
    /**
     * const Child = Vue.extend({
     *  props: {
     *    name: String
     *  }
     * })
     * const VM = new Child({
     *  props: {
     *    age: Number
     *  }
     * })
     * 实例化时会根据options.props格式化options.props，
     * 然后再根据config全局配置的合并策略和Vue.extend()时的props合并，
     * 但是并不会代理Vue.extend()时的传递的props，所以extend的时候必须初始化好props
     */
    if (Sub.options.props) {
      initProps(Sub)
    }
    if (Sub.options.computed) {
      initComputed(Sub)
    }

    // allow further extension/mixin/plugin usage
    // 复制Vue.extend、Vue.mixin、Vue.use静态方法
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use

    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type]
    })
    // enable recursive self-lookup
    // 组册自己为自己的components，允许递归组件
    if (name) {
      Sub.options.components[name] = Sub
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    // 子类独有的方法
    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    Sub.sealedOptions = extend({}, Sub.options)

    // cache constructor
    // 缓存创建的子类，下一次使用Vue.extend传递一样的参数时，直接返回，提高性能
    cachedCtors[SuperId] = Sub
    return Sub
  }
}

function initProps (Comp) {
  const props = Comp.options.props
  // 代理原型上的key，到_props上取值
  for (const key in props) {
    proxy(Comp.prototype, `_props`, key)
  }
}

function initComputed (Comp) {
  const computed = Comp.options.computed
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key])
  }
}
