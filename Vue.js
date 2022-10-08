class Vue {
  _uid = 0
  _isVue = true
  _self = null
  _renderProxy = null
  $options = {
    el: null,
    _propKeys: {},
    template: null,
    delimiters: null,
    comments: null,
    render() {},
    staticRenderFns () {}
  }
  // 生命周期相关
  $parent = null
  $router = null
  $children = null
  $refs = null
  _watcher = null
  _inactive = null
  _directInactive = null
  _isMounted = false
  _isDestroyed = false
  _isBeingDestroyed = false
  // 事件相关
  _events = {}
  // render相关
  _vnode = null
  _staticTrees = null
  $vnode = null
  $slot = null
  $scopeSlots = null
  _c() {}
  $createElement() {}
  $attrs = {}
  $listeners = {}
  // 数据相关
  _watchers = {}
  _data = {}
  _props = {}
  _computedWatchers = {}
  // 依赖注入
  _injected = {}
  _provided = {}
  config = {
    optionMergeStrategies: {},
    silent: false,
    productionTip: false,
    devtools: process.env.NODE_ENV !== 'production',
    performance: false,
    errorHandler: null,
    warnHandler: null,
    ignoredElements: [],
    keyCodes: {},
    isReservedTag: null,
    isReservedAttr: null,
    isUnknownElement: null,
    getTagNamespace: null,
    parsePlatformTagName: null,
    mustUseProp: null,
    async: true,
    _lifecycleHooks: [
      'beforeCreate',
      'created',
      'beforeMount',
      'mounted',
      'beforeUpdate',
      'updated',
      'beforeDestroy',
      'destroyed',
      'activated',
      'deactivated',
      'errorCaptured',
      'serverPrefetch'
    ]
  }
  util = {
    warn: null,
    extend: null,
    mergeOptions: null,
    defineReactive: null
  }
  options = {
    components: {

      // 全局KeepAlive组件
      KeepAlive: {}
    },
    directives: {},
    filters: {},
    _base: Vue
  }
  get configDef() {
    return this.config
  }
  constructor (options) {
    this._init(options)
  }
  // 全局静态API
  static set() {}
  static delete() {}
  static nextTick() {}
  static observable() {}
  static use() {}
  static mixin() {}
  static extend() {}
  static component() {}
  static directive() {}
  static filter() {}
  // 实例API
  $mount() {}
  _init() {}
  _update() {}
  __patch__() {}
}
export default Vue