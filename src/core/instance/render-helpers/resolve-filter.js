/* @flow */

import { identity, resolveAsset } from 'core/util/index'

/**
 * Runtime helper for resolving filters
 * 查找并返回指定的过滤器
 */
export function resolveFilter (id: string): Function {
  // 查找，找不到则返回identity
  return resolveAsset(this.$options, 'filters', id, true) || identity
}
