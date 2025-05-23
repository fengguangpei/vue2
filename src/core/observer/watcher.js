/* @flow */
/**
 * watcher实现思路
 * 第一步：所有的数据都已经是响应式的了
 * 第二步：实例化watcher
 * 第三步：把自己设置为被收集的依赖
 * 第四步：模拟数据的读取，触发依赖收集，收集自己作为读到的数据的依赖
 * 数据发生变化时，就会通知自己，执行回调callback
 */
import {
  warn,
  remove,
  isObject,
  parsePath,
  _Set as Set,
  handleError,
  invokeWithErrorHandling,
  noop,
} from "../util/index";

import { traverse } from "./traverse";
import { queueWatcher } from "./scheduler";
import Dep, { pushTarget, popTarget } from "./dep";

import type { SimpleSet } from "../util/index";

let uid = 0;

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
export default class Watcher {
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  before: ?Function;
  getter: Function;
  value: any;

  constructor(
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    // 是否是组件更新的watcher实例
    isRenderWatcher?: boolean
  ) {
    this.vm = vm;
    // 收集组件渲染的watcher
    // $forceUpdate这个方法会用到
    if (isRenderWatcher) {
      vm._watcher = this;
    }
    vm._watchers.push(this);
    // 处理options选项赋值
    if (options) {
      this.deep = !!options.deep; // 深度监听
      this.user = !!options.user; // 用户创建的watcher实例
      this.lazy = !!options.lazy;
      this.sync = !!options.sync; // 同步更新
      this.before = options.before;
    } else {
      // 默认值都是false
      this.deep = this.user = this.lazy = this.sync = false;
    }
    // 响应监听回调
    this.cb = cb;
    this.id = ++uid; // uid for batching
    this.active = true;
    this.dirty = this.lazy; // for lazy watchers computed计算属性缓存使用到
    // 记录自己被哪些Dep实例收集
    this.deps = [];
    this.newDeps = [];
    this.depIds = new Set();
    this.newDepIds = new Set();
    this.expression =
      process.env.NODE_ENV !== "production" ? expOrFn.toString() : "";
    // parse expression for getter
    // 生成访问器getter，后面调用它触发依赖收集
    if (typeof expOrFn === "function") {
      this.getter = expOrFn;
    } else {
      // 解析路径，返回一个获取路径值的闭包函数
      this.getter = parsePath(expOrFn);
      if (!this.getter) {
        this.getter = noop;
        process.env.NODE_ENV !== "production" &&
          warn(
            `Failed watching path: "${expOrFn}" ` +
              "Watcher only accepts simple dot-delimited paths. " +
              "For full control, use a function instead.",
            vm
          );
      }
    }
    this.value = this.lazy ? undefined : this.get();
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  // 读取监听的值，触发依赖收集
  get() {
    // 设置当前被收集的依赖，即当前这个watcher实例
    pushTarget(this);
    let value;
    const vm = this.vm;
    try {
      value = this.getter.call(vm, vm);
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`);
      } else {
        throw e;
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      /**
       * 深度监听，遍历当前值，由于104行已通过pushTarget设置当前watcher
       * 所以都可以收集到当前watcher
       */

      if (this.deep) {
        traverse(value);
      }
      popTarget();
      this.cleanupDeps();
    }
    return value;
  }

  /**
   * Add a dependency to this directive.
   * 收集当前watch执行时，都会重新收集依赖，新旧两次执行时可能需要的依赖不一样，
   * 所以心中newDeps、newDepIds两个数据结构收集最新的依赖
   * 执行完后，执行cleanupDeps对比新旧两次的依赖，删除不需要的依赖
   */
  addDep(dep: Dep) {
    const id = dep.id;
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id);
      this.newDeps.push(dep);
      if (!this.depIds.has(id)) {
        dep.addSub(this);
      }
    }
  }

  /**
   * Clean up for dependency collection.
   * 对比新旧的依赖收集，删除不需要的依赖收集
   */
  cleanupDeps() {
    let i = this.deps.length;
    while (i--) {
      const dep = this.deps[i];
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this);
      }
    }
    let tmp = this.depIds;
    this.depIds = this.newDepIds;
    this.newDepIds = tmp;
    this.newDepIds.clear();
    tmp = this.deps;
    this.deps = this.newDeps;
    this.newDeps = tmp;
    this.newDeps.length = 0;
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update() {
    /* istanbul ignore else */
    // 懒执行
    if (this.lazy) {
      // computed的缓存会用到，如果这个watcher是computed的，就把dirty设置为true，告诉计算属性有新值了
      this.dirty = true;
    }
    // 同步执行
    else if (this.sync) {
      this.run();
    }
    // 异步执行
    else {
      // 把当前watcher添加到队列管理器中
      queueWatcher(this);
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run() {
    if (this.active) {
      const value = this.get();
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        const oldValue = this.value;
        this.value = value;
        if (this.user) {
          const info = `callback for watcher "${this.expression}"`;
          invokeWithErrorHandling(
            this.cb,
            this.vm,
            [value, oldValue],
            this.vm,
            info
          );
        } else {
          this.cb.call(this.vm, value, oldValue);
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  evaluate() {
    this.value = this.get();
    this.dirty = false;
  }

  /**
   * Depend on all deps collected by this watcher.
   */
  depend() {
    let i = this.deps.length;
    while (i--) {
      this.deps[i].depend();
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  teardown() {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this);
      }
      // 从收集自己作为依赖的Dep管理器中删除自己
      let i = this.deps.length;
      while (i--) {
        this.deps[i].removeSub(this);
      }
      this.active = false;
    }
  }
}
