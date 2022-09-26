/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'
import config from '../config'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    this.subs = []
  }
  // 添加依赖
  addSub (sub: Watcher) {
    this.subs.push(sub)
  }
  // 删除依赖
  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }
  // 让watcher知道自己被谁作为依赖收集了
  depend () {
    // Dep.target是一个watcher实例
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }
  // 通知更新
  notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
Dep.target = null
// 被收集的依赖的栈
const targetStack = []
// 设置当前被收集的依赖-watcher
// $options.data的函数执行时，会pushTarget()，设置一个空的target，
// 避免函数执行时访问响应式数据比如props，造成错误的依赖收集
export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}
// 当前被收集的依赖watcher出栈
export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
