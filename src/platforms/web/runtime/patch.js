/* @flow */

import * as nodeOps from 'web/runtime/node-ops' // DOM操作函数
import { createPatchFunction } from 'core/vdom/patch' 
import baseModules from 'core/vdom/modules/index'
import platformModules from 'web/runtime/modules/index'

// the directive module should be applied last, after all
// built-in modules have been applied.
// platformModules: 渲染时的钩子函数，DOM节点创建完之后，还需要有标签属性，样式，事件绑定
// baseModules: 处理ref，指令directives
const modules = platformModules.concat(baseModules)
// patch函数的实现
export const patch: Function = createPatchFunction({ nodeOps, modules })
