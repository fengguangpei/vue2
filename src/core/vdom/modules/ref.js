/* @flow */

import { remove, isDef } from "shared/util";
// ref实现
export default {
  // create钩子
  create(_: any, vnode: VNodeWithData) {
    // 绑定
    registerRef(vnode);
  },
  // update钩子
  update(oldVnode: VNodeWithData, vnode: VNodeWithData) {
    // 如果绑定值的值不一样
    if (oldVnode.data.ref !== vnode.data.ref) {
      // 先解除绑定
      registerRef(oldVnode, true);
      // 重新绑定
      registerRef(vnode);
    }
  },
  // destroy钩子
  destroy(vnode: VNodeWithData) {
    // 解除绑定
    registerRef(vnode, true);
  },
};

export function registerRef(vnode: VNodeWithData, isRemoval: ?boolean) {
  const key = vnode.data.ref;
  // 没有提供key直接跳过
  if (!isDef(key)) return;

  const vm = vnode.context;
  // 组件的ref指向组件实例
  // 普通DOM节点的ref指向该元素
  const ref = vnode.componentInstance || vnode.elm;
  // $refs数据结构
  const refs = vm.$refs;
  // 解除绑定分支
  if (isRemoval) {
    if (Array.isArray(refs[key])) {
      remove(refs[key], ref);
    } else if (refs[key] === ref) {
      refs[key] = undefined;
    }
  }
  // 新增绑定分支
  else {
    // ref和v-for配合使用时，ref是一个数组
    if (vnode.data.refInFor) {
      if (!Array.isArray(refs[key])) {
        refs[key] = [ref];
      } else if (refs[key].indexOf(ref) < 0) {
        // $flow-disable-line
        refs[key].push(ref);
      }
    } else {
      refs[key] = ref;
    }
  }
}
