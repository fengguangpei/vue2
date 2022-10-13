/* @flow */
// render函数接收的h函数逻辑
import config from '../config'
import VNode, { createEmptyVNode } from './vnode'
import { createComponent } from './create-component'
import { traverse } from '../observer/traverse'

import {
  warn,
  isDef,
  isUndef,
  isTrue,
  isObject,
  isPrimitive,
  // 查找filters、directive、components
  resolveAsset
} from '../util/index'

import {
  normalizeChildren,
  simpleNormalizeChildren
} from './helpers/index'

const SIMPLE_NORMALIZE = 1
const ALWAYS_NORMALIZE = 2

// wrapper function for providing a more flexible interface
// without getting yelled at by flow
// _createElement函数的封装，接收的参数更加灵活
export function createElement (
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any, // 区分以何种方式规范children
  alwaysNormalize: boolean
): VNode | Array<VNode> {
  // 如果data没有设置，则第三个参数就是children
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children
    children = data
    data = undefined
  }
  // 手写的render函数alwaysNormalize一定为true
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE
  }
  return _createElement(context, tag, data, children, normalizationType)
}
// 创建VNode的函数
export function _createElement (
  context: Component, // 执行上下文
  tag?: string | Class<Component> | Function | Object, // 标签、组件
  data?: VNodeData, // VNode数据
  children?: any, // 后代节点
  normalizationType?: number
): VNode | Array<VNode> {
  // 判断data是否响应式的，是则直接返回一个空的VNode
  if (isDef(data) && isDef((data: any).__ob__)) {
    process.env.NODE_ENV !== 'production' && warn(
      `Avoid using observed data object as vnode data: ${JSON.stringify(data)}\n` +
      'Always create fresh vnode data objects in each render!',
      context
    )
    return createEmptyVNode()
  }
  // 处理ul的子节点只能是li这种情况
  // object syntax in v-bind
  if (isDef(data) && isDef(data.is)) {
    tag = data.is
  }
  // 创建空节点
  if (!tag) {
    // in case of component :is set to falsy value
    return createEmptyVNode()
  }
  // warn against non-primitive key
  // 绑定的key不能是非原始类型
  if (process.env.NODE_ENV !== 'production' &&
    isDef(data) && isDef(data.key) && !isPrimitive(data.key)
  ) {
    if (!__WEEX__ || !('@binding' in data.key)) {
      warn(
        'Avoid using non-primitive value as key, ' +
        'use string/number value instead.',
        context
      )
    }
  }
  // support single function children as default scoped slot
  // 如果children的第一个元素是函数，那么这个函数会被当作作用域插槽，并且抛弃后面的子元素
  if (Array.isArray(children) &&
    typeof children[0] === 'function'
  ) {
    data = data || {}
    data.scopedSlots = { default: children[0] }
    children.length = 0
  }
  // 格式化children，children可以有不同的形式
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children)
  }
  else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children)
  }
  let vnode, ns
  // 字符串
  if (typeof tag === 'string') {
    let Ctor
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)
    // 原始标签
    if (config.isReservedTag(tag)) {
      // platform built-in elements
      // .native修饰符不能用于原始标签
      if (process.env.NODE_ENV !== 'production' && isDef(data) && isDef(data.nativeOn) && data.tag !== 'component') {
        warn(
          `The .native modifier for v-on is only valid on components but it was used on <${tag}>.`,
          context
        )
      }
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      )
    }
    // component组件
    // resolveAsset(A, B, C)，在A的B中查找是否存在C
    else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      // component
      // Ctor：组件
      vnode = createComponent(Ctor, data, context, children, tag)
    }
    // 自定义元素
    else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      )
    }
  }
  // 组件选项
  else {
    // direct component options / constructor
    vnode = createComponent(tag, data, context, children)
  }
  if (Array.isArray(vnode)) {
    return vnode
  } else if (isDef(vnode)) {
    if (isDef(ns)) applyNS(vnode, ns)
    // 这个方法的作用可以搜索 ref #5318 这个issue
    if (isDef(data)) registerDeepBindings(data)
    return vnode
  } else {
    return createEmptyVNode()
  }
}

function applyNS (vnode, ns, force) {
  vnode.ns = ns
  if (vnode.tag === 'foreignObject') {
    // use default namespace inside foreignObject
    ns = undefined
    force = true
  }
  if (isDef(vnode.children)) {
    for (let i = 0, l = vnode.children.length; i < l; i++) {
      const child = vnode.children[i]
      if (isDef(child.tag) && (
        isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
        applyNS(child, ns, force)
      }
    }
  }
}

// ref #5318
// necessary to ensure parent re-render when deep bindings like :style and
// :class are used on slot nodes
/**
 * <template>
 *  <test>
 *    <h1 :style="obj">Hello world</h1>
 *  </test>
 *  <button @click="change">change</button>
 * </template>
 * <script>
 *  export default {
 *    components: {
 *      Test: {
 *        render(h) {
 *          return h('h1', {}, this.$slots.default)
 *        }
 *      }
 *    },
 *    data() {
 *      return {
 *        obj: { color: 'red' }
 *      }
 *    },
 *    methods: {
 *      change() {
 *        this.obj.color = 'green'
 *      }
 *    }
 *  }
 * </script>
 * 在这个例子中，传给test组件的默认插槽default对应的Vnode是在当前组件作用域执行的
 * 所以，会触发obj属性的依赖收集，由于没有读取obj.color属性，所以并不会触发color属性的依赖收集
 * 
 * 子组件在渲染时，会访问default插槽，这个过程中会在创建元素后，根据style绑定设置样式，触发color属性的依赖收集
 * 
 * 在父组件点击change按钮，修改color属性，触发子组件的更新，但是并不会触发父组件的更新，所以默认插槽并不会更新【默认插槽在父组件作用域生成】
 * 
 * 为了解决这个问题，在父组件生成default插槽时，深度遍历style绑定值，触发依赖收集
 */
function registerDeepBindings (data) {
  if (isObject(data.style)) {
    traverse(data.style)
  }
  if (isObject(data.class)) {
    traverse(data.class)
  }
}
