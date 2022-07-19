import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
// 控制台警告方法
import { warn } from '../util/index'
/** Vue构造函数 */
function Vue (options) {
  /** 避免构造函数被直接调用 */
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue) 
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}
/** 原型挂载初始化方法 */
initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
