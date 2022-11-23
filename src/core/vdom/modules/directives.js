/* @flow */
// bind
// inserted
// update
// componentUpdate
// unbind
import { emptyNode } from 'core/vdom/patch'
import { resolveAsset, handleError } from 'core/util/index'
import { mergeVNodeHook } from 'core/vdom/helpers/index'
// 注册钩子函数，处理指令逻辑
export default {
  create: updateDirectives,
  update: updateDirectives,
  destroy: function unbindDirectives (vnode: VNodeWithData) {
    updateDirectives(vnode, emptyNode)
  }
}

function updateDirectives (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (oldVnode.data.directives || vnode.data.directives) {
    _update(oldVnode, vnode)
  }
}

function _update (oldVnode, vnode) {
  // 新创建节点
  const isCreate = oldVnode === emptyNode
  // 正在销毁节点
  const isDestroy = vnode === emptyNode
  // 格式化指令
  const oldDirs = normalizeDirectives(oldVnode.data.directives, oldVnode.context)
  const newDirs = normalizeDirectives(vnode.data.directives, vnode.context)
  // 需要触发insert钩子函数的指令列表
  const dirsWithInsert = []
  // 需要触发postPatch钩子函数的指令列表
  const dirsWithPostpatch = []

  let key, oldDir, dir
  // 遍历指令
  for (key in newDirs) {
    oldDir = oldDirs[key]
    dir = newDirs[key]
    if (!oldDir) {
      // new directive, bind
      // 新指令，调用bind钩子函数
      callHook(dir, 'bind', vnode, oldVnode)
      // 收集需要触发insert指令的指令
      if (dir.def && dir.def.inserted) {
        dirsWithInsert.push(dir)
      }
    } else {
      // existing directive, update
      dir.oldValue = oldDir.value
      dir.oldArg = oldDir.arg
      // 触发update钩子函数
      callHook(dir, 'update', vnode, oldVnode)
      // 收集需要触发postPatch钩子函数的指令
      if (dir.def && dir.def.componentUpdated) {
        dirsWithPostpatch.push(dir)
      }
    }
  }

  if (dirsWithInsert.length) {
    const callInsert = () => {
      for (let i = 0; i < dirsWithInsert.length; i++) {
        callHook(dirsWithInsert[i], 'inserted', vnode, oldVnode)
      }
    }
    // 新创建vnode，合并insert钩子函数到vnode.data.hook中
    if (isCreate) {
      mergeVNodeHook(vnode, 'insert', callInsert)
    }
    // 直接调用
    else {
      callInsert()
    }
  }
  // 合并postPatch钩子函数
  if (dirsWithPostpatch.length) {
    mergeVNodeHook(vnode, 'postpatch', () => {
      for (let i = 0; i < dirsWithPostpatch.length; i++) {
        callHook(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode)
      }
    })
  }
  // 旧节点有，新节点没有的指令。执行unbind钩子函数
  if (!isCreate) {
    for (key in oldDirs) {
      if (!newDirs[key]) {
        // no longer present, unbind
        callHook(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy)
      }
    }
  }
}

const emptyModifiers = Object.create(null)

function normalizeDirectives (
  dirs: ?Array<VNodeDirective>,
  vm: Component
): { [key: string]: VNodeDirective } {
  const res = Object.create(null)
  if (!dirs) {
    // $flow-disable-line
    return res
  }
  let i, dir
  for (i = 0; i < dirs.length; i++) {
    dir = dirs[i]
    if (!dir.modifiers) {
      // $flow-disable-line
      dir.modifiers = emptyModifiers
    }
    res[getRawDirName(dir)] = dir
    dir.def = resolveAsset(vm.$options, 'directives', dir.name, true)
  }
  // $flow-disable-line
  return res
}

function getRawDirName (dir: VNodeDirective): string {
  return dir.rawName || `${dir.name}.${Object.keys(dir.modifiers || {}).join('.')}`
}
// 调用指令钩子函数
function callHook (dir, hook, vnode, oldVnode, isDestroy) {
  const fn = dir.def && dir.def[hook]
  if (fn) {
    try {
      fn(vnode.elm, dir, vnode, oldVnode, isDestroy)
    } catch (e) {
      handleError(e, vnode.context, `directive ${dir.name} ${hook} hook`)
    }
  }
}
