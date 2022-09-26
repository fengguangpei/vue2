/* @flow */

import {
  tip,
  hasOwn,
  isDef,
  isUndef,
  hyphenate,
  formatComponentName
} from 'core/util/index'
// props处理, 处理父组件传给子组件的props绑定，生成propsData对象，
// 子组件实例化时，会用propsData去初始化props
export function extractPropsFromVNodeData (
  data: VNodeData,
  Ctor: Class<Component>,
  tag?: string
): ?Object {
  // we are only extracting raw values here.
  // validation and default values are handled in the child
  // component itself.
  // 组件props选项
  const propOptions = Ctor.options.props
  if (isUndef(propOptions)) {
    return
  }
  const res = {}
  // 这里的data是render函数第二个参数
  // attrs是普通的HTML属性，props是要传给子组件的props
  const { attrs, props } = data
  if (isDef(attrs) || isDef(props)) {
    for (const key in propOptions) {
      // 格式化key，驼峰转kebab-case
      const altKey = hyphenate(key)
      if (process.env.NODE_ENV !== 'production') {
        const keyInLowerCase = key.toLowerCase()
        if (
          key !== keyInLowerCase &&
          attrs && hasOwn(attrs, keyInLowerCase)
        ) {
          tip(
            `Prop "${keyInLowerCase}" is passed to component ` +
            `${formatComponentName(tag || Ctor)}, but the declared prop name is` +
            ` "${key}". ` +
            `Note that HTML attributes are case-insensitive and camelCased ` +
            `props need to use their kebab-case equivalents when using in-DOM ` +
            `templates. You should probably use "${altKey}" instead of "${key}".`
          )
        }
      }
      // 检查子组件需要的prop，父组件是否有通过props传
      // 如果父组件没有传，则返回false，触发短路操作
      // 检查子组件需要的prop，父组件是否有通过attrs传
      checkProp(res, props, key, altKey, true) ||
      // attrs命中prop时，会从attrs对象中删除，这样就不会添加到DOM上了
      // 这也是最后一个参数设置为false的作用
      checkProp(res, attrs, key, altKey, false)
    }
  }
  return res
}

function checkProp (
  res: Object,
  hash: ?Object,
  key: string,
  altKey: string,
  preserve: boolean
): boolean {
  if (isDef(hash)) {
    if (hasOwn(hash, key)) {
      res[key] = hash[key]
      if (!preserve) {
        delete hash[key]
      }
      return true
    } else if (hasOwn(hash, altKey)) {
      res[key] = hash[altKey]
      if (!preserve) {
        delete hash[altKey]
      }
      return true
    }
  }
  return false
}
