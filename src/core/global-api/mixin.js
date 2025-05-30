/* @flow */

import { mergeOptions } from "../util/index";
// Vue.mixin API
export function initMixin(Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    this.options = mergeOptions(this.options, mixin);
    return this;
  };
}
