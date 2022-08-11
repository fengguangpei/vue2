/* @flow */
// 全局配置比如Vue.config
import config from '../config'
// Vue.use
import { initUse } from './use'
// Vue.mixin
import { initMixin } from './mixin'
// Vue.extend
import { initExtend } from './extend'
// Vue.component、Vue.directive、Vue.filter
import { initAssetRegisters } from './assets'
// Vue.set、Vue.delete
import { set, del } from '../observer/index'
// [component, directive, filter]
import { ASSET_TYPES } from 'shared/constants'
// keepAlive内置组件
import builtInComponents from '../components/index'
// Vue.observable
import { observe } from 'core/observer/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  const configDef = {}
  configDef.get = () => config
  // 开发环境，拦截config的设置，打印警告
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  // 内部代码使用的工具函数
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  // 2.6 explicit observable API
  Vue.observable = obj => {
    observe(obj)
    return obj
  }
  // 组件、指令、过滤器
  Vue.options = Object.create(null)
  // ASSET_TYPES: component、directive、filter
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue
  // extend：合并对象 builtInComponents：内部组件KeepAlive
  extend(Vue.options.components, builtInComponents)
  // 挂载Vue.use静态方法
  initUse(Vue)
  // 挂载Vue.mixin静态方法
  initMixin(Vue)
  // 挂载Vue.extend静态方法
  initExtend(Vue)
  // 挂载Vue.component()、Vue.directive()、Vue.filter()静态方法
  initAssetRegisters(Vue)
}
