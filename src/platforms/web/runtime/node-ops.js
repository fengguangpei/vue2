/* @flow */

import { namespaceMap } from 'web/util/index'
// 创建一个元素
export function createElement (tagName: string, vnode: VNode): Element {
  const elm = document.createElement(tagName)
  if (tagName !== 'select') {
    return elm
  }
  // false or null will remove the attribute but undefined will not
  if (vnode.data && vnode.data.attrs && vnode.data.attrs.multiple !== undefined) {
    elm.setAttribute('multiple', 'multiple')
  }
  return elm
}
// 创建一个具有命名空间的元素，比如svg
export function createElementNS (namespace: string, tagName: string): Element {
  return document.createElementNS(namespaceMap[namespace], tagName)
}
// 文本节点
export function createTextNode (text: string): Text {
  return document.createTextNode(text)
}
// 注释节点
export function createComment (text: string): Comment {
  return document.createComment(text)
}
// 在指定元素前插入一个新的元素
export function insertBefore (parentNode: Node, newNode: Node, referenceNode: Node) {
  parentNode.insertBefore(newNode, referenceNode)
}
// 删除子元素
export function removeChild (node: Node, child: Node) {
  node.removeChild(child)
}
// 添加元素
export function appendChild (node: Node, child: Node) {
  node.appendChild(child)
}
// 返回父节点
export function parentNode (node: Node): ?Node {
  return node.parentNode
}
// 后面紧跟的元素
export function nextSibling (node: Node): ?Node {
  return node.nextSibling
}
// 标签名
export function tagName (node: Element): string {
  return node.tagName
}
// 设置文本 textContent和innerText的区别[https://www.zhangxinxu.com/wordpress/2019/09/js-dom-innertext-textcontent/]
export function setTextContent (node: Node, text: string) {
  node.textContent = text
}

export function setStyleScope (node: Element, scopeId: string) {
  node.setAttribute(scopeId, '')
}
