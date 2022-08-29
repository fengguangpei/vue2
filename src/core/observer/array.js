/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'

const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)
// 操作数组会触发更新的七个方法
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method] // Array.prototype上的原型方法
  def(arrayMethods, method, function mutator (...args) {
    const result = original.apply(this, args)
    // Observer实例
    // 原型方法只能通过实例调用，所以这里的this指向数组
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    // 通过数组的方法新增的元素, 一样需要被响应式监听
    if (inserted) ob.observeArray(inserted)
    // notify change
    // 数组的依赖是从Observer实例上获取的
    ob.dep.notify() // 触发更新
    // 返回结果
    return result
  })
})
