(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.renderVueComponentToString = factory());
}(this, (function () { 'use strict';

  /*  */

  var emptyObject = Object.freeze({});

  // These helpers produce better VM code in JS engines due to their
  // explicitness and function inlining.
  function isUndef (v) {
    return v === undefined || v === null
  }

  function isDef (v) {
    return v !== undefined && v !== null
  }

  function isTrue (v) {
    return v === true
  }

  function isFalse (v) {
    return v === false
  }

  /**
   * Check if value is primitive.
   */
  function isPrimitive (value) {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      // $flow-disable-line
      typeof value === 'symbol' ||
      typeof value === 'boolean'
    )
  }

  /**
   * Quick object check - this is primarily used to tell
   * objects from primitive values when we know the value
   * is a JSON-compliant type.
   */
  function isObject (obj) {
    return obj !== null && typeof obj === 'object'
  }

  /**
   * Get the raw type string of a value, e.g., [object Object].
   */
  var _toString = Object.prototype.toString;

  function toRawType (value) {
    return _toString.call(value).slice(8, -1)
  }

  /**
   * Strict object type check. Only returns true
   * for plain JavaScript objects.
   */
  function isPlainObject (obj) {
    return _toString.call(obj) === '[object Object]'
  }

  /**
   * Check if val is a valid array index.
   */
  function isValidArrayIndex (val) {
    var n = parseFloat(String(val));
    return n >= 0 && Math.floor(n) === n && isFinite(val)
  }

  function isPromise (val) {
    return (
      isDef(val) &&
      typeof val.then === 'function' &&
      typeof val.catch === 'function'
    )
  }

  /**
   * Convert a value to a string that is actually rendered.
   */
  function toString (val) {
    return val == null
      ? ''
      : Array.isArray(val) || (isPlainObject(val) && val.toString === _toString)
        ? JSON.stringify(val, null, 2)
        : String(val)
  }

  /**
   * Convert an input value to a number for persistence.
   * If the conversion fails, return original string.
   */
  function toNumber (val) {
    var n = parseFloat(val);
    return isNaN(n) ? val : n
  }

  /**
   * Make a map and return a function for checking if a key
   * is in that map.
   */
  function makeMap (
    str,
    expectsLowerCase
  ) {
    var map = Object.create(null);
    var list = str.split(',');
    for (var i = 0; i < list.length; i++) {
      map[list[i]] = true;
    }
    return expectsLowerCase
      ? function (val) { return map[val.toLowerCase()]; }
      : function (val) { return map[val]; }
  }

  /**
   * Check if a tag is a built-in tag.
   */
  var isBuiltInTag = makeMap('slot,component', true);

  /**
   * Check if an attribute is a reserved attribute.
   */
  var isReservedAttribute = makeMap('key,ref,slot,slot-scope,is');

  /**
   * Remove an item from an array.
   */
  function remove (arr, item) {
    if (arr.length) {
      var index = arr.indexOf(item);
      if (index > -1) {
        return arr.splice(index, 1)
      }
    }
  }

  /**
   * Check whether an object has the property.
   */
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  function hasOwn (obj, key) {
    return hasOwnProperty.call(obj, key)
  }

  /**
   * Create a cached version of a pure function.
   */
  function cached (fn) {
    var cache = Object.create(null);
    return (function cachedFn (str) {
      var hit = cache[str];
      return hit || (cache[str] = fn(str))
    })
  }

  /**
   * Camelize a hyphen-delimited string.
   */
  var camelizeRE = /-(\w)/g;
  var camelize = cached(function (str) {
    return str.replace(camelizeRE, function (_, c) { return c ? c.toUpperCase() : ''; })
  });

  /**
   * Capitalize a string.
   */
  var capitalize = cached(function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  });

  /**
   * Hyphenate a camelCase string.
   * 驼峰转kebab-case
   */
  var hyphenateRE = /\B([A-Z])/g;
  var hyphenate = cached(function (str) {
    return str.replace(hyphenateRE, '-$1').toLowerCase()
  });

  /**
   * Mix properties into target object.
   */
  function extend (to, _from) {
    for (var key in _from) {
      to[key] = _from[key];
    }
    return to
  }

  /**
   * Merge an Array of Objects into a single Object.
   */
  function toObject (arr) {
    var res = {};
    for (var i = 0; i < arr.length; i++) {
      if (arr[i]) {
        extend(res, arr[i]);
      }
    }
    return res
  }

  /* eslint-disable no-unused-vars */

  /**
   * Perform no operation.
   * Stubbing args to make Flow happy without leaving useless transpiled code
   * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/).
   */
  function noop (a, b, c) {}

  /**
   * Always return false.
   */
  var no = function (a, b, c) { return false; };

  /* eslint-enable no-unused-vars */

  /**
   * Return the same value.
   */
  var identity = function (_) { return _; };

  /**
   * Generate a string containing static keys from compiler modules.
   */
  function genStaticKeys (modules) {
    return modules.reduce(function (keys, m) {
      return keys.concat(m.staticKeys || [])
    }, []).join(',')
  }

  /**
   * Check if two values are loosely equal - that is,
   * if they are plain objects, do they have the same shape?
   */
  function looseEqual (a, b) {
    if (a === b) { return true }
    var isObjectA = isObject(a);
    var isObjectB = isObject(b);
    if (isObjectA && isObjectB) {
      try {
        var isArrayA = Array.isArray(a);
        var isArrayB = Array.isArray(b);
        if (isArrayA && isArrayB) {
          return a.length === b.length && a.every(function (e, i) {
            return looseEqual(e, b[i])
          })
        } else if (a instanceof Date && b instanceof Date) {
          return a.getTime() === b.getTime()
        } else if (!isArrayA && !isArrayB) {
          var keysA = Object.keys(a);
          var keysB = Object.keys(b);
          return keysA.length === keysB.length && keysA.every(function (key) {
            return looseEqual(a[key], b[key])
          })
        } else {
          /* istanbul ignore next */
          return false
        }
      } catch (e) {
        /* istanbul ignore next */
        return false
      }
    } else if (!isObjectA && !isObjectB) {
      return String(a) === String(b)
    } else {
      return false
    }
  }

  /**
   * Return the first index at which a loosely equal value can be
   * found in the array (if value is a plain object, the array must
   * contain an object of the same shape), or -1 if it is not present.
   */
  function looseIndexOf (arr, val) {
    for (var i = 0; i < arr.length; i++) {
      if (looseEqual(arr[i], val)) { return i }
    }
    return -1
  }

  /*  */

  var isAttr = makeMap(
    'accept,accept-charset,accesskey,action,align,alt,async,autocomplete,' +
    'autofocus,autoplay,autosave,bgcolor,border,buffered,challenge,charset,' +
    'checked,cite,class,code,codebase,color,cols,colspan,content,' +
    'contenteditable,contextmenu,controls,coords,data,datetime,default,' +
    'defer,dir,dirname,disabled,download,draggable,dropzone,enctype,for,' +
    'form,formaction,headers,height,hidden,high,href,hreflang,http-equiv,' +
    'icon,id,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,' +
    'manifest,max,maxlength,media,method,GET,POST,min,multiple,email,file,' +
    'muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,' +
    'preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,' +
    'scope,scoped,seamless,selected,shape,size,type,text,password,sizes,span,' +
    'spellcheck,src,srcdoc,srclang,srcset,start,step,style,summary,tabindex,' +
    'target,title,usemap,value,width,wrap'
  );

  var unsafeAttrCharRE = /[>/="'\u0009\u000a\u000c\u0020]/; // eslint-disable-line no-control-regex
  var isSSRUnsafeAttr = function (name) {
    return unsafeAttrCharRE.test(name)
  };

  /* istanbul ignore next */
  var isRenderableAttr = function (name) {
    return (
      isAttr(name) ||
      name.indexOf('data-') === 0 ||
      name.indexOf('aria-') === 0
    )
  };

  var propsToAttrMap = {
    acceptCharset: 'accept-charset',
    className: 'class',
    htmlFor: 'for',
    httpEquiv: 'http-equiv'
  };

  var ESC = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '&': '&amp;'
  };

  function escape (s) {
    return s.replace(/[<>"&]/g, escapeChar)
  }

  function escapeChar (a) {
    return ESC[a] || a
  }

  var noUnitNumericStyleProps = {
    "animation-iteration-count": true,
    "border-image-outset": true,
    "border-image-slice": true,
    "border-image-width": true,
    "box-flex": true,
    "box-flex-group": true,
    "box-ordinal-group": true,
    "column-count": true,
    "columns": true,
    "flex": true,
    "flex-grow": true,
    "flex-positive": true,
    "flex-shrink": true,
    "flex-negative": true,
    "flex-order": true,
    "grid-row": true,
    "grid-row-end": true,
    "grid-row-span": true,
    "grid-row-start": true,
    "grid-column": true,
    "grid-column-end": true,
    "grid-column-span": true,
    "grid-column-start": true,
    "font-weight": true,
    "line-clamp": true,
    "line-height": true,
    "opacity": true,
    "order": true,
    "orphans": true,
    "tab-size": true,
    "widows": true,
    "z-index": true,
    "zoom": true,
    // SVG
    "fill-opacity": true,
    "flood-opacity": true,
    "stop-opacity": true,
    "stroke-dasharray": true,
    "stroke-dashoffset": true,
    "stroke-miterlimit": true,
    "stroke-opacity": true,
    "stroke-width": true
  };

  /*  */

  // these are reserved for web because they are directly compiled away
  // during template compilation
  // 是否是原生保留属性
  var isReservedAttr = makeMap('style,class');

  // attributes that should be using props for binding
  var acceptValue = makeMap('input,textarea,option,select,progress');
  var mustUseProp = function (tag, type, attr) {
    return (
      (attr === 'value' && acceptValue(tag)) && type !== 'button' ||
      (attr === 'selected' && tag === 'option') ||
      (attr === 'checked' && tag === 'input') ||
      (attr === 'muted' && tag === 'video')
    )
  };

  var isEnumeratedAttr = makeMap('contenteditable,draggable,spellcheck');

  var isValidContentEditableValue = makeMap('events,caret,typing,plaintext-only');

  var convertEnumeratedValue = function (key, value) {
    return isFalsyAttrValue(value) || value === 'false'
      ? 'false'
      // allow arbitrary string value for contenteditable
      : key === 'contenteditable' && isValidContentEditableValue(value)
        ? value
        : 'true'
  };

  var isBooleanAttr = makeMap(
    'allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,' +
    'default,defaultchecked,defaultmuted,defaultselected,defer,disabled,' +
    'enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,' +
    'muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,' +
    'required,reversed,scoped,seamless,selected,sortable,' +
    'truespeed,typemustmatch,visible'
  );

  var isFalsyAttrValue = function (val) {
    return val == null || val === false
  };

  /*  */

  function renderAttrs (node) {
    var attrs = node.data.attrs;
    var res = '';

    var opts = node.parent && node.parent.componentOptions;
    if (isUndef(opts) || opts.Ctor.options.inheritAttrs !== false) {
      var parent = node.parent;
      while (isDef(parent)) {
        // Stop fallthrough in case parent has inheritAttrs option set to false
        if (parent.componentOptions && parent.componentOptions.Ctor.options.inheritAttrs === false) {
          break;
        }
        if (isDef(parent.data) && isDef(parent.data.attrs)) {
          attrs = extend(extend({}, attrs), parent.data.attrs);
        }
        parent = parent.parent;
      }
    }

    if (isUndef(attrs)) {
      return res
    }

    for (var key in attrs) {
      if (isSSRUnsafeAttr(key)) {
        continue
      }
      if (key === 'style') {
        // leave it to the style module
        continue
      }
      res += renderAttr(key, attrs[key]);
    }
    return res
  }

  function renderAttr (key, value) {
    if (isBooleanAttr(key)) {
      if (!isFalsyAttrValue(value)) {
        return (" " + key + "=\"" + key + "\"")
      }
    } else if (isEnumeratedAttr(key)) {
      return (" " + key + "=\"" + (escape(convertEnumeratedValue(key, value))) + "\"")
    } else if (!isFalsyAttrValue(value)) {
      return (" " + key + "=\"" + (escape(String(value))) + "\"")
    }
    return ''
  }

  /*  */

  var VNode = function VNode (
    tag,
    data,
    children,
    text,
    elm,
    context,
    componentOptions,
    asyncFactory
  ) {
    this.tag = tag;
    this.data = data;
    this.children = children;
    this.text = text;
    this.elm = elm;
    this.ns = undefined;
    this.context = context;
    this.fnContext = undefined;
    this.fnOptions = undefined;
    this.fnScopeId = undefined;
    this.key = data && data.key;
    /**
     * {
     * Ctor: Class<Component>;
     * propsData: ?Object;
     * listeners: ?Object;
     * children: ?Array<VNode>;
     * tag?: string;
     * }
     */
    this.componentOptions = componentOptions;
    this.componentInstance = undefined;
    this.parent = undefined;
    this.raw = false;
    this.isStatic = false;
    this.isRootInsert = true;
    this.isComment = false;
    this.isCloned = false;
    this.isOnce = false;
    this.asyncFactory = asyncFactory;
    this.asyncMeta = undefined;
    this.isAsyncPlaceholder = false;
  };

  var prototypeAccessors = { child: { configurable: true } };

  // DEPRECATED: alias for componentInstance for backwards compat.
  /* istanbul ignore next */
  prototypeAccessors.child.get = function () {
    return this.componentInstance
  };

  Object.defineProperties( VNode.prototype, prototypeAccessors );
  // 创建注释节点
  var createEmptyVNode = function (text) {
    if ( text === void 0 ) text = '';

    var node = new VNode();
    node.text = text;
    node.isComment = true;
    return node
  };
  // 创建文本虚拟Node
  function createTextVNode (val) {
    return new VNode(undefined, undefined, undefined, String(val))
  }

  // optimized shallow clone
  // used for static nodes and slot nodes because they may be reused across
  // multiple renders, cloning them avoids errors when DOM manipulations rely
  // on their elm reference.
  // 克隆节点
  function cloneVNode (vnode) {
    var cloned = new VNode(
      vnode.tag,
      vnode.data,
      // #7975
      // clone children array to avoid mutating original in case of cloning
      // a child.
      vnode.children && vnode.children.slice(),
      vnode.text,
      vnode.elm,
      vnode.context,
      vnode.componentOptions,
      vnode.asyncFactory
    );
    cloned.ns = vnode.ns;
    cloned.isStatic = vnode.isStatic;
    cloned.key = vnode.key;
    cloned.isComment = vnode.isComment;
    cloned.fnContext = vnode.fnContext;
    cloned.fnOptions = vnode.fnOptions;
    cloned.fnScopeId = vnode.fnScopeId;
    cloned.asyncMeta = vnode.asyncMeta;
    cloned.isCloned = true;
    return cloned
  }

  /*  */

  function renderDOMProps (node) {
    var props = node.data.domProps;
    var res = '';

    var parent = node.parent;
    while (isDef(parent)) {
      if (parent.data && parent.data.domProps) {
        props = extend(extend({}, props), parent.data.domProps);
      }
      parent = parent.parent;
    }

    if (isUndef(props)) {
      return res
    }

    var attrs = node.data.attrs;
    for (var key in props) {
      if (key === 'innerHTML') {
        setText(node, props[key], true);
      } else if (key === 'textContent') {
        setText(node, props[key], false);
      } else if (key === 'value' && node.tag === 'textarea') {
        setText(node, toString(props[key]), false);
      } else {
        // $flow-disable-line (WTF?)
        var attr = propsToAttrMap[key] || key.toLowerCase();
        if (isRenderableAttr(attr) &&
          // avoid rendering double-bound props/attrs twice
          !(isDef(attrs) && isDef(attrs[attr]))
        ) {
          res += renderAttr(attr, props[key]);
        }
      }
    }
    return res
  }

  function setText (node, text, raw) {
    var child = new VNode(undefined, undefined, undefined, text);
    child.raw = raw;
    node.children = [child];
  }

  /*  */

  /**
   * unicode letters used for parsing html tags, component names and property paths.
   * using https://www.w3.org/TR/html53/semantics-scripting.html#potentialcustomelementname
   * skipping \u10000-\uEFFFF due to it freezing up PhantomJS
   */
  var unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;

  /**
   * Define a property.
   * defineProperty包装函数
   */
  function def (obj, key, val, enumerable) {
    Object.defineProperty(obj, key, {
      value: val,
      enumerable: !!enumerable,
      writable: true,
      configurable: true
    });
  }

  /*  */

  // can we use __proto__?
  var hasProto = '__proto__' in {};

  // Browser environment sniffing
  var inBrowser = typeof window !== 'undefined';
  var inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform;
  var weexPlatform = inWeex && WXEnvironment.platform.toLowerCase();
  var UA = inBrowser && window.navigator.userAgent.toLowerCase();
  var isIE = UA && /msie|trident/.test(UA);
  var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
  var isEdge = UA && UA.indexOf('edge/') > 0;
  var isAndroid = (UA && UA.indexOf('android') > 0) || (weexPlatform === 'android');
  var isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios');
  var isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge;
  var isPhantomJS = UA && /phantomjs/.test(UA);
  var isFF = UA && UA.match(/firefox\/(\d+)/);

  // Firefox has a "watch" function on Object.prototype...
  var nativeWatch = ({}).watch;

  var supportsPassive = false;
  if (inBrowser) {
    try {
      var opts = {};
      Object.defineProperty(opts, 'passive', ({
        get: function get () {
          /* istanbul ignore next */
          supportsPassive = true;
        }
      })); // https://github.com/facebook/flow/issues/285
      window.addEventListener('test-passive', null, opts);
    } catch (e) {}
  }

  // this needs to be lazy-evaled because vue may be required before
  // vue-server-renderer can set VUE_ENV
  var _isServer;
  var isServerRendering = function () {
    if (_isServer === undefined) {
      /* istanbul ignore if */
      if (!inBrowser && !inWeex && typeof global !== 'undefined') {
        // detect presence of vue-server-renderer and avoid
        // Webpack shimming the process
        _isServer = global['process'] && global['process'].env.VUE_ENV === 'server';
      } else {
        _isServer = false;
      }
    }
    return _isServer
  };

  /* istanbul ignore next */
  function isNative (Ctor) {
    return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
  }

  var hasSymbol =
    typeof Symbol !== 'undefined' && isNative(Symbol) &&
    typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys);

  var _Set;
  /* istanbul ignore if */ // $flow-disable-line
  if (typeof Set !== 'undefined' && isNative(Set)) {
    // use native Set when available.
    _Set = Set;
  } else {
    // a non-standard Set polyfill that only works with primitive keys.
    _Set = /*@__PURE__*/(function () {
      function Set () {
        this.set = Object.create(null);
      }
      Set.prototype.has = function has (key) {
        return this.set[key] === true
      };
      Set.prototype.add = function add (key) {
        this.set[key] = true;
      };
      Set.prototype.clear = function clear () {
        this.set = Object.create(null);
      };

      return Set;
    }());
  }

  var SSR_ATTR = "data-server-rendered";

  var ASSET_TYPES = ["component", "directive", "filter"];
  // 生命周期钩子
  var LIFECYCLE_HOOKS = [
    "beforeCreate",
    "created",
    "beforeMount",
    "mounted",
    "beforeUpdate",
    "updated",
    "beforeDestroy",
    "destroyed",
    "activated",
    "deactivated",
    "errorCaptured",
    "serverPrefetch" ];

  /*  */


  // Vue.config
  var config = ({
    /**
     * Option merge strategies (used in core/util/options)
     */
    // $flow-disable-line
    optionMergeStrategies: Object.create(null),

    /**
     * Whether to suppress warnings.
     */
    silent: false,

    /**
     * Show production mode tip message on boot?
     */
    productionTip: "development" !== "production",

    /**
     * Whether to enable devtools
     */
    devtools: "development" !== "production",

    /**
     * Whether to record perf
     */
    performance: false,

    /**
     * Error handler for watcher errors
     */
    errorHandler: null,

    /**
     * Warn handler for watcher warns
     */
    warnHandler: null,

    /**
     * Ignore certain custom elements
     */
    ignoredElements: [],

    /**
     * Custom user key aliases for v-on
     */
    // $flow-disable-line
    keyCodes: Object.create(null),

    /**
     * Check if a tag is reserved so that it cannot be registered as a
     * component. This is platform-dependent and may be overwritten.
     */
    isReservedTag: no,

    /**
     * Check if an attribute is reserved so that it cannot be used as a component
     * prop. This is platform-dependent and may be overwritten.
     */
    isReservedAttr: no,

    /**
     * Check if a tag is an unknown element.
     * Platform-dependent.
     */
    isUnknownElement: no,

    /**
     * Get the namespace of an element
     */
    getTagNamespace: noop,

    /**
     * Parse the real tag name for the specific platform.
     */
    parsePlatformTagName: identity,

    /**
     * Check if an attribute must be bound using property, e.g. value
     * Platform-dependent.
     */
    mustUseProp: no,

    /**
     * Perform updates asynchronously. Intended to be used by Vue Test Utils
     * This will significantly reduce performance if set to false.
     */
    async: true,

    /**
     * Exposed for legacy reasons
     */
    _lifecycleHooks: LIFECYCLE_HOOKS,
  });

  /*  */

  var warn = noop;
  var tip = noop;
  var generateComponentTrace = (noop); // work around flow check
  var formatComponentName = (noop);

  {
    var hasConsole = typeof console !== 'undefined';
    var classifyRE = /(?:^|[-_])(\w)/g;
    var classify = function (str) { return str
      .replace(classifyRE, function (c) { return c.toUpperCase(); })
      .replace(/[-_]/g, ''); };

    warn = function (msg, vm) {
      var trace = vm ? generateComponentTrace(vm) : '';

      if (config.warnHandler) {
        config.warnHandler.call(null, msg, vm, trace);
      } else if (hasConsole && (!config.silent)) {
        console.error(("[Vue warn]: " + msg + trace));
      }
    };

    tip = function (msg, vm) {
      if (hasConsole && (!config.silent)) {
        console.warn("[Vue tip]: " + msg + (
          vm ? generateComponentTrace(vm) : ''
        ));
      }
    };

    formatComponentName = function (vm, includeFile) {
      if (vm.$root === vm) {
        return '<Root>'
      }
      var options = typeof vm === 'function' && vm.cid != null
        ? vm.options
        : vm._isVue
          ? vm.$options || vm.constructor.options
          : vm;
      var name = options.name || options._componentTag;
      var file = options.__file;
      if (!name && file) {
        var match = file.match(/([^/\\]+)\.vue$/);
        name = match && match[1];
      }

      return (
        (name ? ("<" + (classify(name)) + ">") : "<Anonymous>") +
        (file && includeFile !== false ? (" at " + file) : '')
      )
    };

    var repeat = function (str, n) {
      var res = '';
      while (n) {
        if (n % 2 === 1) { res += str; }
        if (n > 1) { str += str; }
        n >>= 1;
      }
      return res
    };

    generateComponentTrace = function (vm) {
      if (vm._isVue && vm.$parent) {
        var tree = [];
        var currentRecursiveSequence = 0;
        while (vm) {
          if (tree.length > 0) {
            var last = tree[tree.length - 1];
            if (last.constructor === vm.constructor) {
              currentRecursiveSequence++;
              vm = vm.$parent;
              continue
            } else if (currentRecursiveSequence > 0) {
              tree[tree.length - 1] = [last, currentRecursiveSequence];
              currentRecursiveSequence = 0;
            }
          }
          tree.push(vm);
          vm = vm.$parent;
        }
        return '\n\nfound in\n\n' + tree
          .map(function (vm, i) { return ("" + (i === 0 ? '---> ' : repeat(' ', 5 + i * 2)) + (Array.isArray(vm)
              ? ((formatComponentName(vm[0])) + "... (" + (vm[1]) + " recursive calls)")
              : formatComponentName(vm))); })
          .join('\n')
      } else {
        return ("\n\n(found in " + (formatComponentName(vm)) + ")")
      }
    };
  }

  /*  */

  var uid = 0;

  /**
   * A dep is an observable that can have multiple
   * directives subscribing to it.
   */
  var Dep = function Dep () {
    this.id = uid++;
    this.subs = [];
  };
  // 添加依赖
  Dep.prototype.addSub = function addSub (sub) {
    this.subs.push(sub);
  };
  // 删除依赖
  Dep.prototype.removeSub = function removeSub (sub) {
    remove(this.subs, sub);
  };
  // 让watcher知道自己被谁作为依赖收集了
  Dep.prototype.depend = function depend () {
    // Dep.target是一个watcher实例
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  };
  // 通知更新
  Dep.prototype.notify = function notify () {
    // stabilize the subscriber list first
    var subs = this.subs.slice();
    if ( !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort(function (a, b) { return a.id - b.id; });
    }
    for (var i = 0, l = subs.length; i < l; i++) {
      subs[i].update();
    }
  };

  // The current target watcher being evaluated.
  // This is globally unique because only one watcher
  // can be evaluated at a time.
  Dep.target = null;
  // 被收集的依赖的栈
  var targetStack = [];
  // 设置当前被收集的依赖-watcher
  // $options.data的函数执行时，会pushTarget()，设置一个空的target，
  // 避免函数执行时访问响应式数据比如props，造成错误的依赖收集
  function pushTarget (target) {
    targetStack.push(target);
    Dep.target = target;
  }
  // 当前被收集的依赖watcher出栈
  function popTarget () {
    targetStack.pop();
    Dep.target = targetStack[targetStack.length - 1];
  }

  /*
   * not type checking this file because flow doesn't play well with
   * dynamically accessing methods on Array prototype
   */

  var arrayProto = Array.prototype;
  var arrayMethods = Object.create(arrayProto);
  // 操作数组会触发更新的七个方法
  var methodsToPatch = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
  ];

  /**
   * Intercept mutating methods and emit events
   */
  methodsToPatch.forEach(function (method) {
    // cache original method
    var original = arrayProto[method]; // Array.prototype上的原型方法
    def(arrayMethods, method, function mutator () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var result = original.apply(this, args);
    // Observer实例
    // 原型方法只能通过实例调用，所以这里的this指向数组
    var ob = this.__ob__;
    var inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break
      case 'splice':
        inserted = args.slice(2);
        break
    }
    // 通过数组的方法新增的元素, 一样需要被响应式监听
    if (inserted) { ob.observeArray(inserted); }
    // notify change
    // 数组的依赖是从Observer实例上获取的
    ob.dep.notify(); // 触发更新
    // 返回结果
    return result
    });
  });

  /*  */

  var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

  /**
   * In some cases we may want to disable observation inside a component's
   * update computation.
   */
  var shouldObserve = true;

  function toggleObserving (value) {
    shouldObserve = value;
  }

  /**
   * Observer class that is attached to each observed
   * object. Once attached, the observer converts the target
   * object's property keys into getter/setters that
   * collect dependencies and dispatch updates.
   */
  var Observer = function Observer (value) {
    this.value = value;
    // 数组、对象的依赖实例在这里定义，对象属性的依赖实例在defineReactive中定义
    // 对象的并不会用到
    this.dep = new Dep();
    this.vmCount = 0;
    // 给value新增一个__ob__属性，值为该value的Observer实例
    // 相当于为value打上标记，表示它已经转化为响应式了，避免重复操作
    def(value, '__ob__', this);
    // 处理数组的响应式
    if (Array.isArray(value)) {
      // 是否可以通过__proto__获取原型
      if (hasProto) {
        protoAugment(value, arrayMethods);
      } else {
        copyAugment(value, arrayMethods, arrayKeys);
      }
      // 递归遍历数组
      this.observeArray(value);
    } else {
      // 处理对象的响应式
      this.walk(value);
    }
  };

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  Observer.prototype.walk = function walk (obj) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i]);
    }
  };

  /**
   * Observe a list of Array items.
   */
  Observer.prototype.observeArray = function observeArray (items) {
    for (var i = 0, l = items.length; i < l; i++) {
      observe(items[i]);
    }
  };

  // helpers

  /**
   * Augment a target Object or Array by intercepting
   * the prototype chain using __proto__
   */
  // 设置数组的中间代理对象原型
  function protoAugment (target, src) {
    /* eslint-disable no-proto */
    target.__proto__ = src;
    /* eslint-enable no-proto */
  }

  /**
   * Augment a target Object or Array by defining
   * hidden properties.
   */
  /* istanbul ignore next */
  // 不支持__proto__的环境, 则直接拷贝到数组实例上
  function copyAugment (target, src, keys) {
    for (var i = 0, l = keys.length; i < l; i++) {
      var key = keys[i];
      def(target, key, src[key]);
    }
  }

  /**
   * Attempt to create an observer instance for a value,
   * returns the new observer if successfully observed,
   * or the existing observer if the value already has one.
   */
  function observe (value, asRootData) {
    // 原始类型或者VNode跳过
    if (!isObject(value) || value instanceof VNode) {
      return
    }
    var ob;
    // 是否已处理过响应式
    if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
      ob = value.__ob__;
    } else if (
      shouldObserve &&  // 是否应该响应式
      !isServerRendering() && /// 是否是服务端渲染
      (Array.isArray(value) || isPlainObject(value)) && // 是否是数组或者对象，排除Set、Map等其他对象
      Object.isExtensible(value) && // 是否可以扩展
      !value._isVue // 不是Vue构造函数
    ) {
      ob = new Observer(value);
    }
    // 根对象，实例数量加一
    if (asRootData && ob) {
      ob.vmCount++;
    }
    return ob
  }

  /**
   * Define a reactive property on an Object.
   */
  function defineReactive (
    obj,
    key,
    val,
    customSetter, // 定义set时执行的拦截器
    shallow // 是否要递归
  ) {
    // 对象属性的依赖实例
    var dep = new Dep();
    // 对象属性不可配置
    var property = Object.getOwnPropertyDescriptor(obj, key);
    if (property && property.configurable === false) {
      return
    }

    // cater for pre-defined getter/setters
    var getter = property && property.get;
    var setter = property && property.set;
    // 处理没有传入具体的值
    if ((!getter || setter) && arguments.length === 2) {
      val = obj[key];
    }
    // ⚠️
    // 大部分情况shallow默认是false的，即默认递归observe。
    // - 当val是数组时，childOb被用来向当前watcher收集依赖
    // - 当val是普通对象时，set/del函数也会用childOb来通知val的属性添加/删除
    var childOb = !shallow && observe(val);
    // 监听get, 收集依赖
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get: function reactiveGetter () {
        var value = getter ? getter.call(obj) : val;
        if (Dep.target) {
          dep.depend();
          // 现在问题是为什么要依赖 childOb 呢？
          // 考虑到如果 value 是数组，那么 value 的 push/shift 之类的操作，
          // 是触发不了下面的 setter 的，即 dep.depend 在这种情况不会被调用。
          // 此时，childOb 即value这个数组对应的 ob，数组的操作会通知到childOb，
          // 所以可以替代 dep 来通知 watcher。
          if (childOb) {
            // 数组的依赖收集也是在get中，因为递归数组优先
            childOb.dep.depend();
            if (Array.isArray(value)) {
              // 嵌套数组，都会把引用当前这个属性的实例watcher收集为watcher
              dependArray(value);
            }
          }
        }
        return value
      },
      // 
      set: function reactiveSetter (newVal) {
        var value = getter ? getter.call(obj) : val;
        /* eslint-disable no-self-compare */
        // 排除NaN
        if (newVal === value || (newVal !== newVal && value !== value)) {
          return
        }
        /* eslint-enable no-self-compare */
        /** 自定义设置器，比如修改props时，开发环境打印警告 */
        if ( customSetter) {
          customSetter();
        }
        // #7981: for accessor properties without setter
        // 访问器属性没有setter
        if (getter && !setter) { return }
        if (setter) {
          setter.call(obj, newVal);
        } else {
          val = newVal;
        }
        childOb = !shallow && observe(newVal);
        // 触发依赖更新
        dep.notify();
      }
    });
  }

  /**
   * Set a property on an object. Adds the new property and
   * triggers change notification if the property doesn't
   * already exist.
   */
  function set (target, key, val) {
    // isUndef：判断undefined isPrimitive: 判断原始值
    if (
      (isUndef(target) || isPrimitive(target))
    ) {
      warn(("Cannot set reactive property on undefined, null, or primitive value: " + ((target))));
    }
    // 处理数组
    if (Array.isArray(target) && isValidArrayIndex(key)) {
      target.length = Math.max(target.length, key);
      target.splice(key, 1, val);
      return val
    }
    // 处理对象
    if (key in target && !(key in Object.prototype)) {
      target[key] = val;
      return val
    }
    // 目标对象不能是vue实例或者vue实例根数据
    var ob = (target).__ob__;
    if (target._isVue || (ob && ob.vmCount)) {
       warn(
        'Avoid adding reactive properties to a Vue instance or its root $data ' +
        'at runtime - declare it upfront in the data option.'
      );
      return val
    }
    // 不是响应式对象
    if (!ob) {
      target[key] = val;
      return val
    }
    defineReactive(ob.value, key, val);
    // 通知更新
    ob.dep.notify();
    return val
  }

  /**
   * Collect dependencies on array elements when the array is touched, since
   * we cannot intercept array element access like property getters.
   */
  /**
   * 举个例子，
   * data() {
   *  return {
   *    test: [
   *       [],
   *       []
   *    ]
   *  }
   * }
   * 在VUE2中，如果模版使用了test这个属性，那么不管test数组中的嵌套数组有没有被用到，都会把用到test属性的
   * 组件实例对应的依赖收集为自己的依赖。这种情况下，执行test[0].push(3)原则上是不需要更新视图的，事实上却重新更新了视图。
   * 这是VUE2响应式的一个缺陷
   * 
   * test: [
   *  {
   *    name: 'fenggp'
   *  }
   * ]
   * 这种情况下只要没有引用到name属性，那么执行test[0].name = 'test'时不会更新视图，由此可见Object和Array的区别
   * 
   * VUE3解决了这个问题，只要模版中没有用到的，就不会被错误的收集依赖
   */
  function dependArray (value) {
    for (var e = (void 0), i = 0, l = value.length; i < l; i++) {
      e = value[i];
      e && e.__ob__ && e.__ob__.dep.depend();
      if (Array.isArray(e)) {
        dependArray(e);
      }
    }
  }

  /*  */

  /**
   * Option overwriting strategies are functions that handle
   * how to merge a parent option value and a child option
   * value into the final value.
   * 组件选项合并策略
   */
  var strats = config.optionMergeStrategies;

  /**
   * Options with restrictions
   */
  {
    strats.el = strats.propsData = function (parent, child, vm, key) {
      if (!vm) {
        warn(
          "option \"" + key + "\" can only be used during instance " +
          'creation with the `new` keyword.'
        );
      }
      return defaultStrat(parent, child)
    };
  }

  /**
   * Helper that recursively merges two data objects together.
   * 递归合并两个对象
   */
  function mergeData (to, from) {
    if (!from) { return to }
    var key, toVal, fromVal;

    var keys = hasSymbol
      ? Reflect.ownKeys(from)
      : Object.keys(from);

    for (var i = 0; i < keys.length; i++) {
      key = keys[i];
      // in case the object is already observed...
      if (key === '__ob__') { continue }
      toVal = to[key];
      fromVal = from[key];
      if (!hasOwn(to, key)) {
        set(to, key, fromVal);
      } else if (
        toVal !== fromVal &&
        isPlainObject(toVal) &&
        isPlainObject(fromVal)
      ) {
        mergeData(toVal, fromVal);
      }
    }
    return to
  }

  /**
   * Data
   */
  function mergeDataOrFn (
    parentVal,
    childVal,
    vm
  ) {
    if (!vm) {
      // in a Vue.extend merge, both should be functions
      if (!childVal) {
        return parentVal
      }
      if (!parentVal) {
        return childVal
      }
      // when parentVal & childVal are both present,
      // we need to return a function that returns the
      // merged result of both functions... no need to
      // check if parentVal is a function here because
      // it has to be a function to pass previous merges.
      return function mergedDataFn () {
        return mergeData(
          typeof childVal === 'function' ? childVal.call(this, this) : childVal,
          typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
        )
      }
    } else {
      return function mergedInstanceDataFn () {
        // instance merge
        var instanceData = typeof childVal === 'function'
          ? childVal.call(vm, vm)
          : childVal;
        var defaultData = typeof parentVal === 'function'
          ? parentVal.call(vm, vm)
          : parentVal;
        if (instanceData) {
          return mergeData(instanceData, defaultData)
        } else {
          return defaultData
        }
      }
    }
  }

  strats.data = function (
    parentVal,
    childVal,
    vm
  ) {
    if (!vm) {
      if (childVal && typeof childVal !== 'function') {
         warn(
          'The "data" option should be a function ' +
          'that returns a per-instance value in component ' +
          'definitions.',
          vm
        );

        return parentVal
      }
      return mergeDataOrFn(parentVal, childVal)
    }

    return mergeDataOrFn(parentVal, childVal, vm)
  };

  /**
   * Hooks and props are merged as arrays.
   */
  function mergeHook (
    parentVal,
    childVal
  ) {
    var res = childVal
      ? parentVal
        ? parentVal.concat(childVal)
        : Array.isArray(childVal)
          ? childVal
          : [childVal]
      : parentVal;
    return res
      ? dedupeHooks(res)
      : res
  }

  function dedupeHooks (hooks) {
    var res = [];
    for (var i = 0; i < hooks.length; i++) {
      if (res.indexOf(hooks[i]) === -1) {
        res.push(hooks[i]);
      }
    }
    return res
  }

  LIFECYCLE_HOOKS.forEach(function (hook) {
    strats[hook] = mergeHook;
  });

  /**
   * Assets
   *
   * When a vm is present (instance creation), we need to do
   * a three-way merge between constructor options, instance
   * options and parent options.
   */
  function mergeAssets (
    parentVal,
    childVal,
    vm,
    key
  ) {
    var res = Object.create(parentVal || null);
    if (childVal) {
       assertObjectType(key, childVal, vm);
      return extend(res, childVal)
    } else {
      return res
    }
  }

  ASSET_TYPES.forEach(function (type) {
    strats[type + 's'] = mergeAssets;
  });

  /**
   * Watchers.
   *
   * Watchers hashes should not overwrite one
   * another, so we merge them as arrays.
   */
  strats.watch = function (
    parentVal,
    childVal,
    vm,
    key
  ) {
    // work around Firefox's Object.prototype.watch...
    if (parentVal === nativeWatch) { parentVal = undefined; }
    if (childVal === nativeWatch) { childVal = undefined; }
    /* istanbul ignore if */
    if (!childVal) { return Object.create(parentVal || null) }
    {
      assertObjectType(key, childVal, vm);
    }
    if (!parentVal) { return childVal }
    var ret = {};
    extend(ret, parentVal);
    for (var key$1 in childVal) {
      var parent = ret[key$1];
      var child = childVal[key$1];
      if (parent && !Array.isArray(parent)) {
        parent = [parent];
      }
      ret[key$1] = parent
        ? parent.concat(child)
        : Array.isArray(child) ? child : [child];
    }
    return ret
  };

  /**
   * Other object hashes.
   */
  strats.props =
  strats.methods =
  strats.inject =
  strats.computed = function (
    parentVal,
    childVal,
    vm,
    key
  ) {
    if (childVal && "development" !== 'production') {
      assertObjectType(key, childVal, vm);
    }
    if (!parentVal) { return childVal }
    var ret = Object.create(null);
    extend(ret, parentVal);
    if (childVal) { extend(ret, childVal); }
    return ret
  };
  strats.provide = mergeDataOrFn;

  /**
   * Default strategy.
   */
  var defaultStrat = function (parentVal, childVal) {
    return childVal === undefined
      ? parentVal
      : childVal
  };

  /**
   * Validate component names
   * 验证components选项中的组件名称是否合法
   */
  function checkComponents (options) {
    for (var key in options.components) {
      validateComponentName(key);
    }
  }
  // 验证组件名称是否是原生元素、或者保留字
  function validateComponentName (name) {
    if (!new RegExp(("^[a-zA-Z][\\-\\.0-9_" + (unicodeRegExp.source) + "]*$")).test(name)) {
      warn(
        'Invalid component name: "' + name + '". Component names ' +
        'should conform to valid custom element name in html5 specification.'
      );
    }
    if (isBuiltInTag(name) || config.isReservedTag(name)) {
      warn(
        'Do not use built-in or reserved HTML elements as component ' +
        'id: ' + name
      );
    }
  }

  /**
   * Ensure all props option syntax are normalized into the
   * Object-based format.
   * 把props选项格式化为对象形式
   */
  function normalizeProps (options, vm) {
    var props = options.props;
    if (!props) { return }
    var res = {};
    var i, val, name;
    // 数组形式
    if (Array.isArray(props)) {
      i = props.length;
      while (i--) {
        val = props[i];
        if (typeof val === 'string') {
          name = camelize(val);
          res[name] = { type: null };
        } else {
          warn('props must be strings when using array syntax.');
        }
      }
    }
    // 对象形式
    else if (isPlainObject(props)) {
      for (var key in props) {
        val = props[key];
        name = camelize(key);
        res[name] = isPlainObject(val)
          ? val
          : { type: val };
      }
    }
    // 既不是数组也不是对象，打印警告
    else {
      warn(
        "Invalid value for option \"props\": expected an Array or an Object, " +
        "but got " + (toRawType(props)) + ".",
        vm
      );
    }
    options.props = res;
  }

  /**
   * Normalize all injections into Object-based format
   */
  function normalizeInject (options, vm) {
    var inject = options.inject;
    if (!inject) { return }
    var normalized = options.inject = {};
    // 数组形式
    if (Array.isArray(inject)) {
      for (var i = 0; i < inject.length; i++) {
        // inject的key可以和provide的key不一样，此时使用from标记来源
        normalized[inject[i]] = { from: inject[i] };
      }
    }
    // 对象形式
    else if (isPlainObject(inject)) {
      for (var key in inject) {
        var val = inject[key];
        normalized[key] = isPlainObject(val)
          ? extend({ from: key }, val)
          : { from: val };
      }
    }
    else {
      warn(
        "Invalid value for option \"inject\": expected an Array or an Object, " +
        "but got " + (toRawType(inject)) + ".",
        vm
      );
    }
  }

  /**
   * Normalize raw function directives into object format.
   * 格式化指令
   */
  function normalizeDirectives (options) {
    var dirs = options.directives;
    if (dirs) {
      for (var key in dirs) {
        var def = dirs[key];
        if (typeof def === 'function') {
          dirs[key] = { bind: def, update: def };
        }
      }
    }
  }

  function assertObjectType (name, value, vm) {
    if (!isPlainObject(value)) {
      warn(
        "Invalid value for option \"" + name + "\": expected an Object, " +
        "but got " + (toRawType(value)) + ".",
        vm
      );
    }
  }

  /**
   * Merge two option objects into a new one.
   * Core utility used in both instantiation and inheritance.
   * new Vue和Vue.extends时都会用到
   */
  function mergeOptions (
    parent,
    child,
    vm
  ) {
    // 开发环境验证组件名称
    {
      checkComponents(child);
    }

    if (typeof child === 'function') {
      child = child.options;
    }
    // 格式化props，转为对象格式
    normalizeProps(child, vm);
    // 格式化依赖注入，转为对象模式
    normalizeInject(child, vm);
    // 格式化指令，指令可以是对象或者函数，同意转为对象格式
    // 【官网】在很多时候，你可能想在 bind 和 update 时触发相同行为，而不关心其它的钩子，这是提供一个函数即可
    normalizeDirectives(child);

    // Apply extends and mixins on the child options,
    // but only if it is a raw options object that isn't
    // the result of another mergeOptions call.
    // Only merged options has the _base property.
    if (!child._base) {
      // 递归合并extends
      if (child.extends) {
        parent = mergeOptions(parent, child.extends, vm);
      }
      // 递归合并mixins
      if (child.mixins) {
        for (var i = 0, l = child.mixins.length; i < l; i++) {
          parent = mergeOptions(parent, child.mixins[i], vm);
        }
      }
    }

    var options = {};
    var key;
    // 把Vue构造函数的options合并到options
    for (key in parent) {
      mergeField(key);
    }
    // 把实例化时的options合并到options
    for (key in child) {
      if (!hasOwn(parent, key)) {
        mergeField(key);
      }
    }
    // strats组件选项合并策略
    function mergeField (key) {
      // defaultStrat：默认合并策略
      var strat = strats[key] || defaultStrat;
      options[key] = strat(parent[key], child[key], vm, key);
    }
    // 返回合并好的options
    return options
  }

  /**
   * Resolve an asset.
   * This function is used because child instances need access
   * to assets defined in its ancestor chain.
   */
  // 查找filters、directive、components
  function resolveAsset (
    options,
    type, // 待查找的选项
    id, // ID
    warnMissing // 找不到是否打印警告
  ) {
    /* istanbul ignore if */
    if (typeof id !== 'string') {
      return
    }
    var assets = options[type];
    // check local registration variations first
    // 本地查找
    if (hasOwn(assets, id)) { return assets[id] }
    var camelizedId = camelize(id);
    if (hasOwn(assets, camelizedId)) { return assets[camelizedId] }
    var PascalCaseId = capitalize(camelizedId);
    if (hasOwn(assets, PascalCaseId)) { return assets[PascalCaseId] }
    // fallback to prototype chain
    // 原型链查找
    var res = assets[id] || assets[camelizedId] || assets[PascalCaseId];
    if ( warnMissing && !res) {
      warn(
        'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
        options
      );
    }
    return res
  }

  /*  */


  /** 校验传进来的props */
  function validateProp (
    key, // props字段名
    propOptions, // props配置项
    propsData, // 传进来的props对象
    vm // 当前实例
  ) {
    // 当前prop配置项
    var prop = propOptions[key];
    // 判断父组件有没有传
    var absent = !hasOwn(propsData, key);
    var value = propsData[key];
    // boolean casting
    // 优先判断Boolean是否命中props类型声明
    var booleanIndex = getTypeIndex(Boolean, prop.type);
    if (booleanIndex > -1) {
      // 没传也没有设置默认值
      if (absent && !hasOwn(prop, 'default')) {
        value = false;
      }
      // 判断传""字符串时，如果prop的类型有Boolean也有String，应该设置为true还是""
      else if (value === '' || value === hyphenate(key)) {
        // only cast empty string / same name to boolean if
        // boolean has higher priority
        var stringIndex = getTypeIndex(String, prop.type);
        // 比较是Boolean优先级和String类型优先级
        if (stringIndex < 0 || booleanIndex < stringIndex) {
          value = true;
        }
      }
    }
    // check default value
    // prop没传时，设置默认值
    if (value === undefined) {
      // 获取默认值
      value = getPropDefaultValue(vm, prop, key);
      // since the default value is a fresh copy,
      // make sure to observe it.
      // 响应式默认值
      var prevShouldObserve = shouldObserve;
      // 开启响应式
      toggleObserving(true); 
      observe(value);
      // 恢复响应式
      toggleObserving(prevShouldObserve); 
    }
    {
      assertProp(prop, key, value, vm, absent);
    }
    return value
  }

  /**
   * Get the default value of a prop.
   * 获取props默认值
   */
  function getPropDefaultValue (vm, prop, key) {
    // no default, return undefined
    if (!hasOwn(prop, 'default')) {
      return undefined
    }
    var def = prop.default;
    // warn against non-factory defaults for Object & Array
    // 复杂类型必须通过工厂函数返回
    if ( isObject(def)) {
      warn(
        'Invalid default value for prop "' + key + '": ' +
        'Props with type Object/Array must use a factory function ' +
        'to return the default value.',
        vm
      );
    }
    // the raw prop value was also undefined from previous render,
    // return previous default value to avoid unnecessary watcher trigger
    if (vm && vm.$options.propsData &&
      vm.$options.propsData[key] === undefined &&
      vm._props[key] !== undefined
    ) {
      return vm._props[key]
    }
    // call factory function for non-Function types
    // a value is Function if its prototype is function even across different execution context
    return typeof def === 'function' && getType(prop.type) !== 'Function'
      ? def.call(vm)
      : def
  }

  /**
   * Assert whether a prop is valid.
   */
  // 验证每一个prop属性的类型是否合法
  function assertProp (
    prop,
    name,
    value,
    vm,
    absent
  ) {
    if (prop.required && absent) {
      warn(
        'Missing required prop: "' + name + '"',
        vm
      );
      return
    }
    if (value == null && !prop.required) {
      return
    }
    var type = prop.type;
    var valid = !type || type === true;
    var expectedTypes = [];
    if (type) {
      if (!Array.isArray(type)) {
        type = [type];
      }
      for (var i = 0; i < type.length && !valid; i++) {
        var assertedType = assertType(value, type[i], vm);
        expectedTypes.push(assertedType.expectedType || '');
        valid = assertedType.valid;
      }
    }

    var haveExpectedTypes = expectedTypes.some(function (t) { return t; });
    if (!valid && haveExpectedTypes) {
      warn(
        getInvalidTypeMessage(name, value, expectedTypes),
        vm
      );
      return
    }
    var validator = prop.validator;
    if (validator) {
      if (!validator(value)) {
        warn(
          'Invalid prop: custom validator check failed for prop "' + name + '".',
          vm
        );
      }
    }
  }

  var simpleCheckRE = /^(String|Number|Boolean|Function|Symbol|BigInt)$/;
  // 判断value的类型是否是type
  function assertType (value, type, vm) {
    var valid;
    var expectedType = getType(type);
    if (simpleCheckRE.test(expectedType)) {
      var t = typeof value;
      valid = t === expectedType.toLowerCase();
      // for primitive wrapper objects
      if (!valid && t === 'object') {
        valid = value instanceof type;
      }
    } else if (expectedType === 'Object') {
      valid = isPlainObject(value);
    } else if (expectedType === 'Array') {
      valid = Array.isArray(value);
    } else {
      try {
        valid = value instanceof type;
      } catch (e) {
        warn('Invalid prop type: "' + String(type) + '" is not a constructor', vm);
        valid = false;
      }
    }
    return {
      valid: valid,
      expectedType: expectedType
    }
  }

  var functionTypeCheckRE = /^\s*function (\w+)/;

  /**
   * Use function string name to check built-in types,
   * because a simple equality check will fail when running
   * across different vms / iframes.
   */
  function getType (fn) {
    var match = fn && fn.toString().match(functionTypeCheckRE);
    return match ? match[1] : ''
  }

  function isSameType (a, b) {
    return getType(a) === getType(b)
  }

  function getTypeIndex (type, expectedTypes) {
    if (!Array.isArray(expectedTypes)) {
      return isSameType(expectedTypes, type) ? 0 : -1
    }
    for (var i = 0, len = expectedTypes.length; i < len; i++) {
      if (isSameType(expectedTypes[i], type)) {
        return i
      }
    }
    return -1
  }

  function getInvalidTypeMessage (name, value, expectedTypes) {
    var message = "Invalid prop: type check failed for prop \"" + name + "\"." +
      " Expected " + (expectedTypes.map(capitalize).join(', '));
    var expectedType = expectedTypes[0];
    var receivedType = toRawType(value);
    // check if we need to specify expected value
    if (
      expectedTypes.length === 1 &&
      isExplicable(expectedType) &&
      isExplicable(typeof value) &&
      !isBoolean(expectedType, receivedType)
    ) {
      message += " with value " + (styleValue(value, expectedType));
    }
    message += ", got " + receivedType + " ";
    // check if we need to specify received value
    if (isExplicable(receivedType)) {
      message += "with value " + (styleValue(value, receivedType)) + ".";
    }
    return message
  }

  function styleValue (value, type) {
    if (type === 'String') {
      return ("\"" + value + "\"")
    } else if (type === 'Number') {
      return ("" + (Number(value)))
    } else {
      return ("" + value)
    }
  }

  var EXPLICABLE_TYPES = ['string', 'number', 'boolean'];
  function isExplicable (value) {
    return EXPLICABLE_TYPES.some(function (elem) { return value.toLowerCase() === elem; })
  }

  function isBoolean () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return args.some(function (elem) { return elem.toLowerCase() === 'boolean'; })
  }

  /*  */
  /**
   * 错误处理函数
   * @param {错误实例} err 
   * @param {实例} vm 
   * @param {错误信息} info 
   * @returns 
   */
  function handleError (err, vm, info) {
    // Deactivate deps tracking while processing error handler to avoid possible infinite rendering.
    // See: https://github.com/vuejs/vuex/issues/1505
    pushTarget();
    try {
      if (vm) {
        var cur = vm;
        // 沿着组件链，调用父组件的错误捕获钩子
        while ((cur = cur.$parent)) {
          var hooks = cur.$options.errorCaptured;
          if (hooks) {
            for (var i = 0; i < hooks.length; i++) {
              try {
                var capture = hooks[i].call(cur, err, vm, info) === false;
                // 如已捕获，则直接退出
                if (capture) { return }
              } catch (e) {
                globalHandleError(e, cur, 'errorCaptured hook');
              }
            }
          }
        }
      }
      globalHandleError(err, vm, info);
    } finally {
      popTarget();
    }
  }
  // 包装开发人员定义的方法，监听错误并统一处理
  function invokeWithErrorHandling (
    handler, // 待执行函数
    context, // 上下文
    args, // 参数
    vm, // 实例
    info // 信息
  ) {
    var res;
    try {
      // 有参数用apply 无参数用call
      res = args ? handler.apply(context, args) : handler.call(context);
      if (res && !res._isVue && isPromise(res) && !res._handled) {
        res.catch(function (e) { return handleError(e, vm, info + " (Promise/async)"); });
        // issue #9511
        // avoid catch triggering multiple times when nested calls
        res._handled = true;
      }
    } catch (e) {
      handleError(e, vm, info);
    }
    return res
  }
  // 全局错误处理函数
  function globalHandleError (err, vm, info) {
    // 是否配置全局错误处理函数
    if (config.errorHandler) {
      try {
        return config.errorHandler.call(null, err, vm, info)
      } catch (e) {
        // if the user intentionally throws the original error in the handler,
        // do not log it twice
        if (e !== err) {
          logError(e, null, 'config.errorHandler');
        }
      }
    }
    logError(err, vm, info);
  }
  // 打印错误信息到控制台
  function logError (err, vm, info) {
    {
      warn(("Error in " + info + ": \"" + (err.toString()) + "\""), vm);
    }
    /* istanbul ignore else */
    if ((inBrowser || inWeex) && typeof console !== 'undefined') {
      console.error(err);
    } else {
      throw err
    }
  }

  /*  */

  var callbacks = []; // 回调队列

  function flushCallbacks () {
    // 复制备份并清空回调队列，防止nextick中包含nexttick出现问题
    var copies = callbacks.slice(0);
    callbacks.length = 0;
    // 遍历执行回调
    for (var i = 0; i < copies.length; i++) {
      copies[i]();
    }
  }

  // The nextTick behavior leverages the microtask queue, which can be accessed
  // via either native Promise.then or MutationObserver.
  // MutationObserver has wider support, however it is seriously bugged in
  // UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
  // completely stops working after triggering a few times... so, if native
  // Promise is available, we will use it:
  /* istanbul ignore next, $flow-disable-line */
  // 能力检测：promise > mutationObserver > setTmmidiate > setTimeout
  if (typeof Promise !== 'undefined' && isNative(Promise)) ; else if (!isIE && typeof MutationObserver !== 'undefined' && (
    isNative(MutationObserver) ||
    // PhantomJS and iOS 7.x
    MutationObserver.toString() === '[object MutationObserverConstructor]'
  )) {
    // Use MutationObserver where native Promise is not available,
    // e.g. PhantomJS, iOS7, Android 4.4
    // (#6466 MutationObserver is unreliable in IE11)
    var counter = 1;
    var observer = new MutationObserver(flushCallbacks);
    var textNode = document.createTextNode(String(counter));
    observer.observe(textNode, {
      characterData: true
    });
  } else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) ;

  /*  */

  function genClassForVnode (vnode) {
    var data = vnode.data;
    var parentNode = vnode;
    var childNode = vnode;
    while (isDef(childNode.componentInstance)) {
      childNode = childNode.componentInstance._vnode;
      if (childNode && childNode.data) {
        data = mergeClassData(childNode.data, data);
      }
    }
    while (isDef(parentNode = parentNode.parent)) {
      if (parentNode && parentNode.data) {
        data = mergeClassData(data, parentNode.data);
      }
    }
    return renderClass(data.staticClass, data.class)
  }

  function mergeClassData (child, parent) {
    return {
      staticClass: concat(child.staticClass, parent.staticClass),
      class: isDef(child.class)
        ? [child.class, parent.class]
        : parent.class
    }
  }

  function renderClass (
    staticClass,
    dynamicClass
  ) {
    if (isDef(staticClass) || isDef(dynamicClass)) {
      return concat(staticClass, stringifyClass(dynamicClass))
    }
    /* istanbul ignore next */
    return ''
  }

  function concat (a, b) {
    return a ? b ? (a + ' ' + b) : a : (b || '')
  }

  function stringifyClass (value) {
    if (Array.isArray(value)) {
      return stringifyArray(value)
    }
    if (isObject(value)) {
      return stringifyObject(value)
    }
    if (typeof value === 'string') {
      return value
    }
    /* istanbul ignore next */
    return ''
  }

  function stringifyArray (value) {
    var res = '';
    var stringified;
    for (var i = 0, l = value.length; i < l; i++) {
      if (isDef(stringified = stringifyClass(value[i])) && stringified !== '') {
        if (res) { res += ' '; }
        res += stringified;
      }
    }
    return res
  }

  function stringifyObject (value) {
    var res = '';
    for (var key in value) {
      if (value[key]) {
        if (res) { res += ' '; }
        res += key;
      }
    }
    return res
  }

  /*  */
  // 是否是原生HTML标签
  var isHTMLTag = makeMap(
    'html,body,base,head,link,meta,style,title,' +
    'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
    'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
    'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
    's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
    'embed,object,param,source,canvas,script,noscript,del,ins,' +
    'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
    'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
    'output,progress,select,textarea,' +
    'details,dialog,menu,menuitem,summary,' +
    'content,element,shadow,template,blockquote,iframe,tfoot'
  );

  // this map is intentionally selective, only covering SVG elements that may
  // contain child elements.
  // 是否是SVG标签
  var isSVG = makeMap(
    'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
    'foreignobject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
    'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
    true
  );

  var isPreTag = function (tag) { return tag === 'pre'; };
  // 是否是原生保留标签
  var isReservedTag = function (tag) {
    return isHTMLTag(tag) || isSVG(tag)
  };
  // 获取标签明明空间
  function getTagNamespace (tag) {
    if (isSVG(tag)) {
      return 'svg'
    }
    // basic support for MathML
    // note it doesn't support other MathML elements being component roots
    if (tag === 'math') {
      return 'math'
    }
  }

  var isTextInputType = makeMap('text,number,password,search,email,tel,url');

  /*  */

  function renderClass$1 (node) {
    var classList = genClassForVnode(node);
    if (classList !== '') {
      return (" class=\"" + (escape(classList)) + "\"")
    }
  }

  /*  */

  var parseStyleText = cached(function (cssText) {
    var res = {};
    var listDelimiter = /;(?![^(]*\))/g;
    var propertyDelimiter = /:(.+)/;
    cssText.split(listDelimiter).forEach(function (item) {
      if (item) {
        var tmp = item.split(propertyDelimiter);
        tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim());
      }
    });
    return res
  });

  // merge static and dynamic style data on the same vnode
  function normalizeStyleData (data) {
    var style = normalizeStyleBinding(data.style);
    // static style is pre-processed into an object during compilation
    // and is always a fresh object, so it's safe to merge into it
    return data.staticStyle
      ? extend(data.staticStyle, style)
      : style
  }

  // normalize possible array / string values into Object
  function normalizeStyleBinding (bindingStyle) {
    if (Array.isArray(bindingStyle)) {
      return toObject(bindingStyle)
    }
    if (typeof bindingStyle === 'string') {
      return parseStyleText(bindingStyle)
    }
    return bindingStyle
  }

  /**
   * parent component style should be after child's
   * so that parent component's style could override it
   */
  function getStyle (vnode, checkChild) {
    var res = {};
    var styleData;

    if (checkChild) {
      var childNode = vnode;
      while (childNode.componentInstance) {
        childNode = childNode.componentInstance._vnode;
        if (
          childNode && childNode.data &&
          (styleData = normalizeStyleData(childNode.data))
        ) {
          extend(res, styleData);
        }
      }
    }

    if ((styleData = normalizeStyleData(vnode.data))) {
      extend(res, styleData);
    }

    var parentNode = vnode;
    while ((parentNode = parentNode.parent)) {
      if (parentNode.data && (styleData = normalizeStyleData(parentNode.data))) {
        extend(res, styleData);
      }
    }
    return res
  }

  /*  */

  function genStyle (style) {
    var styleText = '';
    for (var key in style) {
      var value = style[key];
      var hyphenatedKey = hyphenate(key);
      if (Array.isArray(value)) {
        for (var i = 0, len = value.length; i < len; i++) {
          styleText += normalizeValue(hyphenatedKey, value[i]);
        }
      } else {
        styleText += normalizeValue(hyphenatedKey, value);
      }
    }
    return styleText
  }

  function normalizeValue(key, value) {
    if (
      typeof value === 'string' ||
      (typeof value === 'number' && noUnitNumericStyleProps[key]) ||
      value === 0
    ) {
      return (key + ":" + value + ";")
    } else {
      // invalid values
      return ""
    }
  }

  function renderStyle (vnode) {
    var styleText = genStyle(getStyle(vnode, false));
    if (styleText !== '') {
      return (" style=" + (JSON.stringify(escape(styleText))))
    }
  }

  var modules = [
    renderAttrs,
    renderDOMProps,
    renderClass$1,
    renderStyle
  ];

  /*  */

  function show (node, dir) {
    if (!dir.value) {
      var style = node.data.style || (node.data.style = {});
      if (Array.isArray(style)) {
        style.push({ display: 'none' });
      } else {
        style.display = 'none';
      }
    }
  }

  /*  */

  // this is only applied for <select v-model> because it is the only edge case
  // that must be done at runtime instead of compile time.
  function model (node, dir) {
    if (!node.children) { return }
    var value = dir.value;
    var isMultiple = node.data.attrs && node.data.attrs.multiple;
    for (var i = 0, l = node.children.length; i < l; i++) {
      var option = node.children[i];
      if (option.tag === 'option') {
        if (isMultiple) {
          var selected =
            Array.isArray(value) &&
            (looseIndexOf(value, getValue(option)) > -1);
          if (selected) {
            setSelected(option);
          }
        } else {
          if (looseEqual(value, getValue(option))) {
            setSelected(option);
            return
          }
        }
      }
    }
  }

  function getValue (option) {
    var data = option.data || {};
    return (
      (data.attrs && data.attrs.value) ||
      (data.domProps && data.domProps.value) ||
      (option.children && option.children[0] && option.children[0].text)
    )
  }

  function setSelected (option) {
    var data = option.data || (option.data = {});
    var attrs = data.attrs || (data.attrs = {});
    attrs.selected = '';
  }

  var directives = {
    show: show,
    model: model
  };

  /*  */

  var isUnaryTag = makeMap(
    'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
    'link,meta,param,source,track,wbr'
  );

  // Elements that you can, intentionally, leave open
  // (and which close themselves)
  var canBeLeftOpenTag = makeMap(
    'colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source'
  );

  // HTML5 tags https://html.spec.whatwg.org/multipage/indices.html#elements-3
  // Phrasing Content https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
  var isNonPhrasingTag = makeMap(
    'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
    'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
    'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
    'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
    'title,tr,track'
  );

  /*  */

  var MAX_STACK_DEPTH = 800;
  var noop$1 = function (_) { return _; };

  var defer = typeof process !== 'undefined' && process.nextTick
    ? process.nextTick
    : typeof Promise !== 'undefined'
      ? function (fn) { return Promise.resolve().then(fn); }
      : typeof setTimeout !== 'undefined'
        ? setTimeout
        : noop$1;

  if (defer === noop$1) {
    throw new Error(
      'Your JavaScript runtime does not support any asynchronous primitives ' +
      'that are required by vue-server-renderer. Please use a polyfill for ' +
      'either Promise or setTimeout.'
    )
  }

  function createWriteFunction (
    write,
    onError
  ) {
    var stackDepth = 0;
    var cachedWrite = function (text, next) {
      if (text && cachedWrite.caching) {
        cachedWrite.cacheBuffer[cachedWrite.cacheBuffer.length - 1] += text;
      }
      var waitForNext = write(text, next);
      if (waitForNext !== true) {
        if (stackDepth >= MAX_STACK_DEPTH) {
          defer(function () {
            try { next(); } catch (e) {
              onError(e);
            }
          });
        } else {
          stackDepth++;
          next();
          stackDepth--;
        }
      }
    };
    cachedWrite.caching = false;
    cachedWrite.cacheBuffer = [];
    cachedWrite.componentBuffer = [];
    return cachedWrite
  }

  /*  */



  var RenderContext = function RenderContext (options) {
    this.userContext = options.userContext;
    this.activeInstance = options.activeInstance;
    this.renderStates = [];

    this.write = options.write;
    this.done = options.done;
    this.renderNode = options.renderNode;

    this.isUnaryTag = options.isUnaryTag;
    this.modules = options.modules;
    this.directives = options.directives;

    var cache = options.cache;
    if (cache && (!cache.get || !cache.set)) {
      throw new Error('renderer cache must implement at least get & set.')
    }
    this.cache = cache;
    this.get = cache && normalizeAsync(cache, 'get');
    this.has = cache && normalizeAsync(cache, 'has');

    this.next = this.next.bind(this);
  };

  RenderContext.prototype.next = function next () {
    // eslint-disable-next-line
    while (true) {
      var lastState = this.renderStates[this.renderStates.length - 1];
      if (isUndef(lastState)) {
        return this.done()
      }
      /* eslint-disable no-case-declarations */
      switch (lastState.type) {
        case 'Element':
        case 'Fragment':
          var children = lastState.children;
        var total = lastState.total;
          var rendered = lastState.rendered++;
          if (rendered < total) {
            return this.renderNode(children[rendered], false, this)
          } else {
            this.renderStates.pop();
            if (lastState.type === 'Element') {
              return this.write(lastState.endTag, this.next)
            }
          }
          break
        case 'Component':
          this.renderStates.pop();
          this.activeInstance = lastState.prevActive;
          break
        case 'ComponentWithCache':
          this.renderStates.pop();
          var buffer = lastState.buffer;
        var bufferIndex = lastState.bufferIndex;
        var componentBuffer = lastState.componentBuffer;
        var key = lastState.key;
          var result = {
            html: buffer[bufferIndex],
            components: componentBuffer[bufferIndex]
          };
          this.cache.set(key, result);
          if (bufferIndex === 0) {
            // this is a top-level cached component,
            // exit caching mode.
            this.write.caching = false;
          } else {
            // parent component is also being cached,
            // merge self into parent's result
            buffer[bufferIndex - 1] += result.html;
            var prev = componentBuffer[bufferIndex - 1];
            result.components.forEach(function (c) { return prev.add(c); });
          }
          buffer.length = bufferIndex;
          componentBuffer.length = bufferIndex;
          break
      }
    }
  };

  function normalizeAsync (cache, method) {
    var fn = cache[method];
    if (isUndef(fn)) {
      return
    } else if (fn.length > 1) {
      return function (key, cb) { return fn.call(cache, key, cb); }
    } else {
      return function (key, cb) { return cb(fn.call(cache, key)); }
    }
  }

  /*  */
  // 过滤器解析器
  var validDivisionCharRE = /[\w).+\-_$\]]/;

  function parseFilters (exp) {
    var inSingle = false;
    var inDouble = false;
    var inTemplateString = false;
    var inRegex = false;
    var curly = 0;
    var square = 0;
    var paren = 0;
    var lastFilterIndex = 0;
    var c, prev, i, expression, filters;

    for (i = 0; i < exp.length; i++) {
      prev = c;
      c = exp.charCodeAt(i);
      if (inSingle) {
        if (c === 0x27 && prev !== 0x5C) { inSingle = false; }
      } else if (inDouble) {
        if (c === 0x22 && prev !== 0x5C) { inDouble = false; }
      } else if (inTemplateString) {
        if (c === 0x60 && prev !== 0x5C) { inTemplateString = false; }
      } else if (inRegex) {
        if (c === 0x2f && prev !== 0x5C) { inRegex = false; }
      } else if (
        c === 0x7C && // pipe
        exp.charCodeAt(i + 1) !== 0x7C &&
        exp.charCodeAt(i - 1) !== 0x7C &&
        !curly && !square && !paren
      ) {
        if (expression === undefined) {
          // first filter, end of expression
          lastFilterIndex = i + 1;
          expression = exp.slice(0, i).trim();
        } else {
          pushFilter();
        }
      } else {
        switch (c) {
          case 0x22: inDouble = true; break         // "
          case 0x27: inSingle = true; break         // '
          case 0x60: inTemplateString = true; break // `
          case 0x28: paren++; break                 // (
          case 0x29: paren--; break                 // )
          case 0x5B: square++; break                // [
          case 0x5D: square--; break                // ]
          case 0x7B: curly++; break                 // {
          case 0x7D: curly--; break                 // }
        }
        if (c === 0x2f) { // /
          var j = i - 1;
          var p = (void 0);
          // find first non-whitespace prev char
          for (; j >= 0; j--) {
            p = exp.charAt(j);
            if (p !== ' ') { break }
          }
          if (!p || !validDivisionCharRE.test(p)) {
            inRegex = true;
          }
        }
      }
    }

    if (expression === undefined) {
      expression = exp.slice(0, i).trim();
    } else if (lastFilterIndex !== 0) {
      pushFilter();
    }

    function pushFilter () {
      (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim());
      lastFilterIndex = i + 1;
    }

    if (filters) {
      for (i = 0; i < filters.length; i++) {
        expression = wrapFilter(expression, filters[i]);
      }
    }

    return expression
  }

  function wrapFilter (exp, filter) {
    var i = filter.indexOf('(');
    if (i < 0) {
      // _f: resolveFilter
      return ("_f(\"" + filter + "\")(" + exp + ")")
    } else {
      var name = filter.slice(0, i);
      var args = filter.slice(i + 1);
      return ("_f(\"" + name + "\")(" + exp + (args !== ')' ? ',' + args : args))
    }
  }

  /*  */

  var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;
  var regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g;

  var buildRegex = cached(function (delimiters) {
    var open = delimiters[0].replace(regexEscapeRE, '\\$&');
    var close = delimiters[1].replace(regexEscapeRE, '\\$&');
    return new RegExp(open + '((?:.|\\n)+?)' + close, 'g')
  });



  function parseText (
    text,
    delimiters
  ) {
    var tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE;
    if (!tagRE.test(text)) {
      return
    }
    var tokens = [];
    var rawTokens = [];
    var lastIndex = tagRE.lastIndex = 0;
    var match, index, tokenValue;
    while ((match = tagRE.exec(text))) {
      index = match.index;
      // push text token
      if (index > lastIndex) {
        rawTokens.push(tokenValue = text.slice(lastIndex, index));
        tokens.push(JSON.stringify(tokenValue));
      }
      // tag token
      var exp = parseFilters(match[1].trim());
      tokens.push(("_s(" + exp + ")"));
      rawTokens.push({ '@binding': exp });
      lastIndex = index + match[0].length;
    }
    if (lastIndex < text.length) {
      rawTokens.push(tokenValue = text.slice(lastIndex));
      tokens.push(JSON.stringify(tokenValue));
    }
    return {
      expression: tokens.join('+'),
      tokens: rawTokens
    }
  }

  /*  */



  /* eslint-disable no-unused-vars */
  function baseWarn (msg, range) {
    console.error(("[Vue compiler]: " + msg));
  }
  /* eslint-enable no-unused-vars */

  function pluckModuleFunction (
    modules,
    key
  ) {
    return modules
      ? modules.map(function (m) { return m[key]; }).filter(function (_) { return _; })
      : []
  }
  // 为抽象语法树节点添加props属性
  function addProp (el, name, value, range, dynamic) {
    (el.props || (el.props = [])).push(rangeSetItem({ name: name, value: value, dynamic: dynamic }, range));
    el.plain = false;
  }

  function addAttr (el, name, value, range, dynamic) {
    var attrs = dynamic
      ? (el.dynamicAttrs || (el.dynamicAttrs = []))
      : (el.attrs || (el.attrs = []));
    attrs.push(rangeSetItem({ name: name, value: value, dynamic: dynamic }, range));
    el.plain = false;
  }

  // add a raw attr (use this in preTransforms)
  function addRawAttr (el, name, value, range) {
    el.attrsMap[name] = value;
    el.attrsList.push(rangeSetItem({ name: name, value: value }, range));
  }
  // 添加指令
  function addDirective (
    el,
    name,
    rawName,
    value,
    arg,
    isDynamicArg,
    modifiers,
    range
  ) {
    (el.directives || (el.directives = [])).push(rangeSetItem({
      name: name,
      rawName: rawName,
      value: value,
      arg: arg,
      isDynamicArg: isDynamicArg,
      modifiers: modifiers
    }, range));
    el.plain = false;
  }

  function prependModifierMarker (symbol, name, dynamic) {
    return dynamic
      ? ("_p(" + name + ",\"" + symbol + "\")")
      : symbol + name // mark the event as captured
  }

  function addHandler (
    el,
    name,
    value,
    modifiers,
    important,
    warn,
    range,
    dynamic
  ) {
    modifiers = modifiers || emptyObject;
    // warn prevent and passive modifier
    /* istanbul ignore if */
    if (
       warn &&
      modifiers.prevent && modifiers.passive
    ) {
      warn(
        'passive and prevent can\'t be used together. ' +
        'Passive handler can\'t prevent default event.',
        range
      );
    }

    // normalize click.right and click.middle since they don't actually fire
    // this is technically browser-specific, but at least for now browsers are
    // the only target envs that have right/middle clicks.
    if (modifiers.right) {
      if (dynamic) {
        name = "(" + name + ")==='click'?'contextmenu':(" + name + ")";
      } else if (name === 'click') {
        name = 'contextmenu';
        delete modifiers.right;
      }
    } else if (modifiers.middle) {
      if (dynamic) {
        name = "(" + name + ")==='click'?'mouseup':(" + name + ")";
      } else if (name === 'click') {
        name = 'mouseup';
      }
    }

    // check capture modifier
    if (modifiers.capture) {
      delete modifiers.capture;
      name = prependModifierMarker('!', name, dynamic);
    }
    if (modifiers.once) {
      delete modifiers.once;
      name = prependModifierMarker('~', name, dynamic);
    }
    /* istanbul ignore if */
    if (modifiers.passive) {
      delete modifiers.passive;
      name = prependModifierMarker('&', name, dynamic);
    }

    var events;
    if (modifiers.native) {
      delete modifiers.native;
      events = el.nativeEvents || (el.nativeEvents = {});
    } else {
      events = el.events || (el.events = {});
    }

    var newHandler = rangeSetItem({ value: value.trim(), dynamic: dynamic }, range);
    if (modifiers !== emptyObject) {
      newHandler.modifiers = modifiers;
    }

    var handlers = events[name];
    /* istanbul ignore if */
    if (Array.isArray(handlers)) {
      important ? handlers.unshift(newHandler) : handlers.push(newHandler);
    } else if (handlers) {
      events[name] = important ? [newHandler, handlers] : [handlers, newHandler];
    } else {
      events[name] = newHandler;
    }

    el.plain = false;
  }

  function getRawBindingAttr (
    el,
    name
  ) {
    return el.rawAttrsMap[':' + name] ||
      el.rawAttrsMap['v-bind:' + name] ||
      el.rawAttrsMap[name]
  }

  function getBindingAttr (
    el,
    name,
    getStatic
  ) {
    var dynamicValue =
      getAndRemoveAttr(el, ':' + name) ||
      getAndRemoveAttr(el, 'v-bind:' + name);
    if (dynamicValue != null) {
      return parseFilters(dynamicValue)
    } else if (getStatic !== false) {
      var staticValue = getAndRemoveAttr(el, name);
      if (staticValue != null) {
        return JSON.stringify(staticValue)
      }
    }
  }

  // note: this only removes the attr from the Array (attrsList) so that it
  // doesn't get processed by processAttrs.
  // By default it does NOT remove it from the map (attrsMap) because the map is
  // needed during codegen.
  function getAndRemoveAttr (
    el,
    name,
    removeFromMap
  ) {
    var val;
    if ((val = el.attrsMap[name]) != null) {
      var list = el.attrsList;
      for (var i = 0, l = list.length; i < l; i++) {
        if (list[i].name === name) {
          list.splice(i, 1);
          break
        }
      }
    }
    if (removeFromMap) {
      delete el.attrsMap[name];
    }
    return val
  }

  function getAndRemoveAttrByRegex (
    el,
    name
  ) {
    var list = el.attrsList;
    for (var i = 0, l = list.length; i < l; i++) {
      var attr = list[i];
      if (name.test(attr.name)) {
        list.splice(i, 1);
        return attr
      }
    }
  }

  function rangeSetItem (
    item,
    range
  ) {
    if (range) {
      if (range.start != null) {
        item.start = range.start;
      }
      if (range.end != null) {
        item.end = range.end;
      }
    }
    return item
  }

  /*  */

  function transformNode (el, options) {
    var warn = options.warn || baseWarn;
    var staticClass = getAndRemoveAttr(el, 'class');
    if ( staticClass) {
      var res = parseText(staticClass, options.delimiters);
      if (res) {
        warn(
          "class=\"" + staticClass + "\": " +
          'Interpolation inside attributes has been removed. ' +
          'Use v-bind or the colon shorthand instead. For example, ' +
          'instead of <div class="{{ val }}">, use <div :class="val">.',
          el.rawAttrsMap['class']
        );
      }
    }
    if (staticClass) {
      el.staticClass = JSON.stringify(staticClass.replace(/\s+/g, ' ').trim());
    }
    var classBinding = getBindingAttr(el, 'class', false /* getStatic */);
    if (classBinding) {
      el.classBinding = classBinding;
    }
  }

  function genData (el) {
    var data = '';
    if (el.staticClass) {
      data += "staticClass:" + (el.staticClass) + ",";
    }
    if (el.classBinding) {
      data += "class:" + (el.classBinding) + ",";
    }
    return data
  }

  var klass = {
    staticKeys: ['staticClass'],
    transformNode: transformNode,
    genData: genData
  };

  /*  */

  function transformNode$1 (el, options) {
    var warn = options.warn || baseWarn;
    var staticStyle = getAndRemoveAttr(el, 'style');
    if (staticStyle) {
      /* istanbul ignore if */
      {
        var res = parseText(staticStyle, options.delimiters);
        if (res) {
          warn(
            "style=\"" + staticStyle + "\": " +
            'Interpolation inside attributes has been removed. ' +
            'Use v-bind or the colon shorthand instead. For example, ' +
            'instead of <div style="{{ val }}">, use <div :style="val">.',
            el.rawAttrsMap['style']
          );
        }
      }
      el.staticStyle = JSON.stringify(parseStyleText(staticStyle));
    }

    var styleBinding = getBindingAttr(el, 'style', false /* getStatic */);
    if (styleBinding) {
      el.styleBinding = styleBinding;
    }
  }

  function genData$1 (el) {
    var data = '';
    if (el.staticStyle) {
      data += "staticStyle:" + (el.staticStyle) + ",";
    }
    if (el.styleBinding) {
      data += "style:(" + (el.styleBinding) + "),";
    }
    return data
  }

  var style = {
    staticKeys: ['staticStyle'],
    transformNode: transformNode$1,
    genData: genData$1
  };

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var he = createCommonjsModule(function (module, exports) {
  (function(root) {

  	// Detect free variables `exports`.
  	var freeExports =  exports;

  	// Detect free variable `module`.
  	var freeModule =  module &&
  		module.exports == freeExports && module;

  	// Detect free variable `global`, from Node.js or Browserified code,
  	// and use it as `root`.
  	var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal;
  	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
  		root = freeGlobal;
  	}

  	/*--------------------------------------------------------------------------*/

  	// All astral symbols.
  	var regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
  	// All ASCII symbols (not just printable ASCII) except those listed in the
  	// first column of the overrides table.
  	// https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides
  	var regexAsciiWhitelist = /[\x01-\x7F]/g;
  	// All BMP symbols that are not ASCII newlines, printable ASCII symbols, or
  	// code points listed in the first column of the overrides table on
  	// https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides.
  	var regexBmpWhitelist = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;

  	var regexEncodeNonAscii = /<\u20D2|=\u20E5|>\u20D2|\u205F\u200A|\u219D\u0338|\u2202\u0338|\u2220\u20D2|\u2229\uFE00|\u222A\uFE00|\u223C\u20D2|\u223D\u0331|\u223E\u0333|\u2242\u0338|\u224B\u0338|\u224D\u20D2|\u224E\u0338|\u224F\u0338|\u2250\u0338|\u2261\u20E5|\u2264\u20D2|\u2265\u20D2|\u2266\u0338|\u2267\u0338|\u2268\uFE00|\u2269\uFE00|\u226A\u0338|\u226A\u20D2|\u226B\u0338|\u226B\u20D2|\u227F\u0338|\u2282\u20D2|\u2283\u20D2|\u228A\uFE00|\u228B\uFE00|\u228F\u0338|\u2290\u0338|\u2293\uFE00|\u2294\uFE00|\u22B4\u20D2|\u22B5\u20D2|\u22D8\u0338|\u22D9\u0338|\u22DA\uFE00|\u22DB\uFE00|\u22F5\u0338|\u22F9\u0338|\u2933\u0338|\u29CF\u0338|\u29D0\u0338|\u2A6D\u0338|\u2A70\u0338|\u2A7D\u0338|\u2A7E\u0338|\u2AA1\u0338|\u2AA2\u0338|\u2AAC\uFE00|\u2AAD\uFE00|\u2AAF\u0338|\u2AB0\u0338|\u2AC5\u0338|\u2AC6\u0338|\u2ACB\uFE00|\u2ACC\uFE00|\u2AFD\u20E5|[\xA0-\u0113\u0116-\u0122\u0124-\u012B\u012E-\u014D\u0150-\u017E\u0192\u01B5\u01F5\u0237\u02C6\u02C7\u02D8-\u02DD\u0311\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9\u03D1\u03D2\u03D5\u03D6\u03DC\u03DD\u03F0\u03F1\u03F5\u03F6\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E\u045F\u2002-\u2005\u2007-\u2010\u2013-\u2016\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2025\u2026\u2030-\u2035\u2039\u203A\u203E\u2041\u2043\u2044\u204F\u2057\u205F-\u2063\u20AC\u20DB\u20DC\u2102\u2105\u210A-\u2113\u2115-\u211E\u2122\u2124\u2127-\u2129\u212C\u212D\u212F-\u2131\u2133-\u2138\u2145-\u2148\u2153-\u215E\u2190-\u219B\u219D-\u21A7\u21A9-\u21AE\u21B0-\u21B3\u21B5-\u21B7\u21BA-\u21DB\u21DD\u21E4\u21E5\u21F5\u21FD-\u2205\u2207-\u2209\u220B\u220C\u220F-\u2214\u2216-\u2218\u221A\u221D-\u2238\u223A-\u2257\u2259\u225A\u225C\u225F-\u2262\u2264-\u228B\u228D-\u229B\u229D-\u22A5\u22A7-\u22B0\u22B2-\u22BB\u22BD-\u22DB\u22DE-\u22E3\u22E6-\u22F7\u22F9-\u22FE\u2305\u2306\u2308-\u2310\u2312\u2313\u2315\u2316\u231C-\u231F\u2322\u2323\u232D\u232E\u2336\u233D\u233F\u237C\u23B0\u23B1\u23B4-\u23B6\u23DC-\u23DF\u23E2\u23E7\u2423\u24C8\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550-\u256C\u2580\u2584\u2588\u2591-\u2593\u25A1\u25AA\u25AB\u25AD\u25AE\u25B1\u25B3-\u25B5\u25B8\u25B9\u25BD-\u25BF\u25C2\u25C3\u25CA\u25CB\u25EC\u25EF\u25F8-\u25FC\u2605\u2606\u260E\u2640\u2642\u2660\u2663\u2665\u2666\u266A\u266D-\u266F\u2713\u2717\u2720\u2736\u2758\u2772\u2773\u27C8\u27C9\u27E6-\u27ED\u27F5-\u27FA\u27FC\u27FF\u2902-\u2905\u290C-\u2913\u2916\u2919-\u2920\u2923-\u292A\u2933\u2935-\u2939\u293C\u293D\u2945\u2948-\u294B\u294E-\u2976\u2978\u2979\u297B-\u297F\u2985\u2986\u298B-\u2996\u299A\u299C\u299D\u29A4-\u29B7\u29B9\u29BB\u29BC\u29BE-\u29C5\u29C9\u29CD-\u29D0\u29DC-\u29DE\u29E3-\u29E5\u29EB\u29F4\u29F6\u2A00-\u2A02\u2A04\u2A06\u2A0C\u2A0D\u2A10-\u2A17\u2A22-\u2A27\u2A29\u2A2A\u2A2D-\u2A31\u2A33-\u2A3C\u2A3F\u2A40\u2A42-\u2A4D\u2A50\u2A53-\u2A58\u2A5A-\u2A5D\u2A5F\u2A66\u2A6A\u2A6D-\u2A75\u2A77-\u2A9A\u2A9D-\u2AA2\u2AA4-\u2AB0\u2AB3-\u2AC8\u2ACB\u2ACC\u2ACF-\u2ADB\u2AE4\u2AE6-\u2AE9\u2AEB-\u2AF3\u2AFD\uFB00-\uFB04]|\uD835[\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDD6B]/g;
  	var encodeMap = {'\xAD':'shy','\u200C':'zwnj','\u200D':'zwj','\u200E':'lrm','\u2063':'ic','\u2062':'it','\u2061':'af','\u200F':'rlm','\u200B':'ZeroWidthSpace','\u2060':'NoBreak','\u0311':'DownBreve','\u20DB':'tdot','\u20DC':'DotDot','\t':'Tab','\n':'NewLine','\u2008':'puncsp','\u205F':'MediumSpace','\u2009':'thinsp','\u200A':'hairsp','\u2004':'emsp13','\u2002':'ensp','\u2005':'emsp14','\u2003':'emsp','\u2007':'numsp','\xA0':'nbsp','\u205F\u200A':'ThickSpace','\u203E':'oline','_':'lowbar','\u2010':'dash','\u2013':'ndash','\u2014':'mdash','\u2015':'horbar',',':'comma',';':'semi','\u204F':'bsemi',':':'colon','\u2A74':'Colone','!':'excl','\xA1':'iexcl','?':'quest','\xBF':'iquest','.':'period','\u2025':'nldr','\u2026':'mldr','\xB7':'middot','\'':'apos','\u2018':'lsquo','\u2019':'rsquo','\u201A':'sbquo','\u2039':'lsaquo','\u203A':'rsaquo','"':'quot','\u201C':'ldquo','\u201D':'rdquo','\u201E':'bdquo','\xAB':'laquo','\xBB':'raquo','(':'lpar',')':'rpar','[':'lsqb',']':'rsqb','{':'lcub','}':'rcub','\u2308':'lceil','\u2309':'rceil','\u230A':'lfloor','\u230B':'rfloor','\u2985':'lopar','\u2986':'ropar','\u298B':'lbrke','\u298C':'rbrke','\u298D':'lbrkslu','\u298E':'rbrksld','\u298F':'lbrksld','\u2990':'rbrkslu','\u2991':'langd','\u2992':'rangd','\u2993':'lparlt','\u2994':'rpargt','\u2995':'gtlPar','\u2996':'ltrPar','\u27E6':'lobrk','\u27E7':'robrk','\u27E8':'lang','\u27E9':'rang','\u27EA':'Lang','\u27EB':'Rang','\u27EC':'loang','\u27ED':'roang','\u2772':'lbbrk','\u2773':'rbbrk','\u2016':'Vert','\xA7':'sect','\xB6':'para','@':'commat','*':'ast','/':'sol','undefined':null,'&':'amp','#':'num','%':'percnt','\u2030':'permil','\u2031':'pertenk','\u2020':'dagger','\u2021':'Dagger','\u2022':'bull','\u2043':'hybull','\u2032':'prime','\u2033':'Prime','\u2034':'tprime','\u2057':'qprime','\u2035':'bprime','\u2041':'caret','`':'grave','\xB4':'acute','\u02DC':'tilde','^':'Hat','\xAF':'macr','\u02D8':'breve','\u02D9':'dot','\xA8':'die','\u02DA':'ring','\u02DD':'dblac','\xB8':'cedil','\u02DB':'ogon','\u02C6':'circ','\u02C7':'caron','\xB0':'deg','\xA9':'copy','\xAE':'reg','\u2117':'copysr','\u2118':'wp','\u211E':'rx','\u2127':'mho','\u2129':'iiota','\u2190':'larr','\u219A':'nlarr','\u2192':'rarr','\u219B':'nrarr','\u2191':'uarr','\u2193':'darr','\u2194':'harr','\u21AE':'nharr','\u2195':'varr','\u2196':'nwarr','\u2197':'nearr','\u2198':'searr','\u2199':'swarr','\u219D':'rarrw','\u219D\u0338':'nrarrw','\u219E':'Larr','\u219F':'Uarr','\u21A0':'Rarr','\u21A1':'Darr','\u21A2':'larrtl','\u21A3':'rarrtl','\u21A4':'mapstoleft','\u21A5':'mapstoup','\u21A6':'map','\u21A7':'mapstodown','\u21A9':'larrhk','\u21AA':'rarrhk','\u21AB':'larrlp','\u21AC':'rarrlp','\u21AD':'harrw','\u21B0':'lsh','\u21B1':'rsh','\u21B2':'ldsh','\u21B3':'rdsh','\u21B5':'crarr','\u21B6':'cularr','\u21B7':'curarr','\u21BA':'olarr','\u21BB':'orarr','\u21BC':'lharu','\u21BD':'lhard','\u21BE':'uharr','\u21BF':'uharl','\u21C0':'rharu','\u21C1':'rhard','\u21C2':'dharr','\u21C3':'dharl','\u21C4':'rlarr','\u21C5':'udarr','\u21C6':'lrarr','\u21C7':'llarr','\u21C8':'uuarr','\u21C9':'rrarr','\u21CA':'ddarr','\u21CB':'lrhar','\u21CC':'rlhar','\u21D0':'lArr','\u21CD':'nlArr','\u21D1':'uArr','\u21D2':'rArr','\u21CF':'nrArr','\u21D3':'dArr','\u21D4':'iff','\u21CE':'nhArr','\u21D5':'vArr','\u21D6':'nwArr','\u21D7':'neArr','\u21D8':'seArr','\u21D9':'swArr','\u21DA':'lAarr','\u21DB':'rAarr','\u21DD':'zigrarr','\u21E4':'larrb','\u21E5':'rarrb','\u21F5':'duarr','\u21FD':'loarr','\u21FE':'roarr','\u21FF':'hoarr','\u2200':'forall','\u2201':'comp','\u2202':'part','\u2202\u0338':'npart','\u2203':'exist','\u2204':'nexist','\u2205':'empty','\u2207':'Del','\u2208':'in','\u2209':'notin','\u220B':'ni','\u220C':'notni','\u03F6':'bepsi','\u220F':'prod','\u2210':'coprod','\u2211':'sum','+':'plus','\xB1':'pm','\xF7':'div','\xD7':'times','<':'lt','\u226E':'nlt','<\u20D2':'nvlt','=':'equals','\u2260':'ne','=\u20E5':'bne','\u2A75':'Equal','>':'gt','\u226F':'ngt','>\u20D2':'nvgt','\xAC':'not','|':'vert','\xA6':'brvbar','\u2212':'minus','\u2213':'mp','\u2214':'plusdo','\u2044':'frasl','\u2216':'setmn','\u2217':'lowast','\u2218':'compfn','\u221A':'Sqrt','\u221D':'prop','\u221E':'infin','\u221F':'angrt','\u2220':'ang','\u2220\u20D2':'nang','\u2221':'angmsd','\u2222':'angsph','\u2223':'mid','\u2224':'nmid','\u2225':'par','\u2226':'npar','\u2227':'and','\u2228':'or','\u2229':'cap','\u2229\uFE00':'caps','\u222A':'cup','\u222A\uFE00':'cups','\u222B':'int','\u222C':'Int','\u222D':'tint','\u2A0C':'qint','\u222E':'oint','\u222F':'Conint','\u2230':'Cconint','\u2231':'cwint','\u2232':'cwconint','\u2233':'awconint','\u2234':'there4','\u2235':'becaus','\u2236':'ratio','\u2237':'Colon','\u2238':'minusd','\u223A':'mDDot','\u223B':'homtht','\u223C':'sim','\u2241':'nsim','\u223C\u20D2':'nvsim','\u223D':'bsim','\u223D\u0331':'race','\u223E':'ac','\u223E\u0333':'acE','\u223F':'acd','\u2240':'wr','\u2242':'esim','\u2242\u0338':'nesim','\u2243':'sime','\u2244':'nsime','\u2245':'cong','\u2247':'ncong','\u2246':'simne','\u2248':'ap','\u2249':'nap','\u224A':'ape','\u224B':'apid','\u224B\u0338':'napid','\u224C':'bcong','\u224D':'CupCap','\u226D':'NotCupCap','\u224D\u20D2':'nvap','\u224E':'bump','\u224E\u0338':'nbump','\u224F':'bumpe','\u224F\u0338':'nbumpe','\u2250':'doteq','\u2250\u0338':'nedot','\u2251':'eDot','\u2252':'efDot','\u2253':'erDot','\u2254':'colone','\u2255':'ecolon','\u2256':'ecir','\u2257':'cire','\u2259':'wedgeq','\u225A':'veeeq','\u225C':'trie','\u225F':'equest','\u2261':'equiv','\u2262':'nequiv','\u2261\u20E5':'bnequiv','\u2264':'le','\u2270':'nle','\u2264\u20D2':'nvle','\u2265':'ge','\u2271':'nge','\u2265\u20D2':'nvge','\u2266':'lE','\u2266\u0338':'nlE','\u2267':'gE','\u2267\u0338':'ngE','\u2268\uFE00':'lvnE','\u2268':'lnE','\u2269':'gnE','\u2269\uFE00':'gvnE','\u226A':'ll','\u226A\u0338':'nLtv','\u226A\u20D2':'nLt','\u226B':'gg','\u226B\u0338':'nGtv','\u226B\u20D2':'nGt','\u226C':'twixt','\u2272':'lsim','\u2274':'nlsim','\u2273':'gsim','\u2275':'ngsim','\u2276':'lg','\u2278':'ntlg','\u2277':'gl','\u2279':'ntgl','\u227A':'pr','\u2280':'npr','\u227B':'sc','\u2281':'nsc','\u227C':'prcue','\u22E0':'nprcue','\u227D':'sccue','\u22E1':'nsccue','\u227E':'prsim','\u227F':'scsim','\u227F\u0338':'NotSucceedsTilde','\u2282':'sub','\u2284':'nsub','\u2282\u20D2':'vnsub','\u2283':'sup','\u2285':'nsup','\u2283\u20D2':'vnsup','\u2286':'sube','\u2288':'nsube','\u2287':'supe','\u2289':'nsupe','\u228A\uFE00':'vsubne','\u228A':'subne','\u228B\uFE00':'vsupne','\u228B':'supne','\u228D':'cupdot','\u228E':'uplus','\u228F':'sqsub','\u228F\u0338':'NotSquareSubset','\u2290':'sqsup','\u2290\u0338':'NotSquareSuperset','\u2291':'sqsube','\u22E2':'nsqsube','\u2292':'sqsupe','\u22E3':'nsqsupe','\u2293':'sqcap','\u2293\uFE00':'sqcaps','\u2294':'sqcup','\u2294\uFE00':'sqcups','\u2295':'oplus','\u2296':'ominus','\u2297':'otimes','\u2298':'osol','\u2299':'odot','\u229A':'ocir','\u229B':'oast','\u229D':'odash','\u229E':'plusb','\u229F':'minusb','\u22A0':'timesb','\u22A1':'sdotb','\u22A2':'vdash','\u22AC':'nvdash','\u22A3':'dashv','\u22A4':'top','\u22A5':'bot','\u22A7':'models','\u22A8':'vDash','\u22AD':'nvDash','\u22A9':'Vdash','\u22AE':'nVdash','\u22AA':'Vvdash','\u22AB':'VDash','\u22AF':'nVDash','\u22B0':'prurel','\u22B2':'vltri','\u22EA':'nltri','\u22B3':'vrtri','\u22EB':'nrtri','\u22B4':'ltrie','\u22EC':'nltrie','\u22B4\u20D2':'nvltrie','\u22B5':'rtrie','\u22ED':'nrtrie','\u22B5\u20D2':'nvrtrie','\u22B6':'origof','\u22B7':'imof','\u22B8':'mumap','\u22B9':'hercon','\u22BA':'intcal','\u22BB':'veebar','\u22BD':'barvee','\u22BE':'angrtvb','\u22BF':'lrtri','\u22C0':'Wedge','\u22C1':'Vee','\u22C2':'xcap','\u22C3':'xcup','\u22C4':'diam','\u22C5':'sdot','\u22C6':'Star','\u22C7':'divonx','\u22C8':'bowtie','\u22C9':'ltimes','\u22CA':'rtimes','\u22CB':'lthree','\u22CC':'rthree','\u22CD':'bsime','\u22CE':'cuvee','\u22CF':'cuwed','\u22D0':'Sub','\u22D1':'Sup','\u22D2':'Cap','\u22D3':'Cup','\u22D4':'fork','\u22D5':'epar','\u22D6':'ltdot','\u22D7':'gtdot','\u22D8':'Ll','\u22D8\u0338':'nLl','\u22D9':'Gg','\u22D9\u0338':'nGg','\u22DA\uFE00':'lesg','\u22DA':'leg','\u22DB':'gel','\u22DB\uFE00':'gesl','\u22DE':'cuepr','\u22DF':'cuesc','\u22E6':'lnsim','\u22E7':'gnsim','\u22E8':'prnsim','\u22E9':'scnsim','\u22EE':'vellip','\u22EF':'ctdot','\u22F0':'utdot','\u22F1':'dtdot','\u22F2':'disin','\u22F3':'isinsv','\u22F4':'isins','\u22F5':'isindot','\u22F5\u0338':'notindot','\u22F6':'notinvc','\u22F7':'notinvb','\u22F9':'isinE','\u22F9\u0338':'notinE','\u22FA':'nisd','\u22FB':'xnis','\u22FC':'nis','\u22FD':'notnivc','\u22FE':'notnivb','\u2305':'barwed','\u2306':'Barwed','\u230C':'drcrop','\u230D':'dlcrop','\u230E':'urcrop','\u230F':'ulcrop','\u2310':'bnot','\u2312':'profline','\u2313':'profsurf','\u2315':'telrec','\u2316':'target','\u231C':'ulcorn','\u231D':'urcorn','\u231E':'dlcorn','\u231F':'drcorn','\u2322':'frown','\u2323':'smile','\u232D':'cylcty','\u232E':'profalar','\u2336':'topbot','\u233D':'ovbar','\u233F':'solbar','\u237C':'angzarr','\u23B0':'lmoust','\u23B1':'rmoust','\u23B4':'tbrk','\u23B5':'bbrk','\u23B6':'bbrktbrk','\u23DC':'OverParenthesis','\u23DD':'UnderParenthesis','\u23DE':'OverBrace','\u23DF':'UnderBrace','\u23E2':'trpezium','\u23E7':'elinters','\u2423':'blank','\u2500':'boxh','\u2502':'boxv','\u250C':'boxdr','\u2510':'boxdl','\u2514':'boxur','\u2518':'boxul','\u251C':'boxvr','\u2524':'boxvl','\u252C':'boxhd','\u2534':'boxhu','\u253C':'boxvh','\u2550':'boxH','\u2551':'boxV','\u2552':'boxdR','\u2553':'boxDr','\u2554':'boxDR','\u2555':'boxdL','\u2556':'boxDl','\u2557':'boxDL','\u2558':'boxuR','\u2559':'boxUr','\u255A':'boxUR','\u255B':'boxuL','\u255C':'boxUl','\u255D':'boxUL','\u255E':'boxvR','\u255F':'boxVr','\u2560':'boxVR','\u2561':'boxvL','\u2562':'boxVl','\u2563':'boxVL','\u2564':'boxHd','\u2565':'boxhD','\u2566':'boxHD','\u2567':'boxHu','\u2568':'boxhU','\u2569':'boxHU','\u256A':'boxvH','\u256B':'boxVh','\u256C':'boxVH','\u2580':'uhblk','\u2584':'lhblk','\u2588':'block','\u2591':'blk14','\u2592':'blk12','\u2593':'blk34','\u25A1':'squ','\u25AA':'squf','\u25AB':'EmptyVerySmallSquare','\u25AD':'rect','\u25AE':'marker','\u25B1':'fltns','\u25B3':'xutri','\u25B4':'utrif','\u25B5':'utri','\u25B8':'rtrif','\u25B9':'rtri','\u25BD':'xdtri','\u25BE':'dtrif','\u25BF':'dtri','\u25C2':'ltrif','\u25C3':'ltri','\u25CA':'loz','\u25CB':'cir','\u25EC':'tridot','\u25EF':'xcirc','\u25F8':'ultri','\u25F9':'urtri','\u25FA':'lltri','\u25FB':'EmptySmallSquare','\u25FC':'FilledSmallSquare','\u2605':'starf','\u2606':'star','\u260E':'phone','\u2640':'female','\u2642':'male','\u2660':'spades','\u2663':'clubs','\u2665':'hearts','\u2666':'diams','\u266A':'sung','\u2713':'check','\u2717':'cross','\u2720':'malt','\u2736':'sext','\u2758':'VerticalSeparator','\u27C8':'bsolhsub','\u27C9':'suphsol','\u27F5':'xlarr','\u27F6':'xrarr','\u27F7':'xharr','\u27F8':'xlArr','\u27F9':'xrArr','\u27FA':'xhArr','\u27FC':'xmap','\u27FF':'dzigrarr','\u2902':'nvlArr','\u2903':'nvrArr','\u2904':'nvHarr','\u2905':'Map','\u290C':'lbarr','\u290D':'rbarr','\u290E':'lBarr','\u290F':'rBarr','\u2910':'RBarr','\u2911':'DDotrahd','\u2912':'UpArrowBar','\u2913':'DownArrowBar','\u2916':'Rarrtl','\u2919':'latail','\u291A':'ratail','\u291B':'lAtail','\u291C':'rAtail','\u291D':'larrfs','\u291E':'rarrfs','\u291F':'larrbfs','\u2920':'rarrbfs','\u2923':'nwarhk','\u2924':'nearhk','\u2925':'searhk','\u2926':'swarhk','\u2927':'nwnear','\u2928':'toea','\u2929':'tosa','\u292A':'swnwar','\u2933':'rarrc','\u2933\u0338':'nrarrc','\u2935':'cudarrr','\u2936':'ldca','\u2937':'rdca','\u2938':'cudarrl','\u2939':'larrpl','\u293C':'curarrm','\u293D':'cularrp','\u2945':'rarrpl','\u2948':'harrcir','\u2949':'Uarrocir','\u294A':'lurdshar','\u294B':'ldrushar','\u294E':'LeftRightVector','\u294F':'RightUpDownVector','\u2950':'DownLeftRightVector','\u2951':'LeftUpDownVector','\u2952':'LeftVectorBar','\u2953':'RightVectorBar','\u2954':'RightUpVectorBar','\u2955':'RightDownVectorBar','\u2956':'DownLeftVectorBar','\u2957':'DownRightVectorBar','\u2958':'LeftUpVectorBar','\u2959':'LeftDownVectorBar','\u295A':'LeftTeeVector','\u295B':'RightTeeVector','\u295C':'RightUpTeeVector','\u295D':'RightDownTeeVector','\u295E':'DownLeftTeeVector','\u295F':'DownRightTeeVector','\u2960':'LeftUpTeeVector','\u2961':'LeftDownTeeVector','\u2962':'lHar','\u2963':'uHar','\u2964':'rHar','\u2965':'dHar','\u2966':'luruhar','\u2967':'ldrdhar','\u2968':'ruluhar','\u2969':'rdldhar','\u296A':'lharul','\u296B':'llhard','\u296C':'rharul','\u296D':'lrhard','\u296E':'udhar','\u296F':'duhar','\u2970':'RoundImplies','\u2971':'erarr','\u2972':'simrarr','\u2973':'larrsim','\u2974':'rarrsim','\u2975':'rarrap','\u2976':'ltlarr','\u2978':'gtrarr','\u2979':'subrarr','\u297B':'suplarr','\u297C':'lfisht','\u297D':'rfisht','\u297E':'ufisht','\u297F':'dfisht','\u299A':'vzigzag','\u299C':'vangrt','\u299D':'angrtvbd','\u29A4':'ange','\u29A5':'range','\u29A6':'dwangle','\u29A7':'uwangle','\u29A8':'angmsdaa','\u29A9':'angmsdab','\u29AA':'angmsdac','\u29AB':'angmsdad','\u29AC':'angmsdae','\u29AD':'angmsdaf','\u29AE':'angmsdag','\u29AF':'angmsdah','\u29B0':'bemptyv','\u29B1':'demptyv','\u29B2':'cemptyv','\u29B3':'raemptyv','\u29B4':'laemptyv','\u29B5':'ohbar','\u29B6':'omid','\u29B7':'opar','\u29B9':'operp','\u29BB':'olcross','\u29BC':'odsold','\u29BE':'olcir','\u29BF':'ofcir','\u29C0':'olt','\u29C1':'ogt','\u29C2':'cirscir','\u29C3':'cirE','\u29C4':'solb','\u29C5':'bsolb','\u29C9':'boxbox','\u29CD':'trisb','\u29CE':'rtriltri','\u29CF':'LeftTriangleBar','\u29CF\u0338':'NotLeftTriangleBar','\u29D0':'RightTriangleBar','\u29D0\u0338':'NotRightTriangleBar','\u29DC':'iinfin','\u29DD':'infintie','\u29DE':'nvinfin','\u29E3':'eparsl','\u29E4':'smeparsl','\u29E5':'eqvparsl','\u29EB':'lozf','\u29F4':'RuleDelayed','\u29F6':'dsol','\u2A00':'xodot','\u2A01':'xoplus','\u2A02':'xotime','\u2A04':'xuplus','\u2A06':'xsqcup','\u2A0D':'fpartint','\u2A10':'cirfnint','\u2A11':'awint','\u2A12':'rppolint','\u2A13':'scpolint','\u2A14':'npolint','\u2A15':'pointint','\u2A16':'quatint','\u2A17':'intlarhk','\u2A22':'pluscir','\u2A23':'plusacir','\u2A24':'simplus','\u2A25':'plusdu','\u2A26':'plussim','\u2A27':'plustwo','\u2A29':'mcomma','\u2A2A':'minusdu','\u2A2D':'loplus','\u2A2E':'roplus','\u2A2F':'Cross','\u2A30':'timesd','\u2A31':'timesbar','\u2A33':'smashp','\u2A34':'lotimes','\u2A35':'rotimes','\u2A36':'otimesas','\u2A37':'Otimes','\u2A38':'odiv','\u2A39':'triplus','\u2A3A':'triminus','\u2A3B':'tritime','\u2A3C':'iprod','\u2A3F':'amalg','\u2A40':'capdot','\u2A42':'ncup','\u2A43':'ncap','\u2A44':'capand','\u2A45':'cupor','\u2A46':'cupcap','\u2A47':'capcup','\u2A48':'cupbrcap','\u2A49':'capbrcup','\u2A4A':'cupcup','\u2A4B':'capcap','\u2A4C':'ccups','\u2A4D':'ccaps','\u2A50':'ccupssm','\u2A53':'And','\u2A54':'Or','\u2A55':'andand','\u2A56':'oror','\u2A57':'orslope','\u2A58':'andslope','\u2A5A':'andv','\u2A5B':'orv','\u2A5C':'andd','\u2A5D':'ord','\u2A5F':'wedbar','\u2A66':'sdote','\u2A6A':'simdot','\u2A6D':'congdot','\u2A6D\u0338':'ncongdot','\u2A6E':'easter','\u2A6F':'apacir','\u2A70':'apE','\u2A70\u0338':'napE','\u2A71':'eplus','\u2A72':'pluse','\u2A73':'Esim','\u2A77':'eDDot','\u2A78':'equivDD','\u2A79':'ltcir','\u2A7A':'gtcir','\u2A7B':'ltquest','\u2A7C':'gtquest','\u2A7D':'les','\u2A7D\u0338':'nles','\u2A7E':'ges','\u2A7E\u0338':'nges','\u2A7F':'lesdot','\u2A80':'gesdot','\u2A81':'lesdoto','\u2A82':'gesdoto','\u2A83':'lesdotor','\u2A84':'gesdotol','\u2A85':'lap','\u2A86':'gap','\u2A87':'lne','\u2A88':'gne','\u2A89':'lnap','\u2A8A':'gnap','\u2A8B':'lEg','\u2A8C':'gEl','\u2A8D':'lsime','\u2A8E':'gsime','\u2A8F':'lsimg','\u2A90':'gsiml','\u2A91':'lgE','\u2A92':'glE','\u2A93':'lesges','\u2A94':'gesles','\u2A95':'els','\u2A96':'egs','\u2A97':'elsdot','\u2A98':'egsdot','\u2A99':'el','\u2A9A':'eg','\u2A9D':'siml','\u2A9E':'simg','\u2A9F':'simlE','\u2AA0':'simgE','\u2AA1':'LessLess','\u2AA1\u0338':'NotNestedLessLess','\u2AA2':'GreaterGreater','\u2AA2\u0338':'NotNestedGreaterGreater','\u2AA4':'glj','\u2AA5':'gla','\u2AA6':'ltcc','\u2AA7':'gtcc','\u2AA8':'lescc','\u2AA9':'gescc','\u2AAA':'smt','\u2AAB':'lat','\u2AAC':'smte','\u2AAC\uFE00':'smtes','\u2AAD':'late','\u2AAD\uFE00':'lates','\u2AAE':'bumpE','\u2AAF':'pre','\u2AAF\u0338':'npre','\u2AB0':'sce','\u2AB0\u0338':'nsce','\u2AB3':'prE','\u2AB4':'scE','\u2AB5':'prnE','\u2AB6':'scnE','\u2AB7':'prap','\u2AB8':'scap','\u2AB9':'prnap','\u2ABA':'scnap','\u2ABB':'Pr','\u2ABC':'Sc','\u2ABD':'subdot','\u2ABE':'supdot','\u2ABF':'subplus','\u2AC0':'supplus','\u2AC1':'submult','\u2AC2':'supmult','\u2AC3':'subedot','\u2AC4':'supedot','\u2AC5':'subE','\u2AC5\u0338':'nsubE','\u2AC6':'supE','\u2AC6\u0338':'nsupE','\u2AC7':'subsim','\u2AC8':'supsim','\u2ACB\uFE00':'vsubnE','\u2ACB':'subnE','\u2ACC\uFE00':'vsupnE','\u2ACC':'supnE','\u2ACF':'csub','\u2AD0':'csup','\u2AD1':'csube','\u2AD2':'csupe','\u2AD3':'subsup','\u2AD4':'supsub','\u2AD5':'subsub','\u2AD6':'supsup','\u2AD7':'suphsub','\u2AD8':'supdsub','\u2AD9':'forkv','\u2ADA':'topfork','\u2ADB':'mlcp','\u2AE4':'Dashv','\u2AE6':'Vdashl','\u2AE7':'Barv','\u2AE8':'vBar','\u2AE9':'vBarv','\u2AEB':'Vbar','\u2AEC':'Not','\u2AED':'bNot','\u2AEE':'rnmid','\u2AEF':'cirmid','\u2AF0':'midcir','\u2AF1':'topcir','\u2AF2':'nhpar','\u2AF3':'parsim','\u2AFD':'parsl','\u2AFD\u20E5':'nparsl','\u266D':'flat','\u266E':'natur','\u266F':'sharp','\xA4':'curren','\xA2':'cent','$':'dollar','\xA3':'pound','\xA5':'yen','\u20AC':'euro','\xB9':'sup1','\xBD':'half','\u2153':'frac13','\xBC':'frac14','\u2155':'frac15','\u2159':'frac16','\u215B':'frac18','\xB2':'sup2','\u2154':'frac23','\u2156':'frac25','\xB3':'sup3','\xBE':'frac34','\u2157':'frac35','\u215C':'frac38','\u2158':'frac45','\u215A':'frac56','\u215D':'frac58','\u215E':'frac78','\uD835\uDCB6':'ascr','\uD835\uDD52':'aopf','\uD835\uDD1E':'afr','\uD835\uDD38':'Aopf','\uD835\uDD04':'Afr','\uD835\uDC9C':'Ascr','\xAA':'ordf','\xE1':'aacute','\xC1':'Aacute','\xE0':'agrave','\xC0':'Agrave','\u0103':'abreve','\u0102':'Abreve','\xE2':'acirc','\xC2':'Acirc','\xE5':'aring','\xC5':'angst','\xE4':'auml','\xC4':'Auml','\xE3':'atilde','\xC3':'Atilde','\u0105':'aogon','\u0104':'Aogon','\u0101':'amacr','\u0100':'Amacr','\xE6':'aelig','\xC6':'AElig','\uD835\uDCB7':'bscr','\uD835\uDD53':'bopf','\uD835\uDD1F':'bfr','\uD835\uDD39':'Bopf','\u212C':'Bscr','\uD835\uDD05':'Bfr','\uD835\uDD20':'cfr','\uD835\uDCB8':'cscr','\uD835\uDD54':'copf','\u212D':'Cfr','\uD835\uDC9E':'Cscr','\u2102':'Copf','\u0107':'cacute','\u0106':'Cacute','\u0109':'ccirc','\u0108':'Ccirc','\u010D':'ccaron','\u010C':'Ccaron','\u010B':'cdot','\u010A':'Cdot','\xE7':'ccedil','\xC7':'Ccedil','\u2105':'incare','\uD835\uDD21':'dfr','\u2146':'dd','\uD835\uDD55':'dopf','\uD835\uDCB9':'dscr','\uD835\uDC9F':'Dscr','\uD835\uDD07':'Dfr','\u2145':'DD','\uD835\uDD3B':'Dopf','\u010F':'dcaron','\u010E':'Dcaron','\u0111':'dstrok','\u0110':'Dstrok','\xF0':'eth','\xD0':'ETH','\u2147':'ee','\u212F':'escr','\uD835\uDD22':'efr','\uD835\uDD56':'eopf','\u2130':'Escr','\uD835\uDD08':'Efr','\uD835\uDD3C':'Eopf','\xE9':'eacute','\xC9':'Eacute','\xE8':'egrave','\xC8':'Egrave','\xEA':'ecirc','\xCA':'Ecirc','\u011B':'ecaron','\u011A':'Ecaron','\xEB':'euml','\xCB':'Euml','\u0117':'edot','\u0116':'Edot','\u0119':'eogon','\u0118':'Eogon','\u0113':'emacr','\u0112':'Emacr','\uD835\uDD23':'ffr','\uD835\uDD57':'fopf','\uD835\uDCBB':'fscr','\uD835\uDD09':'Ffr','\uD835\uDD3D':'Fopf','\u2131':'Fscr','\uFB00':'fflig','\uFB03':'ffilig','\uFB04':'ffllig','\uFB01':'filig','fj':'fjlig','\uFB02':'fllig','\u0192':'fnof','\u210A':'gscr','\uD835\uDD58':'gopf','\uD835\uDD24':'gfr','\uD835\uDCA2':'Gscr','\uD835\uDD3E':'Gopf','\uD835\uDD0A':'Gfr','\u01F5':'gacute','\u011F':'gbreve','\u011E':'Gbreve','\u011D':'gcirc','\u011C':'Gcirc','\u0121':'gdot','\u0120':'Gdot','\u0122':'Gcedil','\uD835\uDD25':'hfr','\u210E':'planckh','\uD835\uDCBD':'hscr','\uD835\uDD59':'hopf','\u210B':'Hscr','\u210C':'Hfr','\u210D':'Hopf','\u0125':'hcirc','\u0124':'Hcirc','\u210F':'hbar','\u0127':'hstrok','\u0126':'Hstrok','\uD835\uDD5A':'iopf','\uD835\uDD26':'ifr','\uD835\uDCBE':'iscr','\u2148':'ii','\uD835\uDD40':'Iopf','\u2110':'Iscr','\u2111':'Im','\xED':'iacute','\xCD':'Iacute','\xEC':'igrave','\xCC':'Igrave','\xEE':'icirc','\xCE':'Icirc','\xEF':'iuml','\xCF':'Iuml','\u0129':'itilde','\u0128':'Itilde','\u0130':'Idot','\u012F':'iogon','\u012E':'Iogon','\u012B':'imacr','\u012A':'Imacr','\u0133':'ijlig','\u0132':'IJlig','\u0131':'imath','\uD835\uDCBF':'jscr','\uD835\uDD5B':'jopf','\uD835\uDD27':'jfr','\uD835\uDCA5':'Jscr','\uD835\uDD0D':'Jfr','\uD835\uDD41':'Jopf','\u0135':'jcirc','\u0134':'Jcirc','\u0237':'jmath','\uD835\uDD5C':'kopf','\uD835\uDCC0':'kscr','\uD835\uDD28':'kfr','\uD835\uDCA6':'Kscr','\uD835\uDD42':'Kopf','\uD835\uDD0E':'Kfr','\u0137':'kcedil','\u0136':'Kcedil','\uD835\uDD29':'lfr','\uD835\uDCC1':'lscr','\u2113':'ell','\uD835\uDD5D':'lopf','\u2112':'Lscr','\uD835\uDD0F':'Lfr','\uD835\uDD43':'Lopf','\u013A':'lacute','\u0139':'Lacute','\u013E':'lcaron','\u013D':'Lcaron','\u013C':'lcedil','\u013B':'Lcedil','\u0142':'lstrok','\u0141':'Lstrok','\u0140':'lmidot','\u013F':'Lmidot','\uD835\uDD2A':'mfr','\uD835\uDD5E':'mopf','\uD835\uDCC2':'mscr','\uD835\uDD10':'Mfr','\uD835\uDD44':'Mopf','\u2133':'Mscr','\uD835\uDD2B':'nfr','\uD835\uDD5F':'nopf','\uD835\uDCC3':'nscr','\u2115':'Nopf','\uD835\uDCA9':'Nscr','\uD835\uDD11':'Nfr','\u0144':'nacute','\u0143':'Nacute','\u0148':'ncaron','\u0147':'Ncaron','\xF1':'ntilde','\xD1':'Ntilde','\u0146':'ncedil','\u0145':'Ncedil','\u2116':'numero','\u014B':'eng','\u014A':'ENG','\uD835\uDD60':'oopf','\uD835\uDD2C':'ofr','\u2134':'oscr','\uD835\uDCAA':'Oscr','\uD835\uDD12':'Ofr','\uD835\uDD46':'Oopf','\xBA':'ordm','\xF3':'oacute','\xD3':'Oacute','\xF2':'ograve','\xD2':'Ograve','\xF4':'ocirc','\xD4':'Ocirc','\xF6':'ouml','\xD6':'Ouml','\u0151':'odblac','\u0150':'Odblac','\xF5':'otilde','\xD5':'Otilde','\xF8':'oslash','\xD8':'Oslash','\u014D':'omacr','\u014C':'Omacr','\u0153':'oelig','\u0152':'OElig','\uD835\uDD2D':'pfr','\uD835\uDCC5':'pscr','\uD835\uDD61':'popf','\u2119':'Popf','\uD835\uDD13':'Pfr','\uD835\uDCAB':'Pscr','\uD835\uDD62':'qopf','\uD835\uDD2E':'qfr','\uD835\uDCC6':'qscr','\uD835\uDCAC':'Qscr','\uD835\uDD14':'Qfr','\u211A':'Qopf','\u0138':'kgreen','\uD835\uDD2F':'rfr','\uD835\uDD63':'ropf','\uD835\uDCC7':'rscr','\u211B':'Rscr','\u211C':'Re','\u211D':'Ropf','\u0155':'racute','\u0154':'Racute','\u0159':'rcaron','\u0158':'Rcaron','\u0157':'rcedil','\u0156':'Rcedil','\uD835\uDD64':'sopf','\uD835\uDCC8':'sscr','\uD835\uDD30':'sfr','\uD835\uDD4A':'Sopf','\uD835\uDD16':'Sfr','\uD835\uDCAE':'Sscr','\u24C8':'oS','\u015B':'sacute','\u015A':'Sacute','\u015D':'scirc','\u015C':'Scirc','\u0161':'scaron','\u0160':'Scaron','\u015F':'scedil','\u015E':'Scedil','\xDF':'szlig','\uD835\uDD31':'tfr','\uD835\uDCC9':'tscr','\uD835\uDD65':'topf','\uD835\uDCAF':'Tscr','\uD835\uDD17':'Tfr','\uD835\uDD4B':'Topf','\u0165':'tcaron','\u0164':'Tcaron','\u0163':'tcedil','\u0162':'Tcedil','\u2122':'trade','\u0167':'tstrok','\u0166':'Tstrok','\uD835\uDCCA':'uscr','\uD835\uDD66':'uopf','\uD835\uDD32':'ufr','\uD835\uDD4C':'Uopf','\uD835\uDD18':'Ufr','\uD835\uDCB0':'Uscr','\xFA':'uacute','\xDA':'Uacute','\xF9':'ugrave','\xD9':'Ugrave','\u016D':'ubreve','\u016C':'Ubreve','\xFB':'ucirc','\xDB':'Ucirc','\u016F':'uring','\u016E':'Uring','\xFC':'uuml','\xDC':'Uuml','\u0171':'udblac','\u0170':'Udblac','\u0169':'utilde','\u0168':'Utilde','\u0173':'uogon','\u0172':'Uogon','\u016B':'umacr','\u016A':'Umacr','\uD835\uDD33':'vfr','\uD835\uDD67':'vopf','\uD835\uDCCB':'vscr','\uD835\uDD19':'Vfr','\uD835\uDD4D':'Vopf','\uD835\uDCB1':'Vscr','\uD835\uDD68':'wopf','\uD835\uDCCC':'wscr','\uD835\uDD34':'wfr','\uD835\uDCB2':'Wscr','\uD835\uDD4E':'Wopf','\uD835\uDD1A':'Wfr','\u0175':'wcirc','\u0174':'Wcirc','\uD835\uDD35':'xfr','\uD835\uDCCD':'xscr','\uD835\uDD69':'xopf','\uD835\uDD4F':'Xopf','\uD835\uDD1B':'Xfr','\uD835\uDCB3':'Xscr','\uD835\uDD36':'yfr','\uD835\uDCCE':'yscr','\uD835\uDD6A':'yopf','\uD835\uDCB4':'Yscr','\uD835\uDD1C':'Yfr','\uD835\uDD50':'Yopf','\xFD':'yacute','\xDD':'Yacute','\u0177':'ycirc','\u0176':'Ycirc','\xFF':'yuml','\u0178':'Yuml','\uD835\uDCCF':'zscr','\uD835\uDD37':'zfr','\uD835\uDD6B':'zopf','\u2128':'Zfr','\u2124':'Zopf','\uD835\uDCB5':'Zscr','\u017A':'zacute','\u0179':'Zacute','\u017E':'zcaron','\u017D':'Zcaron','\u017C':'zdot','\u017B':'Zdot','\u01B5':'imped','\xFE':'thorn','\xDE':'THORN','\u0149':'napos','\u03B1':'alpha','\u0391':'Alpha','\u03B2':'beta','\u0392':'Beta','\u03B3':'gamma','\u0393':'Gamma','\u03B4':'delta','\u0394':'Delta','\u03B5':'epsi','\u03F5':'epsiv','\u0395':'Epsilon','\u03DD':'gammad','\u03DC':'Gammad','\u03B6':'zeta','\u0396':'Zeta','\u03B7':'eta','\u0397':'Eta','\u03B8':'theta','\u03D1':'thetav','\u0398':'Theta','\u03B9':'iota','\u0399':'Iota','\u03BA':'kappa','\u03F0':'kappav','\u039A':'Kappa','\u03BB':'lambda','\u039B':'Lambda','\u03BC':'mu','\xB5':'micro','\u039C':'Mu','\u03BD':'nu','\u039D':'Nu','\u03BE':'xi','\u039E':'Xi','\u03BF':'omicron','\u039F':'Omicron','\u03C0':'pi','\u03D6':'piv','\u03A0':'Pi','\u03C1':'rho','\u03F1':'rhov','\u03A1':'Rho','\u03C3':'sigma','\u03A3':'Sigma','\u03C2':'sigmaf','\u03C4':'tau','\u03A4':'Tau','\u03C5':'upsi','\u03A5':'Upsilon','\u03D2':'Upsi','\u03C6':'phi','\u03D5':'phiv','\u03A6':'Phi','\u03C7':'chi','\u03A7':'Chi','\u03C8':'psi','\u03A8':'Psi','\u03C9':'omega','\u03A9':'ohm','\u0430':'acy','\u0410':'Acy','\u0431':'bcy','\u0411':'Bcy','\u0432':'vcy','\u0412':'Vcy','\u0433':'gcy','\u0413':'Gcy','\u0453':'gjcy','\u0403':'GJcy','\u0434':'dcy','\u0414':'Dcy','\u0452':'djcy','\u0402':'DJcy','\u0435':'iecy','\u0415':'IEcy','\u0451':'iocy','\u0401':'IOcy','\u0454':'jukcy','\u0404':'Jukcy','\u0436':'zhcy','\u0416':'ZHcy','\u0437':'zcy','\u0417':'Zcy','\u0455':'dscy','\u0405':'DScy','\u0438':'icy','\u0418':'Icy','\u0456':'iukcy','\u0406':'Iukcy','\u0457':'yicy','\u0407':'YIcy','\u0439':'jcy','\u0419':'Jcy','\u0458':'jsercy','\u0408':'Jsercy','\u043A':'kcy','\u041A':'Kcy','\u045C':'kjcy','\u040C':'KJcy','\u043B':'lcy','\u041B':'Lcy','\u0459':'ljcy','\u0409':'LJcy','\u043C':'mcy','\u041C':'Mcy','\u043D':'ncy','\u041D':'Ncy','\u045A':'njcy','\u040A':'NJcy','\u043E':'ocy','\u041E':'Ocy','\u043F':'pcy','\u041F':'Pcy','\u0440':'rcy','\u0420':'Rcy','\u0441':'scy','\u0421':'Scy','\u0442':'tcy','\u0422':'Tcy','\u045B':'tshcy','\u040B':'TSHcy','\u0443':'ucy','\u0423':'Ucy','\u045E':'ubrcy','\u040E':'Ubrcy','\u0444':'fcy','\u0424':'Fcy','\u0445':'khcy','\u0425':'KHcy','\u0446':'tscy','\u0426':'TScy','\u0447':'chcy','\u0427':'CHcy','\u045F':'dzcy','\u040F':'DZcy','\u0448':'shcy','\u0428':'SHcy','\u0449':'shchcy','\u0429':'SHCHcy','\u044A':'hardcy','\u042A':'HARDcy','\u044B':'ycy','\u042B':'Ycy','\u044C':'softcy','\u042C':'SOFTcy','\u044D':'ecy','\u042D':'Ecy','\u044E':'yucy','\u042E':'YUcy','\u044F':'yacy','\u042F':'YAcy','\u2135':'aleph','\u2136':'beth','\u2137':'gimel','\u2138':'daleth'};

  	var regexEscape = /["&'<>`]/g;
  	var escapeMap = {
  		'"': '&quot;',
  		'&': '&amp;',
  		'\'': '&#x27;',
  		'<': '&lt;',
  		// See https://mathiasbynens.be/notes/ambiguous-ampersands: in HTML, the
  		// following is not strictly necessary unless it’s part of a tag or an
  		// unquoted attribute value. We’re only escaping it to support those
  		// situations, and for XML support.
  		'>': '&gt;',
  		// In Internet Explorer ≤ 8, the backtick character can be used
  		// to break out of (un)quoted attribute values or HTML comments.
  		// See http://html5sec.org/#102, http://html5sec.org/#108, and
  		// http://html5sec.org/#133.
  		'`': '&#x60;'
  	};

  	var regexInvalidEntity = /&#(?:[xX][^a-fA-F0-9]|[^0-9xX])/;
  	var regexInvalidRawCodePoint = /[\0-\x08\x0B\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
  	var regexDecode = /&(CounterClockwiseContourIntegral|DoubleLongLeftRightArrow|ClockwiseContourIntegral|NotNestedGreaterGreater|NotSquareSupersetEqual|DiacriticalDoubleAcute|NotRightTriangleEqual|NotSucceedsSlantEqual|NotPrecedesSlantEqual|CloseCurlyDoubleQuote|NegativeVeryThinSpace|DoubleContourIntegral|FilledVerySmallSquare|CapitalDifferentialD|OpenCurlyDoubleQuote|EmptyVerySmallSquare|NestedGreaterGreater|DoubleLongRightArrow|NotLeftTriangleEqual|NotGreaterSlantEqual|ReverseUpEquilibrium|DoubleLeftRightArrow|NotSquareSubsetEqual|NotDoubleVerticalBar|RightArrowLeftArrow|NotGreaterFullEqual|NotRightTriangleBar|SquareSupersetEqual|DownLeftRightVector|DoubleLongLeftArrow|leftrightsquigarrow|LeftArrowRightArrow|NegativeMediumSpace|blacktriangleright|RightDownVectorBar|PrecedesSlantEqual|RightDoubleBracket|SucceedsSlantEqual|NotLeftTriangleBar|RightTriangleEqual|SquareIntersection|RightDownTeeVector|ReverseEquilibrium|NegativeThickSpace|longleftrightarrow|Longleftrightarrow|LongLeftRightArrow|DownRightTeeVector|DownRightVectorBar|GreaterSlantEqual|SquareSubsetEqual|LeftDownVectorBar|LeftDoubleBracket|VerticalSeparator|rightleftharpoons|NotGreaterGreater|NotSquareSuperset|blacktriangleleft|blacktriangledown|NegativeThinSpace|LeftDownTeeVector|NotLessSlantEqual|leftrightharpoons|DoubleUpDownArrow|DoubleVerticalBar|LeftTriangleEqual|FilledSmallSquare|twoheadrightarrow|NotNestedLessLess|DownLeftTeeVector|DownLeftVectorBar|RightAngleBracket|NotTildeFullEqual|NotReverseElement|RightUpDownVector|DiacriticalTilde|NotSucceedsTilde|circlearrowright|NotPrecedesEqual|rightharpoondown|DoubleRightArrow|NotSucceedsEqual|NonBreakingSpace|NotRightTriangle|LessEqualGreater|RightUpTeeVector|LeftAngleBracket|GreaterFullEqual|DownArrowUpArrow|RightUpVectorBar|twoheadleftarrow|GreaterEqualLess|downharpoonright|RightTriangleBar|ntrianglerighteq|NotSupersetEqual|LeftUpDownVector|DiacriticalAcute|rightrightarrows|vartriangleright|UpArrowDownArrow|DiacriticalGrave|UnderParenthesis|EmptySmallSquare|LeftUpVectorBar|leftrightarrows|DownRightVector|downharpoonleft|trianglerighteq|ShortRightArrow|OverParenthesis|DoubleLeftArrow|DoubleDownArrow|NotSquareSubset|bigtriangledown|ntrianglelefteq|UpperRightArrow|curvearrowright|vartriangleleft|NotLeftTriangle|nleftrightarrow|LowerRightArrow|NotHumpDownHump|NotGreaterTilde|rightthreetimes|LeftUpTeeVector|NotGreaterEqual|straightepsilon|LeftTriangleBar|rightsquigarrow|ContourIntegral|rightleftarrows|CloseCurlyQuote|RightDownVector|LeftRightVector|nLeftrightarrow|leftharpoondown|circlearrowleft|SquareSuperset|OpenCurlyQuote|hookrightarrow|HorizontalLine|DiacriticalDot|NotLessGreater|ntriangleright|DoubleRightTee|InvisibleComma|InvisibleTimes|LowerLeftArrow|DownLeftVector|NotSubsetEqual|curvearrowleft|trianglelefteq|NotVerticalBar|TildeFullEqual|downdownarrows|NotGreaterLess|RightTeeVector|ZeroWidthSpace|looparrowright|LongRightArrow|doublebarwedge|ShortLeftArrow|ShortDownArrow|RightVectorBar|GreaterGreater|ReverseElement|rightharpoonup|LessSlantEqual|leftthreetimes|upharpoonright|rightarrowtail|LeftDownVector|Longrightarrow|NestedLessLess|UpperLeftArrow|nshortparallel|leftleftarrows|leftrightarrow|Leftrightarrow|LeftRightArrow|longrightarrow|upharpoonleft|RightArrowBar|ApplyFunction|LeftTeeVector|leftarrowtail|NotEqualTilde|varsubsetneqq|varsupsetneqq|RightTeeArrow|SucceedsEqual|SucceedsTilde|LeftVectorBar|SupersetEqual|hookleftarrow|DifferentialD|VerticalTilde|VeryThinSpace|blacktriangle|bigtriangleup|LessFullEqual|divideontimes|leftharpoonup|UpEquilibrium|ntriangleleft|RightTriangle|measuredangle|shortparallel|longleftarrow|Longleftarrow|LongLeftArrow|DoubleLeftTee|Poincareplane|PrecedesEqual|triangleright|DoubleUpArrow|RightUpVector|fallingdotseq|looparrowleft|PrecedesTilde|NotTildeEqual|NotTildeTilde|smallsetminus|Proportional|triangleleft|triangledown|UnderBracket|NotHumpEqual|exponentiale|ExponentialE|NotLessTilde|HilbertSpace|RightCeiling|blacklozenge|varsupsetneq|HumpDownHump|GreaterEqual|VerticalLine|LeftTeeArrow|NotLessEqual|DownTeeArrow|LeftTriangle|varsubsetneq|Intersection|NotCongruent|DownArrowBar|LeftUpVector|LeftArrowBar|risingdotseq|GreaterTilde|RoundImplies|SquareSubset|ShortUpArrow|NotSuperset|quaternions|precnapprox|backepsilon|preccurlyeq|OverBracket|blacksquare|MediumSpace|VerticalBar|circledcirc|circleddash|CircleMinus|CircleTimes|LessGreater|curlyeqprec|curlyeqsucc|diamondsuit|UpDownArrow|Updownarrow|RuleDelayed|Rrightarrow|updownarrow|RightVector|nRightarrow|nrightarrow|eqslantless|LeftCeiling|Equilibrium|SmallCircle|expectation|NotSucceeds|thickapprox|GreaterLess|SquareUnion|NotPrecedes|NotLessLess|straightphi|succnapprox|succcurlyeq|SubsetEqual|sqsupseteq|Proportion|Laplacetrf|ImaginaryI|supsetneqq|NotGreater|gtreqqless|NotElement|ThickSpace|TildeEqual|TildeTilde|Fouriertrf|rmoustache|EqualTilde|eqslantgtr|UnderBrace|LeftVector|UpArrowBar|nLeftarrow|nsubseteqq|subsetneqq|nsupseteqq|nleftarrow|succapprox|lessapprox|UpTeeArrow|upuparrows|curlywedge|lesseqqgtr|varepsilon|varnothing|RightFloor|complement|CirclePlus|sqsubseteq|Lleftarrow|circledast|RightArrow|Rightarrow|rightarrow|lmoustache|Bernoullis|precapprox|mapstoleft|mapstodown|longmapsto|dotsquare|downarrow|DoubleDot|nsubseteq|supsetneq|leftarrow|nsupseteq|subsetneq|ThinSpace|ngeqslant|subseteqq|HumpEqual|NotSubset|triangleq|NotCupCap|lesseqgtr|heartsuit|TripleDot|Leftarrow|Coproduct|Congruent|varpropto|complexes|gvertneqq|LeftArrow|LessTilde|supseteqq|MinusPlus|CircleDot|nleqslant|NotExists|gtreqless|nparallel|UnionPlus|LeftFloor|checkmark|CenterDot|centerdot|Mellintrf|gtrapprox|bigotimes|OverBrace|spadesuit|therefore|pitchfork|rationals|PlusMinus|Backslash|Therefore|DownBreve|backsimeq|backprime|DownArrow|nshortmid|Downarrow|lvertneqq|eqvparsl|imagline|imagpart|infintie|integers|Integral|intercal|LessLess|Uarrocir|intlarhk|sqsupset|angmsdaf|sqsubset|llcorner|vartheta|cupbrcap|lnapprox|Superset|SuchThat|succnsim|succneqq|angmsdag|biguplus|curlyvee|trpezium|Succeeds|NotTilde|bigwedge|angmsdah|angrtvbd|triminus|cwconint|fpartint|lrcorner|smeparsl|subseteq|urcorner|lurdshar|laemptyv|DDotrahd|approxeq|ldrushar|awconint|mapstoup|backcong|shortmid|triangle|geqslant|gesdotol|timesbar|circledR|circledS|setminus|multimap|naturals|scpolint|ncongdot|RightTee|boxminus|gnapprox|boxtimes|andslope|thicksim|angmsdaa|varsigma|cirfnint|rtriltri|angmsdab|rppolint|angmsdac|barwedge|drbkarow|clubsuit|thetasym|bsolhsub|capbrcup|dzigrarr|doteqdot|DotEqual|dotminus|UnderBar|NotEqual|realpart|otimesas|ulcorner|hksearow|hkswarow|parallel|PartialD|elinters|emptyset|plusacir|bbrktbrk|angmsdad|pointint|bigoplus|angmsdae|Precedes|bigsqcup|varkappa|notindot|supseteq|precneqq|precnsim|profalar|profline|profsurf|leqslant|lesdotor|raemptyv|subplus|notnivb|notnivc|subrarr|zigrarr|vzigzag|submult|subedot|Element|between|cirscir|larrbfs|larrsim|lotimes|lbrksld|lbrkslu|lozenge|ldrdhar|dbkarow|bigcirc|epsilon|simrarr|simplus|ltquest|Epsilon|luruhar|gtquest|maltese|npolint|eqcolon|npreceq|bigodot|ddagger|gtrless|bnequiv|harrcir|ddotseq|equivDD|backsim|demptyv|nsqsube|nsqsupe|Upsilon|nsubset|upsilon|minusdu|nsucceq|swarrow|nsupset|coloneq|searrow|boxplus|napprox|natural|asympeq|alefsym|congdot|nearrow|bigstar|diamond|supplus|tritime|LeftTee|nvinfin|triplus|NewLine|nvltrie|nvrtrie|nwarrow|nexists|Diamond|ruluhar|Implies|supmult|angzarr|suplarr|suphsub|questeq|because|digamma|Because|olcross|bemptyv|omicron|Omicron|rotimes|NoBreak|intprod|angrtvb|orderof|uwangle|suphsol|lesdoto|orslope|DownTee|realine|cudarrl|rdldhar|OverBar|supedot|lessdot|supdsub|topfork|succsim|rbrkslu|rbrksld|pertenk|cudarrr|isindot|planckh|lessgtr|pluscir|gesdoto|plussim|plustwo|lesssim|cularrp|rarrsim|Cayleys|notinva|notinvb|notinvc|UpArrow|Uparrow|uparrow|NotLess|dwangle|precsim|Product|curarrm|Cconint|dotplus|rarrbfs|ccupssm|Cedilla|cemptyv|notniva|quatint|frac35|frac38|frac45|frac56|frac58|frac78|tridot|xoplus|gacute|gammad|Gammad|lfisht|lfloor|bigcup|sqsupe|gbreve|Gbreve|lharul|sqsube|sqcups|Gcedil|apacir|llhard|lmidot|Lmidot|lmoust|andand|sqcaps|approx|Abreve|spades|circeq|tprime|divide|topcir|Assign|topbot|gesdot|divonx|xuplus|timesd|gesles|atilde|solbar|SOFTcy|loplus|timesb|lowast|lowbar|dlcorn|dlcrop|softcy|dollar|lparlt|thksim|lrhard|Atilde|lsaquo|smashp|bigvee|thinsp|wreath|bkarow|lsquor|lstrok|Lstrok|lthree|ltimes|ltlarr|DotDot|simdot|ltrPar|weierp|xsqcup|angmsd|sigmav|sigmaf|zeetrf|Zcaron|zcaron|mapsto|vsupne|thetav|cirmid|marker|mcomma|Zacute|vsubnE|there4|gtlPar|vsubne|bottom|gtrarr|SHCHcy|shchcy|midast|midcir|middot|minusb|minusd|gtrdot|bowtie|sfrown|mnplus|models|colone|seswar|Colone|mstpos|searhk|gtrsim|nacute|Nacute|boxbox|telrec|hairsp|Tcedil|nbumpe|scnsim|ncaron|Ncaron|ncedil|Ncedil|hamilt|Scedil|nearhk|hardcy|HARDcy|tcedil|Tcaron|commat|nequiv|nesear|tcaron|target|hearts|nexist|varrho|scedil|Scaron|scaron|hellip|Sacute|sacute|hercon|swnwar|compfn|rtimes|rthree|rsquor|rsaquo|zacute|wedgeq|homtht|barvee|barwed|Barwed|rpargt|horbar|conint|swarhk|roplus|nltrie|hslash|hstrok|Hstrok|rmoust|Conint|bprime|hybull|hyphen|iacute|Iacute|supsup|supsub|supsim|varphi|coprod|brvbar|agrave|Supset|supset|igrave|Igrave|notinE|Agrave|iiiint|iinfin|copysr|wedbar|Verbar|vangrt|becaus|incare|verbar|inodot|bullet|drcorn|intcal|drcrop|cularr|vellip|Utilde|bumpeq|cupcap|dstrok|Dstrok|CupCap|cupcup|cupdot|eacute|Eacute|supdot|iquest|easter|ecaron|Ecaron|ecolon|isinsv|utilde|itilde|Itilde|curarr|succeq|Bumpeq|cacute|ulcrop|nparsl|Cacute|nprcue|egrave|Egrave|nrarrc|nrarrw|subsup|subsub|nrtrie|jsercy|nsccue|Jsercy|kappav|kcedil|Kcedil|subsim|ulcorn|nsimeq|egsdot|veebar|kgreen|capand|elsdot|Subset|subset|curren|aacute|lacute|Lacute|emptyv|ntilde|Ntilde|lagran|lambda|Lambda|capcap|Ugrave|langle|subdot|emsp13|numero|emsp14|nvdash|nvDash|nVdash|nVDash|ugrave|ufisht|nvHarr|larrfs|nvlArr|larrhk|larrlp|larrpl|nvrArr|Udblac|nwarhk|larrtl|nwnear|oacute|Oacute|latail|lAtail|sstarf|lbrace|odblac|Odblac|lbrack|udblac|odsold|eparsl|lcaron|Lcaron|ograve|Ograve|lcedil|Lcedil|Aacute|ssmile|ssetmn|squarf|ldquor|capcup|ominus|cylcty|rharul|eqcirc|dagger|rfloor|rfisht|Dagger|daleth|equals|origof|capdot|equest|dcaron|Dcaron|rdquor|oslash|Oslash|otilde|Otilde|otimes|Otimes|urcrop|Ubreve|ubreve|Yacute|Uacute|uacute|Rcedil|rcedil|urcorn|parsim|Rcaron|Vdashl|rcaron|Tstrok|percnt|period|permil|Exists|yacute|rbrack|rbrace|phmmat|ccaron|Ccaron|planck|ccedil|plankv|tstrok|female|plusdo|plusdu|ffilig|plusmn|ffllig|Ccedil|rAtail|dfisht|bernou|ratail|Rarrtl|rarrtl|angsph|rarrpl|rarrlp|rarrhk|xwedge|xotime|forall|ForAll|Vvdash|vsupnE|preceq|bigcap|frac12|frac13|frac14|primes|rarrfs|prnsim|frac15|Square|frac16|square|lesdot|frac18|frac23|propto|prurel|rarrap|rangle|puncsp|frac25|Racute|qprime|racute|lesges|frac34|abreve|AElig|eqsim|utdot|setmn|urtri|Equal|Uring|seArr|uring|searr|dashv|Dashv|mumap|nabla|iogon|Iogon|sdote|sdotb|scsim|napid|napos|equiv|natur|Acirc|dblac|erarr|nbump|iprod|erDot|ucirc|awint|esdot|angrt|ncong|isinE|scnap|Scirc|scirc|ndash|isins|Ubrcy|nearr|neArr|isinv|nedot|ubrcy|acute|Ycirc|iukcy|Iukcy|xutri|nesim|caret|jcirc|Jcirc|caron|twixt|ddarr|sccue|exist|jmath|sbquo|ngeqq|angst|ccaps|lceil|ngsim|UpTee|delta|Delta|rtrif|nharr|nhArr|nhpar|rtrie|jukcy|Jukcy|kappa|rsquo|Kappa|nlarr|nlArr|TSHcy|rrarr|aogon|Aogon|fflig|xrarr|tshcy|ccirc|nleqq|filig|upsih|nless|dharl|nlsim|fjlig|ropar|nltri|dharr|robrk|roarr|fllig|fltns|roang|rnmid|subnE|subne|lAarr|trisb|Ccirc|acirc|ccups|blank|VDash|forkv|Vdash|langd|cedil|blk12|blk14|laquo|strns|diams|notin|vDash|larrb|blk34|block|disin|uplus|vdash|vBarv|aelig|starf|Wedge|check|xrArr|lates|lbarr|lBarr|notni|lbbrk|bcong|frasl|lbrke|frown|vrtri|vprop|vnsup|gamma|Gamma|wedge|xodot|bdquo|srarr|doteq|ldquo|boxdl|boxdL|gcirc|Gcirc|boxDl|boxDL|boxdr|boxdR|boxDr|TRADE|trade|rlhar|boxDR|vnsub|npart|vltri|rlarr|boxhd|boxhD|nprec|gescc|nrarr|nrArr|boxHd|boxHD|boxhu|boxhU|nrtri|boxHu|clubs|boxHU|times|colon|Colon|gimel|xlArr|Tilde|nsime|tilde|nsmid|nspar|THORN|thorn|xlarr|nsube|nsubE|thkap|xhArr|comma|nsucc|boxul|boxuL|nsupe|nsupE|gneqq|gnsim|boxUl|boxUL|grave|boxur|boxuR|boxUr|boxUR|lescc|angle|bepsi|boxvh|varpi|boxvH|numsp|Theta|gsime|gsiml|theta|boxVh|boxVH|boxvl|gtcir|gtdot|boxvL|boxVl|boxVL|crarr|cross|Cross|nvsim|boxvr|nwarr|nwArr|sqsup|dtdot|Uogon|lhard|lharu|dtrif|ocirc|Ocirc|lhblk|duarr|odash|sqsub|Hacek|sqcup|llarr|duhar|oelig|OElig|ofcir|boxvR|uogon|lltri|boxVr|csube|uuarr|ohbar|csupe|ctdot|olarr|olcir|harrw|oline|sqcap|omacr|Omacr|omega|Omega|boxVR|aleph|lneqq|lnsim|loang|loarr|rharu|lobrk|hcirc|operp|oplus|rhard|Hcirc|orarr|Union|order|ecirc|Ecirc|cuepr|szlig|cuesc|breve|reals|eDDot|Breve|hoarr|lopar|utrif|rdquo|Umacr|umacr|efDot|swArr|ultri|alpha|rceil|ovbar|swarr|Wcirc|wcirc|smtes|smile|bsemi|lrarr|aring|parsl|lrhar|bsime|uhblk|lrtri|cupor|Aring|uharr|uharl|slarr|rbrke|bsolb|lsime|rbbrk|RBarr|lsimg|phone|rBarr|rbarr|icirc|lsquo|Icirc|emacr|Emacr|ratio|simne|plusb|simlE|simgE|simeq|pluse|ltcir|ltdot|empty|xharr|xdtri|iexcl|Alpha|ltrie|rarrw|pound|ltrif|xcirc|bumpe|prcue|bumpE|asymp|amacr|cuvee|Sigma|sigma|iiint|udhar|iiota|ijlig|IJlig|supnE|imacr|Imacr|prime|Prime|image|prnap|eogon|Eogon|rarrc|mdash|mDDot|cuwed|imath|supne|imped|Amacr|udarr|prsim|micro|rarrb|cwint|raquo|infin|eplus|range|rangd|Ucirc|radic|minus|amalg|veeeq|rAarr|epsiv|ycirc|quest|sharp|quot|zwnj|Qscr|race|qscr|Qopf|qopf|qint|rang|Rang|Zscr|zscr|Zopf|zopf|rarr|rArr|Rarr|Pscr|pscr|prop|prod|prnE|prec|ZHcy|zhcy|prap|Zeta|zeta|Popf|popf|Zdot|plus|zdot|Yuml|yuml|phiv|YUcy|yucy|Yscr|yscr|perp|Yopf|yopf|part|para|YIcy|Ouml|rcub|yicy|YAcy|rdca|ouml|osol|Oscr|rdsh|yacy|real|oscr|xvee|andd|rect|andv|Xscr|oror|ordm|ordf|xscr|ange|aopf|Aopf|rHar|Xopf|opar|Oopf|xopf|xnis|rhov|oopf|omid|xmap|oint|apid|apos|ogon|ascr|Ascr|odot|odiv|xcup|xcap|ocir|oast|nvlt|nvle|nvgt|nvge|nvap|Wscr|wscr|auml|ntlg|ntgl|nsup|nsub|nsim|Nscr|nscr|nsce|Wopf|ring|npre|wopf|npar|Auml|Barv|bbrk|Nopf|nopf|nmid|nLtv|beta|ropf|Ropf|Beta|beth|nles|rpar|nleq|bnot|bNot|nldr|NJcy|rscr|Rscr|Vscr|vscr|rsqb|njcy|bopf|nisd|Bopf|rtri|Vopf|nGtv|ngtr|vopf|boxh|boxH|boxv|nges|ngeq|boxV|bscr|scap|Bscr|bsim|Vert|vert|bsol|bull|bump|caps|cdot|ncup|scnE|ncap|nbsp|napE|Cdot|cent|sdot|Vbar|nang|vBar|chcy|Mscr|mscr|sect|semi|CHcy|Mopf|mopf|sext|circ|cire|mldr|mlcp|cirE|comp|shcy|SHcy|vArr|varr|cong|copf|Copf|copy|COPY|malt|male|macr|lvnE|cscr|ltri|sime|ltcc|simg|Cscr|siml|csub|Uuml|lsqb|lsim|uuml|csup|Lscr|lscr|utri|smid|lpar|cups|smte|lozf|darr|Lopf|Uscr|solb|lopf|sopf|Sopf|lneq|uscr|spar|dArr|lnap|Darr|dash|Sqrt|LJcy|ljcy|lHar|dHar|Upsi|upsi|diam|lesg|djcy|DJcy|leqq|dopf|Dopf|dscr|Dscr|dscy|ldsh|ldca|squf|DScy|sscr|Sscr|dsol|lcub|late|star|Star|Uopf|Larr|lArr|larr|uopf|dtri|dzcy|sube|subE|Lang|lang|Kscr|kscr|Kopf|kopf|KJcy|kjcy|KHcy|khcy|DZcy|ecir|edot|eDot|Jscr|jscr|succ|Jopf|jopf|Edot|uHar|emsp|ensp|Iuml|iuml|eopf|isin|Iscr|iscr|Eopf|epar|sung|epsi|escr|sup1|sup2|sup3|Iota|iota|supe|supE|Iopf|iopf|IOcy|iocy|Escr|esim|Esim|imof|Uarr|QUOT|uArr|uarr|euml|IEcy|iecy|Idot|Euml|euro|excl|Hscr|hscr|Hopf|hopf|TScy|tscy|Tscr|hbar|tscr|flat|tbrk|fnof|hArr|harr|half|fopf|Fopf|tdot|gvnE|fork|trie|gtcc|fscr|Fscr|gdot|gsim|Gscr|gscr|Gopf|gopf|gneq|Gdot|tosa|gnap|Topf|topf|geqq|toea|GJcy|gjcy|tint|gesl|mid|Sfr|ggg|top|ges|gla|glE|glj|geq|gne|gEl|gel|gnE|Gcy|gcy|gap|Tfr|tfr|Tcy|tcy|Hat|Tau|Ffr|tau|Tab|hfr|Hfr|ffr|Fcy|fcy|icy|Icy|iff|ETH|eth|ifr|Ifr|Eta|eta|int|Int|Sup|sup|ucy|Ucy|Sum|sum|jcy|ENG|ufr|Ufr|eng|Jcy|jfr|els|ell|egs|Efr|efr|Jfr|uml|kcy|Kcy|Ecy|ecy|kfr|Kfr|lap|Sub|sub|lat|lcy|Lcy|leg|Dot|dot|lEg|leq|les|squ|div|die|lfr|Lfr|lgE|Dfr|dfr|Del|deg|Dcy|dcy|lne|lnE|sol|loz|smt|Cup|lrm|cup|lsh|Lsh|sim|shy|map|Map|mcy|Mcy|mfr|Mfr|mho|gfr|Gfr|sfr|cir|Chi|chi|nap|Cfr|vcy|Vcy|cfr|Scy|scy|ncy|Ncy|vee|Vee|Cap|cap|nfr|scE|sce|Nfr|nge|ngE|nGg|vfr|Vfr|ngt|bot|nGt|nis|niv|Rsh|rsh|nle|nlE|bne|Bfr|bfr|nLl|nlt|nLt|Bcy|bcy|not|Not|rlm|wfr|Wfr|npr|nsc|num|ocy|ast|Ocy|ofr|xfr|Xfr|Ofr|ogt|ohm|apE|olt|Rho|ape|rho|Rfr|rfr|ord|REG|ang|reg|orv|And|and|AMP|Rcy|amp|Afr|ycy|Ycy|yen|yfr|Yfr|rcy|par|pcy|Pcy|pfr|Pfr|phi|Phi|afr|Acy|acy|zcy|Zcy|piv|acE|acd|zfr|Zfr|pre|prE|psi|Psi|qfr|Qfr|zwj|Or|ge|Gg|gt|gg|el|oS|lt|Lt|LT|Re|lg|gl|eg|ne|Im|it|le|DD|wp|wr|nu|Nu|dd|lE|Sc|sc|pi|Pi|ee|af|ll|Ll|rx|gE|xi|pm|Xi|ic|pr|Pr|in|ni|mp|mu|ac|Mu|or|ap|Gt|GT|ii);|&(Aacute|Agrave|Atilde|Ccedil|Eacute|Egrave|Iacute|Igrave|Ntilde|Oacute|Ograve|Oslash|Otilde|Uacute|Ugrave|Yacute|aacute|agrave|atilde|brvbar|ccedil|curren|divide|eacute|egrave|frac12|frac14|frac34|iacute|igrave|iquest|middot|ntilde|oacute|ograve|oslash|otilde|plusmn|uacute|ugrave|yacute|AElig|Acirc|Aring|Ecirc|Icirc|Ocirc|THORN|Ucirc|acirc|acute|aelig|aring|cedil|ecirc|icirc|iexcl|laquo|micro|ocirc|pound|raquo|szlig|thorn|times|ucirc|Auml|COPY|Euml|Iuml|Ouml|QUOT|Uuml|auml|cent|copy|euml|iuml|macr|nbsp|ordf|ordm|ouml|para|quot|sect|sup1|sup2|sup3|uuml|yuml|AMP|ETH|REG|amp|deg|eth|not|reg|shy|uml|yen|GT|LT|gt|lt)(?!;)([=a-zA-Z0-9]?)|&#([0-9]+)(;?)|&#[xX]([a-fA-F0-9]+)(;?)|&([0-9a-zA-Z]+)/g;
  	var decodeMap = {'aacute':'\xE1','Aacute':'\xC1','abreve':'\u0103','Abreve':'\u0102','ac':'\u223E','acd':'\u223F','acE':'\u223E\u0333','acirc':'\xE2','Acirc':'\xC2','acute':'\xB4','acy':'\u0430','Acy':'\u0410','aelig':'\xE6','AElig':'\xC6','af':'\u2061','afr':'\uD835\uDD1E','Afr':'\uD835\uDD04','agrave':'\xE0','Agrave':'\xC0','alefsym':'\u2135','aleph':'\u2135','alpha':'\u03B1','Alpha':'\u0391','amacr':'\u0101','Amacr':'\u0100','amalg':'\u2A3F','amp':'&','AMP':'&','and':'\u2227','And':'\u2A53','andand':'\u2A55','andd':'\u2A5C','andslope':'\u2A58','andv':'\u2A5A','ang':'\u2220','ange':'\u29A4','angle':'\u2220','angmsd':'\u2221','angmsdaa':'\u29A8','angmsdab':'\u29A9','angmsdac':'\u29AA','angmsdad':'\u29AB','angmsdae':'\u29AC','angmsdaf':'\u29AD','angmsdag':'\u29AE','angmsdah':'\u29AF','angrt':'\u221F','angrtvb':'\u22BE','angrtvbd':'\u299D','angsph':'\u2222','angst':'\xC5','angzarr':'\u237C','aogon':'\u0105','Aogon':'\u0104','aopf':'\uD835\uDD52','Aopf':'\uD835\uDD38','ap':'\u2248','apacir':'\u2A6F','ape':'\u224A','apE':'\u2A70','apid':'\u224B','apos':'\'','ApplyFunction':'\u2061','approx':'\u2248','approxeq':'\u224A','aring':'\xE5','Aring':'\xC5','ascr':'\uD835\uDCB6','Ascr':'\uD835\uDC9C','Assign':'\u2254','ast':'*','asymp':'\u2248','asympeq':'\u224D','atilde':'\xE3','Atilde':'\xC3','auml':'\xE4','Auml':'\xC4','awconint':'\u2233','awint':'\u2A11','backcong':'\u224C','backepsilon':'\u03F6','backprime':'\u2035','backsim':'\u223D','backsimeq':'\u22CD','Backslash':'\u2216','Barv':'\u2AE7','barvee':'\u22BD','barwed':'\u2305','Barwed':'\u2306','barwedge':'\u2305','bbrk':'\u23B5','bbrktbrk':'\u23B6','bcong':'\u224C','bcy':'\u0431','Bcy':'\u0411','bdquo':'\u201E','becaus':'\u2235','because':'\u2235','Because':'\u2235','bemptyv':'\u29B0','bepsi':'\u03F6','bernou':'\u212C','Bernoullis':'\u212C','beta':'\u03B2','Beta':'\u0392','beth':'\u2136','between':'\u226C','bfr':'\uD835\uDD1F','Bfr':'\uD835\uDD05','bigcap':'\u22C2','bigcirc':'\u25EF','bigcup':'\u22C3','bigodot':'\u2A00','bigoplus':'\u2A01','bigotimes':'\u2A02','bigsqcup':'\u2A06','bigstar':'\u2605','bigtriangledown':'\u25BD','bigtriangleup':'\u25B3','biguplus':'\u2A04','bigvee':'\u22C1','bigwedge':'\u22C0','bkarow':'\u290D','blacklozenge':'\u29EB','blacksquare':'\u25AA','blacktriangle':'\u25B4','blacktriangledown':'\u25BE','blacktriangleleft':'\u25C2','blacktriangleright':'\u25B8','blank':'\u2423','blk12':'\u2592','blk14':'\u2591','blk34':'\u2593','block':'\u2588','bne':'=\u20E5','bnequiv':'\u2261\u20E5','bnot':'\u2310','bNot':'\u2AED','bopf':'\uD835\uDD53','Bopf':'\uD835\uDD39','bot':'\u22A5','bottom':'\u22A5','bowtie':'\u22C8','boxbox':'\u29C9','boxdl':'\u2510','boxdL':'\u2555','boxDl':'\u2556','boxDL':'\u2557','boxdr':'\u250C','boxdR':'\u2552','boxDr':'\u2553','boxDR':'\u2554','boxh':'\u2500','boxH':'\u2550','boxhd':'\u252C','boxhD':'\u2565','boxHd':'\u2564','boxHD':'\u2566','boxhu':'\u2534','boxhU':'\u2568','boxHu':'\u2567','boxHU':'\u2569','boxminus':'\u229F','boxplus':'\u229E','boxtimes':'\u22A0','boxul':'\u2518','boxuL':'\u255B','boxUl':'\u255C','boxUL':'\u255D','boxur':'\u2514','boxuR':'\u2558','boxUr':'\u2559','boxUR':'\u255A','boxv':'\u2502','boxV':'\u2551','boxvh':'\u253C','boxvH':'\u256A','boxVh':'\u256B','boxVH':'\u256C','boxvl':'\u2524','boxvL':'\u2561','boxVl':'\u2562','boxVL':'\u2563','boxvr':'\u251C','boxvR':'\u255E','boxVr':'\u255F','boxVR':'\u2560','bprime':'\u2035','breve':'\u02D8','Breve':'\u02D8','brvbar':'\xA6','bscr':'\uD835\uDCB7','Bscr':'\u212C','bsemi':'\u204F','bsim':'\u223D','bsime':'\u22CD','bsol':'\\','bsolb':'\u29C5','bsolhsub':'\u27C8','bull':'\u2022','bullet':'\u2022','bump':'\u224E','bumpe':'\u224F','bumpE':'\u2AAE','bumpeq':'\u224F','Bumpeq':'\u224E','cacute':'\u0107','Cacute':'\u0106','cap':'\u2229','Cap':'\u22D2','capand':'\u2A44','capbrcup':'\u2A49','capcap':'\u2A4B','capcup':'\u2A47','capdot':'\u2A40','CapitalDifferentialD':'\u2145','caps':'\u2229\uFE00','caret':'\u2041','caron':'\u02C7','Cayleys':'\u212D','ccaps':'\u2A4D','ccaron':'\u010D','Ccaron':'\u010C','ccedil':'\xE7','Ccedil':'\xC7','ccirc':'\u0109','Ccirc':'\u0108','Cconint':'\u2230','ccups':'\u2A4C','ccupssm':'\u2A50','cdot':'\u010B','Cdot':'\u010A','cedil':'\xB8','Cedilla':'\xB8','cemptyv':'\u29B2','cent':'\xA2','centerdot':'\xB7','CenterDot':'\xB7','cfr':'\uD835\uDD20','Cfr':'\u212D','chcy':'\u0447','CHcy':'\u0427','check':'\u2713','checkmark':'\u2713','chi':'\u03C7','Chi':'\u03A7','cir':'\u25CB','circ':'\u02C6','circeq':'\u2257','circlearrowleft':'\u21BA','circlearrowright':'\u21BB','circledast':'\u229B','circledcirc':'\u229A','circleddash':'\u229D','CircleDot':'\u2299','circledR':'\xAE','circledS':'\u24C8','CircleMinus':'\u2296','CirclePlus':'\u2295','CircleTimes':'\u2297','cire':'\u2257','cirE':'\u29C3','cirfnint':'\u2A10','cirmid':'\u2AEF','cirscir':'\u29C2','ClockwiseContourIntegral':'\u2232','CloseCurlyDoubleQuote':'\u201D','CloseCurlyQuote':'\u2019','clubs':'\u2663','clubsuit':'\u2663','colon':':','Colon':'\u2237','colone':'\u2254','Colone':'\u2A74','coloneq':'\u2254','comma':',','commat':'@','comp':'\u2201','compfn':'\u2218','complement':'\u2201','complexes':'\u2102','cong':'\u2245','congdot':'\u2A6D','Congruent':'\u2261','conint':'\u222E','Conint':'\u222F','ContourIntegral':'\u222E','copf':'\uD835\uDD54','Copf':'\u2102','coprod':'\u2210','Coproduct':'\u2210','copy':'\xA9','COPY':'\xA9','copysr':'\u2117','CounterClockwiseContourIntegral':'\u2233','crarr':'\u21B5','cross':'\u2717','Cross':'\u2A2F','cscr':'\uD835\uDCB8','Cscr':'\uD835\uDC9E','csub':'\u2ACF','csube':'\u2AD1','csup':'\u2AD0','csupe':'\u2AD2','ctdot':'\u22EF','cudarrl':'\u2938','cudarrr':'\u2935','cuepr':'\u22DE','cuesc':'\u22DF','cularr':'\u21B6','cularrp':'\u293D','cup':'\u222A','Cup':'\u22D3','cupbrcap':'\u2A48','cupcap':'\u2A46','CupCap':'\u224D','cupcup':'\u2A4A','cupdot':'\u228D','cupor':'\u2A45','cups':'\u222A\uFE00','curarr':'\u21B7','curarrm':'\u293C','curlyeqprec':'\u22DE','curlyeqsucc':'\u22DF','curlyvee':'\u22CE','curlywedge':'\u22CF','curren':'\xA4','curvearrowleft':'\u21B6','curvearrowright':'\u21B7','cuvee':'\u22CE','cuwed':'\u22CF','cwconint':'\u2232','cwint':'\u2231','cylcty':'\u232D','dagger':'\u2020','Dagger':'\u2021','daleth':'\u2138','darr':'\u2193','dArr':'\u21D3','Darr':'\u21A1','dash':'\u2010','dashv':'\u22A3','Dashv':'\u2AE4','dbkarow':'\u290F','dblac':'\u02DD','dcaron':'\u010F','Dcaron':'\u010E','dcy':'\u0434','Dcy':'\u0414','dd':'\u2146','DD':'\u2145','ddagger':'\u2021','ddarr':'\u21CA','DDotrahd':'\u2911','ddotseq':'\u2A77','deg':'\xB0','Del':'\u2207','delta':'\u03B4','Delta':'\u0394','demptyv':'\u29B1','dfisht':'\u297F','dfr':'\uD835\uDD21','Dfr':'\uD835\uDD07','dHar':'\u2965','dharl':'\u21C3','dharr':'\u21C2','DiacriticalAcute':'\xB4','DiacriticalDot':'\u02D9','DiacriticalDoubleAcute':'\u02DD','DiacriticalGrave':'`','DiacriticalTilde':'\u02DC','diam':'\u22C4','diamond':'\u22C4','Diamond':'\u22C4','diamondsuit':'\u2666','diams':'\u2666','die':'\xA8','DifferentialD':'\u2146','digamma':'\u03DD','disin':'\u22F2','div':'\xF7','divide':'\xF7','divideontimes':'\u22C7','divonx':'\u22C7','djcy':'\u0452','DJcy':'\u0402','dlcorn':'\u231E','dlcrop':'\u230D','dollar':'$','dopf':'\uD835\uDD55','Dopf':'\uD835\uDD3B','dot':'\u02D9','Dot':'\xA8','DotDot':'\u20DC','doteq':'\u2250','doteqdot':'\u2251','DotEqual':'\u2250','dotminus':'\u2238','dotplus':'\u2214','dotsquare':'\u22A1','doublebarwedge':'\u2306','DoubleContourIntegral':'\u222F','DoubleDot':'\xA8','DoubleDownArrow':'\u21D3','DoubleLeftArrow':'\u21D0','DoubleLeftRightArrow':'\u21D4','DoubleLeftTee':'\u2AE4','DoubleLongLeftArrow':'\u27F8','DoubleLongLeftRightArrow':'\u27FA','DoubleLongRightArrow':'\u27F9','DoubleRightArrow':'\u21D2','DoubleRightTee':'\u22A8','DoubleUpArrow':'\u21D1','DoubleUpDownArrow':'\u21D5','DoubleVerticalBar':'\u2225','downarrow':'\u2193','Downarrow':'\u21D3','DownArrow':'\u2193','DownArrowBar':'\u2913','DownArrowUpArrow':'\u21F5','DownBreve':'\u0311','downdownarrows':'\u21CA','downharpoonleft':'\u21C3','downharpoonright':'\u21C2','DownLeftRightVector':'\u2950','DownLeftTeeVector':'\u295E','DownLeftVector':'\u21BD','DownLeftVectorBar':'\u2956','DownRightTeeVector':'\u295F','DownRightVector':'\u21C1','DownRightVectorBar':'\u2957','DownTee':'\u22A4','DownTeeArrow':'\u21A7','drbkarow':'\u2910','drcorn':'\u231F','drcrop':'\u230C','dscr':'\uD835\uDCB9','Dscr':'\uD835\uDC9F','dscy':'\u0455','DScy':'\u0405','dsol':'\u29F6','dstrok':'\u0111','Dstrok':'\u0110','dtdot':'\u22F1','dtri':'\u25BF','dtrif':'\u25BE','duarr':'\u21F5','duhar':'\u296F','dwangle':'\u29A6','dzcy':'\u045F','DZcy':'\u040F','dzigrarr':'\u27FF','eacute':'\xE9','Eacute':'\xC9','easter':'\u2A6E','ecaron':'\u011B','Ecaron':'\u011A','ecir':'\u2256','ecirc':'\xEA','Ecirc':'\xCA','ecolon':'\u2255','ecy':'\u044D','Ecy':'\u042D','eDDot':'\u2A77','edot':'\u0117','eDot':'\u2251','Edot':'\u0116','ee':'\u2147','efDot':'\u2252','efr':'\uD835\uDD22','Efr':'\uD835\uDD08','eg':'\u2A9A','egrave':'\xE8','Egrave':'\xC8','egs':'\u2A96','egsdot':'\u2A98','el':'\u2A99','Element':'\u2208','elinters':'\u23E7','ell':'\u2113','els':'\u2A95','elsdot':'\u2A97','emacr':'\u0113','Emacr':'\u0112','empty':'\u2205','emptyset':'\u2205','EmptySmallSquare':'\u25FB','emptyv':'\u2205','EmptyVerySmallSquare':'\u25AB','emsp':'\u2003','emsp13':'\u2004','emsp14':'\u2005','eng':'\u014B','ENG':'\u014A','ensp':'\u2002','eogon':'\u0119','Eogon':'\u0118','eopf':'\uD835\uDD56','Eopf':'\uD835\uDD3C','epar':'\u22D5','eparsl':'\u29E3','eplus':'\u2A71','epsi':'\u03B5','epsilon':'\u03B5','Epsilon':'\u0395','epsiv':'\u03F5','eqcirc':'\u2256','eqcolon':'\u2255','eqsim':'\u2242','eqslantgtr':'\u2A96','eqslantless':'\u2A95','Equal':'\u2A75','equals':'=','EqualTilde':'\u2242','equest':'\u225F','Equilibrium':'\u21CC','equiv':'\u2261','equivDD':'\u2A78','eqvparsl':'\u29E5','erarr':'\u2971','erDot':'\u2253','escr':'\u212F','Escr':'\u2130','esdot':'\u2250','esim':'\u2242','Esim':'\u2A73','eta':'\u03B7','Eta':'\u0397','eth':'\xF0','ETH':'\xD0','euml':'\xEB','Euml':'\xCB','euro':'\u20AC','excl':'!','exist':'\u2203','Exists':'\u2203','expectation':'\u2130','exponentiale':'\u2147','ExponentialE':'\u2147','fallingdotseq':'\u2252','fcy':'\u0444','Fcy':'\u0424','female':'\u2640','ffilig':'\uFB03','fflig':'\uFB00','ffllig':'\uFB04','ffr':'\uD835\uDD23','Ffr':'\uD835\uDD09','filig':'\uFB01','FilledSmallSquare':'\u25FC','FilledVerySmallSquare':'\u25AA','fjlig':'fj','flat':'\u266D','fllig':'\uFB02','fltns':'\u25B1','fnof':'\u0192','fopf':'\uD835\uDD57','Fopf':'\uD835\uDD3D','forall':'\u2200','ForAll':'\u2200','fork':'\u22D4','forkv':'\u2AD9','Fouriertrf':'\u2131','fpartint':'\u2A0D','frac12':'\xBD','frac13':'\u2153','frac14':'\xBC','frac15':'\u2155','frac16':'\u2159','frac18':'\u215B','frac23':'\u2154','frac25':'\u2156','frac34':'\xBE','frac35':'\u2157','frac38':'\u215C','frac45':'\u2158','frac56':'\u215A','frac58':'\u215D','frac78':'\u215E','frasl':'\u2044','frown':'\u2322','fscr':'\uD835\uDCBB','Fscr':'\u2131','gacute':'\u01F5','gamma':'\u03B3','Gamma':'\u0393','gammad':'\u03DD','Gammad':'\u03DC','gap':'\u2A86','gbreve':'\u011F','Gbreve':'\u011E','Gcedil':'\u0122','gcirc':'\u011D','Gcirc':'\u011C','gcy':'\u0433','Gcy':'\u0413','gdot':'\u0121','Gdot':'\u0120','ge':'\u2265','gE':'\u2267','gel':'\u22DB','gEl':'\u2A8C','geq':'\u2265','geqq':'\u2267','geqslant':'\u2A7E','ges':'\u2A7E','gescc':'\u2AA9','gesdot':'\u2A80','gesdoto':'\u2A82','gesdotol':'\u2A84','gesl':'\u22DB\uFE00','gesles':'\u2A94','gfr':'\uD835\uDD24','Gfr':'\uD835\uDD0A','gg':'\u226B','Gg':'\u22D9','ggg':'\u22D9','gimel':'\u2137','gjcy':'\u0453','GJcy':'\u0403','gl':'\u2277','gla':'\u2AA5','glE':'\u2A92','glj':'\u2AA4','gnap':'\u2A8A','gnapprox':'\u2A8A','gne':'\u2A88','gnE':'\u2269','gneq':'\u2A88','gneqq':'\u2269','gnsim':'\u22E7','gopf':'\uD835\uDD58','Gopf':'\uD835\uDD3E','grave':'`','GreaterEqual':'\u2265','GreaterEqualLess':'\u22DB','GreaterFullEqual':'\u2267','GreaterGreater':'\u2AA2','GreaterLess':'\u2277','GreaterSlantEqual':'\u2A7E','GreaterTilde':'\u2273','gscr':'\u210A','Gscr':'\uD835\uDCA2','gsim':'\u2273','gsime':'\u2A8E','gsiml':'\u2A90','gt':'>','Gt':'\u226B','GT':'>','gtcc':'\u2AA7','gtcir':'\u2A7A','gtdot':'\u22D7','gtlPar':'\u2995','gtquest':'\u2A7C','gtrapprox':'\u2A86','gtrarr':'\u2978','gtrdot':'\u22D7','gtreqless':'\u22DB','gtreqqless':'\u2A8C','gtrless':'\u2277','gtrsim':'\u2273','gvertneqq':'\u2269\uFE00','gvnE':'\u2269\uFE00','Hacek':'\u02C7','hairsp':'\u200A','half':'\xBD','hamilt':'\u210B','hardcy':'\u044A','HARDcy':'\u042A','harr':'\u2194','hArr':'\u21D4','harrcir':'\u2948','harrw':'\u21AD','Hat':'^','hbar':'\u210F','hcirc':'\u0125','Hcirc':'\u0124','hearts':'\u2665','heartsuit':'\u2665','hellip':'\u2026','hercon':'\u22B9','hfr':'\uD835\uDD25','Hfr':'\u210C','HilbertSpace':'\u210B','hksearow':'\u2925','hkswarow':'\u2926','hoarr':'\u21FF','homtht':'\u223B','hookleftarrow':'\u21A9','hookrightarrow':'\u21AA','hopf':'\uD835\uDD59','Hopf':'\u210D','horbar':'\u2015','HorizontalLine':'\u2500','hscr':'\uD835\uDCBD','Hscr':'\u210B','hslash':'\u210F','hstrok':'\u0127','Hstrok':'\u0126','HumpDownHump':'\u224E','HumpEqual':'\u224F','hybull':'\u2043','hyphen':'\u2010','iacute':'\xED','Iacute':'\xCD','ic':'\u2063','icirc':'\xEE','Icirc':'\xCE','icy':'\u0438','Icy':'\u0418','Idot':'\u0130','iecy':'\u0435','IEcy':'\u0415','iexcl':'\xA1','iff':'\u21D4','ifr':'\uD835\uDD26','Ifr':'\u2111','igrave':'\xEC','Igrave':'\xCC','ii':'\u2148','iiiint':'\u2A0C','iiint':'\u222D','iinfin':'\u29DC','iiota':'\u2129','ijlig':'\u0133','IJlig':'\u0132','Im':'\u2111','imacr':'\u012B','Imacr':'\u012A','image':'\u2111','ImaginaryI':'\u2148','imagline':'\u2110','imagpart':'\u2111','imath':'\u0131','imof':'\u22B7','imped':'\u01B5','Implies':'\u21D2','in':'\u2208','incare':'\u2105','infin':'\u221E','infintie':'\u29DD','inodot':'\u0131','int':'\u222B','Int':'\u222C','intcal':'\u22BA','integers':'\u2124','Integral':'\u222B','intercal':'\u22BA','Intersection':'\u22C2','intlarhk':'\u2A17','intprod':'\u2A3C','InvisibleComma':'\u2063','InvisibleTimes':'\u2062','iocy':'\u0451','IOcy':'\u0401','iogon':'\u012F','Iogon':'\u012E','iopf':'\uD835\uDD5A','Iopf':'\uD835\uDD40','iota':'\u03B9','Iota':'\u0399','iprod':'\u2A3C','iquest':'\xBF','iscr':'\uD835\uDCBE','Iscr':'\u2110','isin':'\u2208','isindot':'\u22F5','isinE':'\u22F9','isins':'\u22F4','isinsv':'\u22F3','isinv':'\u2208','it':'\u2062','itilde':'\u0129','Itilde':'\u0128','iukcy':'\u0456','Iukcy':'\u0406','iuml':'\xEF','Iuml':'\xCF','jcirc':'\u0135','Jcirc':'\u0134','jcy':'\u0439','Jcy':'\u0419','jfr':'\uD835\uDD27','Jfr':'\uD835\uDD0D','jmath':'\u0237','jopf':'\uD835\uDD5B','Jopf':'\uD835\uDD41','jscr':'\uD835\uDCBF','Jscr':'\uD835\uDCA5','jsercy':'\u0458','Jsercy':'\u0408','jukcy':'\u0454','Jukcy':'\u0404','kappa':'\u03BA','Kappa':'\u039A','kappav':'\u03F0','kcedil':'\u0137','Kcedil':'\u0136','kcy':'\u043A','Kcy':'\u041A','kfr':'\uD835\uDD28','Kfr':'\uD835\uDD0E','kgreen':'\u0138','khcy':'\u0445','KHcy':'\u0425','kjcy':'\u045C','KJcy':'\u040C','kopf':'\uD835\uDD5C','Kopf':'\uD835\uDD42','kscr':'\uD835\uDCC0','Kscr':'\uD835\uDCA6','lAarr':'\u21DA','lacute':'\u013A','Lacute':'\u0139','laemptyv':'\u29B4','lagran':'\u2112','lambda':'\u03BB','Lambda':'\u039B','lang':'\u27E8','Lang':'\u27EA','langd':'\u2991','langle':'\u27E8','lap':'\u2A85','Laplacetrf':'\u2112','laquo':'\xAB','larr':'\u2190','lArr':'\u21D0','Larr':'\u219E','larrb':'\u21E4','larrbfs':'\u291F','larrfs':'\u291D','larrhk':'\u21A9','larrlp':'\u21AB','larrpl':'\u2939','larrsim':'\u2973','larrtl':'\u21A2','lat':'\u2AAB','latail':'\u2919','lAtail':'\u291B','late':'\u2AAD','lates':'\u2AAD\uFE00','lbarr':'\u290C','lBarr':'\u290E','lbbrk':'\u2772','lbrace':'{','lbrack':'[','lbrke':'\u298B','lbrksld':'\u298F','lbrkslu':'\u298D','lcaron':'\u013E','Lcaron':'\u013D','lcedil':'\u013C','Lcedil':'\u013B','lceil':'\u2308','lcub':'{','lcy':'\u043B','Lcy':'\u041B','ldca':'\u2936','ldquo':'\u201C','ldquor':'\u201E','ldrdhar':'\u2967','ldrushar':'\u294B','ldsh':'\u21B2','le':'\u2264','lE':'\u2266','LeftAngleBracket':'\u27E8','leftarrow':'\u2190','Leftarrow':'\u21D0','LeftArrow':'\u2190','LeftArrowBar':'\u21E4','LeftArrowRightArrow':'\u21C6','leftarrowtail':'\u21A2','LeftCeiling':'\u2308','LeftDoubleBracket':'\u27E6','LeftDownTeeVector':'\u2961','LeftDownVector':'\u21C3','LeftDownVectorBar':'\u2959','LeftFloor':'\u230A','leftharpoondown':'\u21BD','leftharpoonup':'\u21BC','leftleftarrows':'\u21C7','leftrightarrow':'\u2194','Leftrightarrow':'\u21D4','LeftRightArrow':'\u2194','leftrightarrows':'\u21C6','leftrightharpoons':'\u21CB','leftrightsquigarrow':'\u21AD','LeftRightVector':'\u294E','LeftTee':'\u22A3','LeftTeeArrow':'\u21A4','LeftTeeVector':'\u295A','leftthreetimes':'\u22CB','LeftTriangle':'\u22B2','LeftTriangleBar':'\u29CF','LeftTriangleEqual':'\u22B4','LeftUpDownVector':'\u2951','LeftUpTeeVector':'\u2960','LeftUpVector':'\u21BF','LeftUpVectorBar':'\u2958','LeftVector':'\u21BC','LeftVectorBar':'\u2952','leg':'\u22DA','lEg':'\u2A8B','leq':'\u2264','leqq':'\u2266','leqslant':'\u2A7D','les':'\u2A7D','lescc':'\u2AA8','lesdot':'\u2A7F','lesdoto':'\u2A81','lesdotor':'\u2A83','lesg':'\u22DA\uFE00','lesges':'\u2A93','lessapprox':'\u2A85','lessdot':'\u22D6','lesseqgtr':'\u22DA','lesseqqgtr':'\u2A8B','LessEqualGreater':'\u22DA','LessFullEqual':'\u2266','LessGreater':'\u2276','lessgtr':'\u2276','LessLess':'\u2AA1','lesssim':'\u2272','LessSlantEqual':'\u2A7D','LessTilde':'\u2272','lfisht':'\u297C','lfloor':'\u230A','lfr':'\uD835\uDD29','Lfr':'\uD835\uDD0F','lg':'\u2276','lgE':'\u2A91','lHar':'\u2962','lhard':'\u21BD','lharu':'\u21BC','lharul':'\u296A','lhblk':'\u2584','ljcy':'\u0459','LJcy':'\u0409','ll':'\u226A','Ll':'\u22D8','llarr':'\u21C7','llcorner':'\u231E','Lleftarrow':'\u21DA','llhard':'\u296B','lltri':'\u25FA','lmidot':'\u0140','Lmidot':'\u013F','lmoust':'\u23B0','lmoustache':'\u23B0','lnap':'\u2A89','lnapprox':'\u2A89','lne':'\u2A87','lnE':'\u2268','lneq':'\u2A87','lneqq':'\u2268','lnsim':'\u22E6','loang':'\u27EC','loarr':'\u21FD','lobrk':'\u27E6','longleftarrow':'\u27F5','Longleftarrow':'\u27F8','LongLeftArrow':'\u27F5','longleftrightarrow':'\u27F7','Longleftrightarrow':'\u27FA','LongLeftRightArrow':'\u27F7','longmapsto':'\u27FC','longrightarrow':'\u27F6','Longrightarrow':'\u27F9','LongRightArrow':'\u27F6','looparrowleft':'\u21AB','looparrowright':'\u21AC','lopar':'\u2985','lopf':'\uD835\uDD5D','Lopf':'\uD835\uDD43','loplus':'\u2A2D','lotimes':'\u2A34','lowast':'\u2217','lowbar':'_','LowerLeftArrow':'\u2199','LowerRightArrow':'\u2198','loz':'\u25CA','lozenge':'\u25CA','lozf':'\u29EB','lpar':'(','lparlt':'\u2993','lrarr':'\u21C6','lrcorner':'\u231F','lrhar':'\u21CB','lrhard':'\u296D','lrm':'\u200E','lrtri':'\u22BF','lsaquo':'\u2039','lscr':'\uD835\uDCC1','Lscr':'\u2112','lsh':'\u21B0','Lsh':'\u21B0','lsim':'\u2272','lsime':'\u2A8D','lsimg':'\u2A8F','lsqb':'[','lsquo':'\u2018','lsquor':'\u201A','lstrok':'\u0142','Lstrok':'\u0141','lt':'<','Lt':'\u226A','LT':'<','ltcc':'\u2AA6','ltcir':'\u2A79','ltdot':'\u22D6','lthree':'\u22CB','ltimes':'\u22C9','ltlarr':'\u2976','ltquest':'\u2A7B','ltri':'\u25C3','ltrie':'\u22B4','ltrif':'\u25C2','ltrPar':'\u2996','lurdshar':'\u294A','luruhar':'\u2966','lvertneqq':'\u2268\uFE00','lvnE':'\u2268\uFE00','macr':'\xAF','male':'\u2642','malt':'\u2720','maltese':'\u2720','map':'\u21A6','Map':'\u2905','mapsto':'\u21A6','mapstodown':'\u21A7','mapstoleft':'\u21A4','mapstoup':'\u21A5','marker':'\u25AE','mcomma':'\u2A29','mcy':'\u043C','Mcy':'\u041C','mdash':'\u2014','mDDot':'\u223A','measuredangle':'\u2221','MediumSpace':'\u205F','Mellintrf':'\u2133','mfr':'\uD835\uDD2A','Mfr':'\uD835\uDD10','mho':'\u2127','micro':'\xB5','mid':'\u2223','midast':'*','midcir':'\u2AF0','middot':'\xB7','minus':'\u2212','minusb':'\u229F','minusd':'\u2238','minusdu':'\u2A2A','MinusPlus':'\u2213','mlcp':'\u2ADB','mldr':'\u2026','mnplus':'\u2213','models':'\u22A7','mopf':'\uD835\uDD5E','Mopf':'\uD835\uDD44','mp':'\u2213','mscr':'\uD835\uDCC2','Mscr':'\u2133','mstpos':'\u223E','mu':'\u03BC','Mu':'\u039C','multimap':'\u22B8','mumap':'\u22B8','nabla':'\u2207','nacute':'\u0144','Nacute':'\u0143','nang':'\u2220\u20D2','nap':'\u2249','napE':'\u2A70\u0338','napid':'\u224B\u0338','napos':'\u0149','napprox':'\u2249','natur':'\u266E','natural':'\u266E','naturals':'\u2115','nbsp':'\xA0','nbump':'\u224E\u0338','nbumpe':'\u224F\u0338','ncap':'\u2A43','ncaron':'\u0148','Ncaron':'\u0147','ncedil':'\u0146','Ncedil':'\u0145','ncong':'\u2247','ncongdot':'\u2A6D\u0338','ncup':'\u2A42','ncy':'\u043D','Ncy':'\u041D','ndash':'\u2013','ne':'\u2260','nearhk':'\u2924','nearr':'\u2197','neArr':'\u21D7','nearrow':'\u2197','nedot':'\u2250\u0338','NegativeMediumSpace':'\u200B','NegativeThickSpace':'\u200B','NegativeThinSpace':'\u200B','NegativeVeryThinSpace':'\u200B','nequiv':'\u2262','nesear':'\u2928','nesim':'\u2242\u0338','NestedGreaterGreater':'\u226B','NestedLessLess':'\u226A','NewLine':'\n','nexist':'\u2204','nexists':'\u2204','nfr':'\uD835\uDD2B','Nfr':'\uD835\uDD11','nge':'\u2271','ngE':'\u2267\u0338','ngeq':'\u2271','ngeqq':'\u2267\u0338','ngeqslant':'\u2A7E\u0338','nges':'\u2A7E\u0338','nGg':'\u22D9\u0338','ngsim':'\u2275','ngt':'\u226F','nGt':'\u226B\u20D2','ngtr':'\u226F','nGtv':'\u226B\u0338','nharr':'\u21AE','nhArr':'\u21CE','nhpar':'\u2AF2','ni':'\u220B','nis':'\u22FC','nisd':'\u22FA','niv':'\u220B','njcy':'\u045A','NJcy':'\u040A','nlarr':'\u219A','nlArr':'\u21CD','nldr':'\u2025','nle':'\u2270','nlE':'\u2266\u0338','nleftarrow':'\u219A','nLeftarrow':'\u21CD','nleftrightarrow':'\u21AE','nLeftrightarrow':'\u21CE','nleq':'\u2270','nleqq':'\u2266\u0338','nleqslant':'\u2A7D\u0338','nles':'\u2A7D\u0338','nless':'\u226E','nLl':'\u22D8\u0338','nlsim':'\u2274','nlt':'\u226E','nLt':'\u226A\u20D2','nltri':'\u22EA','nltrie':'\u22EC','nLtv':'\u226A\u0338','nmid':'\u2224','NoBreak':'\u2060','NonBreakingSpace':'\xA0','nopf':'\uD835\uDD5F','Nopf':'\u2115','not':'\xAC','Not':'\u2AEC','NotCongruent':'\u2262','NotCupCap':'\u226D','NotDoubleVerticalBar':'\u2226','NotElement':'\u2209','NotEqual':'\u2260','NotEqualTilde':'\u2242\u0338','NotExists':'\u2204','NotGreater':'\u226F','NotGreaterEqual':'\u2271','NotGreaterFullEqual':'\u2267\u0338','NotGreaterGreater':'\u226B\u0338','NotGreaterLess':'\u2279','NotGreaterSlantEqual':'\u2A7E\u0338','NotGreaterTilde':'\u2275','NotHumpDownHump':'\u224E\u0338','NotHumpEqual':'\u224F\u0338','notin':'\u2209','notindot':'\u22F5\u0338','notinE':'\u22F9\u0338','notinva':'\u2209','notinvb':'\u22F7','notinvc':'\u22F6','NotLeftTriangle':'\u22EA','NotLeftTriangleBar':'\u29CF\u0338','NotLeftTriangleEqual':'\u22EC','NotLess':'\u226E','NotLessEqual':'\u2270','NotLessGreater':'\u2278','NotLessLess':'\u226A\u0338','NotLessSlantEqual':'\u2A7D\u0338','NotLessTilde':'\u2274','NotNestedGreaterGreater':'\u2AA2\u0338','NotNestedLessLess':'\u2AA1\u0338','notni':'\u220C','notniva':'\u220C','notnivb':'\u22FE','notnivc':'\u22FD','NotPrecedes':'\u2280','NotPrecedesEqual':'\u2AAF\u0338','NotPrecedesSlantEqual':'\u22E0','NotReverseElement':'\u220C','NotRightTriangle':'\u22EB','NotRightTriangleBar':'\u29D0\u0338','NotRightTriangleEqual':'\u22ED','NotSquareSubset':'\u228F\u0338','NotSquareSubsetEqual':'\u22E2','NotSquareSuperset':'\u2290\u0338','NotSquareSupersetEqual':'\u22E3','NotSubset':'\u2282\u20D2','NotSubsetEqual':'\u2288','NotSucceeds':'\u2281','NotSucceedsEqual':'\u2AB0\u0338','NotSucceedsSlantEqual':'\u22E1','NotSucceedsTilde':'\u227F\u0338','NotSuperset':'\u2283\u20D2','NotSupersetEqual':'\u2289','NotTilde':'\u2241','NotTildeEqual':'\u2244','NotTildeFullEqual':'\u2247','NotTildeTilde':'\u2249','NotVerticalBar':'\u2224','npar':'\u2226','nparallel':'\u2226','nparsl':'\u2AFD\u20E5','npart':'\u2202\u0338','npolint':'\u2A14','npr':'\u2280','nprcue':'\u22E0','npre':'\u2AAF\u0338','nprec':'\u2280','npreceq':'\u2AAF\u0338','nrarr':'\u219B','nrArr':'\u21CF','nrarrc':'\u2933\u0338','nrarrw':'\u219D\u0338','nrightarrow':'\u219B','nRightarrow':'\u21CF','nrtri':'\u22EB','nrtrie':'\u22ED','nsc':'\u2281','nsccue':'\u22E1','nsce':'\u2AB0\u0338','nscr':'\uD835\uDCC3','Nscr':'\uD835\uDCA9','nshortmid':'\u2224','nshortparallel':'\u2226','nsim':'\u2241','nsime':'\u2244','nsimeq':'\u2244','nsmid':'\u2224','nspar':'\u2226','nsqsube':'\u22E2','nsqsupe':'\u22E3','nsub':'\u2284','nsube':'\u2288','nsubE':'\u2AC5\u0338','nsubset':'\u2282\u20D2','nsubseteq':'\u2288','nsubseteqq':'\u2AC5\u0338','nsucc':'\u2281','nsucceq':'\u2AB0\u0338','nsup':'\u2285','nsupe':'\u2289','nsupE':'\u2AC6\u0338','nsupset':'\u2283\u20D2','nsupseteq':'\u2289','nsupseteqq':'\u2AC6\u0338','ntgl':'\u2279','ntilde':'\xF1','Ntilde':'\xD1','ntlg':'\u2278','ntriangleleft':'\u22EA','ntrianglelefteq':'\u22EC','ntriangleright':'\u22EB','ntrianglerighteq':'\u22ED','nu':'\u03BD','Nu':'\u039D','num':'#','numero':'\u2116','numsp':'\u2007','nvap':'\u224D\u20D2','nvdash':'\u22AC','nvDash':'\u22AD','nVdash':'\u22AE','nVDash':'\u22AF','nvge':'\u2265\u20D2','nvgt':'>\u20D2','nvHarr':'\u2904','nvinfin':'\u29DE','nvlArr':'\u2902','nvle':'\u2264\u20D2','nvlt':'<\u20D2','nvltrie':'\u22B4\u20D2','nvrArr':'\u2903','nvrtrie':'\u22B5\u20D2','nvsim':'\u223C\u20D2','nwarhk':'\u2923','nwarr':'\u2196','nwArr':'\u21D6','nwarrow':'\u2196','nwnear':'\u2927','oacute':'\xF3','Oacute':'\xD3','oast':'\u229B','ocir':'\u229A','ocirc':'\xF4','Ocirc':'\xD4','ocy':'\u043E','Ocy':'\u041E','odash':'\u229D','odblac':'\u0151','Odblac':'\u0150','odiv':'\u2A38','odot':'\u2299','odsold':'\u29BC','oelig':'\u0153','OElig':'\u0152','ofcir':'\u29BF','ofr':'\uD835\uDD2C','Ofr':'\uD835\uDD12','ogon':'\u02DB','ograve':'\xF2','Ograve':'\xD2','ogt':'\u29C1','ohbar':'\u29B5','ohm':'\u03A9','oint':'\u222E','olarr':'\u21BA','olcir':'\u29BE','olcross':'\u29BB','oline':'\u203E','olt':'\u29C0','omacr':'\u014D','Omacr':'\u014C','omega':'\u03C9','Omega':'\u03A9','omicron':'\u03BF','Omicron':'\u039F','omid':'\u29B6','ominus':'\u2296','oopf':'\uD835\uDD60','Oopf':'\uD835\uDD46','opar':'\u29B7','OpenCurlyDoubleQuote':'\u201C','OpenCurlyQuote':'\u2018','operp':'\u29B9','oplus':'\u2295','or':'\u2228','Or':'\u2A54','orarr':'\u21BB','ord':'\u2A5D','order':'\u2134','orderof':'\u2134','ordf':'\xAA','ordm':'\xBA','origof':'\u22B6','oror':'\u2A56','orslope':'\u2A57','orv':'\u2A5B','oS':'\u24C8','oscr':'\u2134','Oscr':'\uD835\uDCAA','oslash':'\xF8','Oslash':'\xD8','osol':'\u2298','otilde':'\xF5','Otilde':'\xD5','otimes':'\u2297','Otimes':'\u2A37','otimesas':'\u2A36','ouml':'\xF6','Ouml':'\xD6','ovbar':'\u233D','OverBar':'\u203E','OverBrace':'\u23DE','OverBracket':'\u23B4','OverParenthesis':'\u23DC','par':'\u2225','para':'\xB6','parallel':'\u2225','parsim':'\u2AF3','parsl':'\u2AFD','part':'\u2202','PartialD':'\u2202','pcy':'\u043F','Pcy':'\u041F','percnt':'%','period':'.','permil':'\u2030','perp':'\u22A5','pertenk':'\u2031','pfr':'\uD835\uDD2D','Pfr':'\uD835\uDD13','phi':'\u03C6','Phi':'\u03A6','phiv':'\u03D5','phmmat':'\u2133','phone':'\u260E','pi':'\u03C0','Pi':'\u03A0','pitchfork':'\u22D4','piv':'\u03D6','planck':'\u210F','planckh':'\u210E','plankv':'\u210F','plus':'+','plusacir':'\u2A23','plusb':'\u229E','pluscir':'\u2A22','plusdo':'\u2214','plusdu':'\u2A25','pluse':'\u2A72','PlusMinus':'\xB1','plusmn':'\xB1','plussim':'\u2A26','plustwo':'\u2A27','pm':'\xB1','Poincareplane':'\u210C','pointint':'\u2A15','popf':'\uD835\uDD61','Popf':'\u2119','pound':'\xA3','pr':'\u227A','Pr':'\u2ABB','prap':'\u2AB7','prcue':'\u227C','pre':'\u2AAF','prE':'\u2AB3','prec':'\u227A','precapprox':'\u2AB7','preccurlyeq':'\u227C','Precedes':'\u227A','PrecedesEqual':'\u2AAF','PrecedesSlantEqual':'\u227C','PrecedesTilde':'\u227E','preceq':'\u2AAF','precnapprox':'\u2AB9','precneqq':'\u2AB5','precnsim':'\u22E8','precsim':'\u227E','prime':'\u2032','Prime':'\u2033','primes':'\u2119','prnap':'\u2AB9','prnE':'\u2AB5','prnsim':'\u22E8','prod':'\u220F','Product':'\u220F','profalar':'\u232E','profline':'\u2312','profsurf':'\u2313','prop':'\u221D','Proportion':'\u2237','Proportional':'\u221D','propto':'\u221D','prsim':'\u227E','prurel':'\u22B0','pscr':'\uD835\uDCC5','Pscr':'\uD835\uDCAB','psi':'\u03C8','Psi':'\u03A8','puncsp':'\u2008','qfr':'\uD835\uDD2E','Qfr':'\uD835\uDD14','qint':'\u2A0C','qopf':'\uD835\uDD62','Qopf':'\u211A','qprime':'\u2057','qscr':'\uD835\uDCC6','Qscr':'\uD835\uDCAC','quaternions':'\u210D','quatint':'\u2A16','quest':'?','questeq':'\u225F','quot':'"','QUOT':'"','rAarr':'\u21DB','race':'\u223D\u0331','racute':'\u0155','Racute':'\u0154','radic':'\u221A','raemptyv':'\u29B3','rang':'\u27E9','Rang':'\u27EB','rangd':'\u2992','range':'\u29A5','rangle':'\u27E9','raquo':'\xBB','rarr':'\u2192','rArr':'\u21D2','Rarr':'\u21A0','rarrap':'\u2975','rarrb':'\u21E5','rarrbfs':'\u2920','rarrc':'\u2933','rarrfs':'\u291E','rarrhk':'\u21AA','rarrlp':'\u21AC','rarrpl':'\u2945','rarrsim':'\u2974','rarrtl':'\u21A3','Rarrtl':'\u2916','rarrw':'\u219D','ratail':'\u291A','rAtail':'\u291C','ratio':'\u2236','rationals':'\u211A','rbarr':'\u290D','rBarr':'\u290F','RBarr':'\u2910','rbbrk':'\u2773','rbrace':'}','rbrack':']','rbrke':'\u298C','rbrksld':'\u298E','rbrkslu':'\u2990','rcaron':'\u0159','Rcaron':'\u0158','rcedil':'\u0157','Rcedil':'\u0156','rceil':'\u2309','rcub':'}','rcy':'\u0440','Rcy':'\u0420','rdca':'\u2937','rdldhar':'\u2969','rdquo':'\u201D','rdquor':'\u201D','rdsh':'\u21B3','Re':'\u211C','real':'\u211C','realine':'\u211B','realpart':'\u211C','reals':'\u211D','rect':'\u25AD','reg':'\xAE','REG':'\xAE','ReverseElement':'\u220B','ReverseEquilibrium':'\u21CB','ReverseUpEquilibrium':'\u296F','rfisht':'\u297D','rfloor':'\u230B','rfr':'\uD835\uDD2F','Rfr':'\u211C','rHar':'\u2964','rhard':'\u21C1','rharu':'\u21C0','rharul':'\u296C','rho':'\u03C1','Rho':'\u03A1','rhov':'\u03F1','RightAngleBracket':'\u27E9','rightarrow':'\u2192','Rightarrow':'\u21D2','RightArrow':'\u2192','RightArrowBar':'\u21E5','RightArrowLeftArrow':'\u21C4','rightarrowtail':'\u21A3','RightCeiling':'\u2309','RightDoubleBracket':'\u27E7','RightDownTeeVector':'\u295D','RightDownVector':'\u21C2','RightDownVectorBar':'\u2955','RightFloor':'\u230B','rightharpoondown':'\u21C1','rightharpoonup':'\u21C0','rightleftarrows':'\u21C4','rightleftharpoons':'\u21CC','rightrightarrows':'\u21C9','rightsquigarrow':'\u219D','RightTee':'\u22A2','RightTeeArrow':'\u21A6','RightTeeVector':'\u295B','rightthreetimes':'\u22CC','RightTriangle':'\u22B3','RightTriangleBar':'\u29D0','RightTriangleEqual':'\u22B5','RightUpDownVector':'\u294F','RightUpTeeVector':'\u295C','RightUpVector':'\u21BE','RightUpVectorBar':'\u2954','RightVector':'\u21C0','RightVectorBar':'\u2953','ring':'\u02DA','risingdotseq':'\u2253','rlarr':'\u21C4','rlhar':'\u21CC','rlm':'\u200F','rmoust':'\u23B1','rmoustache':'\u23B1','rnmid':'\u2AEE','roang':'\u27ED','roarr':'\u21FE','robrk':'\u27E7','ropar':'\u2986','ropf':'\uD835\uDD63','Ropf':'\u211D','roplus':'\u2A2E','rotimes':'\u2A35','RoundImplies':'\u2970','rpar':')','rpargt':'\u2994','rppolint':'\u2A12','rrarr':'\u21C9','Rrightarrow':'\u21DB','rsaquo':'\u203A','rscr':'\uD835\uDCC7','Rscr':'\u211B','rsh':'\u21B1','Rsh':'\u21B1','rsqb':']','rsquo':'\u2019','rsquor':'\u2019','rthree':'\u22CC','rtimes':'\u22CA','rtri':'\u25B9','rtrie':'\u22B5','rtrif':'\u25B8','rtriltri':'\u29CE','RuleDelayed':'\u29F4','ruluhar':'\u2968','rx':'\u211E','sacute':'\u015B','Sacute':'\u015A','sbquo':'\u201A','sc':'\u227B','Sc':'\u2ABC','scap':'\u2AB8','scaron':'\u0161','Scaron':'\u0160','sccue':'\u227D','sce':'\u2AB0','scE':'\u2AB4','scedil':'\u015F','Scedil':'\u015E','scirc':'\u015D','Scirc':'\u015C','scnap':'\u2ABA','scnE':'\u2AB6','scnsim':'\u22E9','scpolint':'\u2A13','scsim':'\u227F','scy':'\u0441','Scy':'\u0421','sdot':'\u22C5','sdotb':'\u22A1','sdote':'\u2A66','searhk':'\u2925','searr':'\u2198','seArr':'\u21D8','searrow':'\u2198','sect':'\xA7','semi':';','seswar':'\u2929','setminus':'\u2216','setmn':'\u2216','sext':'\u2736','sfr':'\uD835\uDD30','Sfr':'\uD835\uDD16','sfrown':'\u2322','sharp':'\u266F','shchcy':'\u0449','SHCHcy':'\u0429','shcy':'\u0448','SHcy':'\u0428','ShortDownArrow':'\u2193','ShortLeftArrow':'\u2190','shortmid':'\u2223','shortparallel':'\u2225','ShortRightArrow':'\u2192','ShortUpArrow':'\u2191','shy':'\xAD','sigma':'\u03C3','Sigma':'\u03A3','sigmaf':'\u03C2','sigmav':'\u03C2','sim':'\u223C','simdot':'\u2A6A','sime':'\u2243','simeq':'\u2243','simg':'\u2A9E','simgE':'\u2AA0','siml':'\u2A9D','simlE':'\u2A9F','simne':'\u2246','simplus':'\u2A24','simrarr':'\u2972','slarr':'\u2190','SmallCircle':'\u2218','smallsetminus':'\u2216','smashp':'\u2A33','smeparsl':'\u29E4','smid':'\u2223','smile':'\u2323','smt':'\u2AAA','smte':'\u2AAC','smtes':'\u2AAC\uFE00','softcy':'\u044C','SOFTcy':'\u042C','sol':'/','solb':'\u29C4','solbar':'\u233F','sopf':'\uD835\uDD64','Sopf':'\uD835\uDD4A','spades':'\u2660','spadesuit':'\u2660','spar':'\u2225','sqcap':'\u2293','sqcaps':'\u2293\uFE00','sqcup':'\u2294','sqcups':'\u2294\uFE00','Sqrt':'\u221A','sqsub':'\u228F','sqsube':'\u2291','sqsubset':'\u228F','sqsubseteq':'\u2291','sqsup':'\u2290','sqsupe':'\u2292','sqsupset':'\u2290','sqsupseteq':'\u2292','squ':'\u25A1','square':'\u25A1','Square':'\u25A1','SquareIntersection':'\u2293','SquareSubset':'\u228F','SquareSubsetEqual':'\u2291','SquareSuperset':'\u2290','SquareSupersetEqual':'\u2292','SquareUnion':'\u2294','squarf':'\u25AA','squf':'\u25AA','srarr':'\u2192','sscr':'\uD835\uDCC8','Sscr':'\uD835\uDCAE','ssetmn':'\u2216','ssmile':'\u2323','sstarf':'\u22C6','star':'\u2606','Star':'\u22C6','starf':'\u2605','straightepsilon':'\u03F5','straightphi':'\u03D5','strns':'\xAF','sub':'\u2282','Sub':'\u22D0','subdot':'\u2ABD','sube':'\u2286','subE':'\u2AC5','subedot':'\u2AC3','submult':'\u2AC1','subne':'\u228A','subnE':'\u2ACB','subplus':'\u2ABF','subrarr':'\u2979','subset':'\u2282','Subset':'\u22D0','subseteq':'\u2286','subseteqq':'\u2AC5','SubsetEqual':'\u2286','subsetneq':'\u228A','subsetneqq':'\u2ACB','subsim':'\u2AC7','subsub':'\u2AD5','subsup':'\u2AD3','succ':'\u227B','succapprox':'\u2AB8','succcurlyeq':'\u227D','Succeeds':'\u227B','SucceedsEqual':'\u2AB0','SucceedsSlantEqual':'\u227D','SucceedsTilde':'\u227F','succeq':'\u2AB0','succnapprox':'\u2ABA','succneqq':'\u2AB6','succnsim':'\u22E9','succsim':'\u227F','SuchThat':'\u220B','sum':'\u2211','Sum':'\u2211','sung':'\u266A','sup':'\u2283','Sup':'\u22D1','sup1':'\xB9','sup2':'\xB2','sup3':'\xB3','supdot':'\u2ABE','supdsub':'\u2AD8','supe':'\u2287','supE':'\u2AC6','supedot':'\u2AC4','Superset':'\u2283','SupersetEqual':'\u2287','suphsol':'\u27C9','suphsub':'\u2AD7','suplarr':'\u297B','supmult':'\u2AC2','supne':'\u228B','supnE':'\u2ACC','supplus':'\u2AC0','supset':'\u2283','Supset':'\u22D1','supseteq':'\u2287','supseteqq':'\u2AC6','supsetneq':'\u228B','supsetneqq':'\u2ACC','supsim':'\u2AC8','supsub':'\u2AD4','supsup':'\u2AD6','swarhk':'\u2926','swarr':'\u2199','swArr':'\u21D9','swarrow':'\u2199','swnwar':'\u292A','szlig':'\xDF','Tab':'\t','target':'\u2316','tau':'\u03C4','Tau':'\u03A4','tbrk':'\u23B4','tcaron':'\u0165','Tcaron':'\u0164','tcedil':'\u0163','Tcedil':'\u0162','tcy':'\u0442','Tcy':'\u0422','tdot':'\u20DB','telrec':'\u2315','tfr':'\uD835\uDD31','Tfr':'\uD835\uDD17','there4':'\u2234','therefore':'\u2234','Therefore':'\u2234','theta':'\u03B8','Theta':'\u0398','thetasym':'\u03D1','thetav':'\u03D1','thickapprox':'\u2248','thicksim':'\u223C','ThickSpace':'\u205F\u200A','thinsp':'\u2009','ThinSpace':'\u2009','thkap':'\u2248','thksim':'\u223C','thorn':'\xFE','THORN':'\xDE','tilde':'\u02DC','Tilde':'\u223C','TildeEqual':'\u2243','TildeFullEqual':'\u2245','TildeTilde':'\u2248','times':'\xD7','timesb':'\u22A0','timesbar':'\u2A31','timesd':'\u2A30','tint':'\u222D','toea':'\u2928','top':'\u22A4','topbot':'\u2336','topcir':'\u2AF1','topf':'\uD835\uDD65','Topf':'\uD835\uDD4B','topfork':'\u2ADA','tosa':'\u2929','tprime':'\u2034','trade':'\u2122','TRADE':'\u2122','triangle':'\u25B5','triangledown':'\u25BF','triangleleft':'\u25C3','trianglelefteq':'\u22B4','triangleq':'\u225C','triangleright':'\u25B9','trianglerighteq':'\u22B5','tridot':'\u25EC','trie':'\u225C','triminus':'\u2A3A','TripleDot':'\u20DB','triplus':'\u2A39','trisb':'\u29CD','tritime':'\u2A3B','trpezium':'\u23E2','tscr':'\uD835\uDCC9','Tscr':'\uD835\uDCAF','tscy':'\u0446','TScy':'\u0426','tshcy':'\u045B','TSHcy':'\u040B','tstrok':'\u0167','Tstrok':'\u0166','twixt':'\u226C','twoheadleftarrow':'\u219E','twoheadrightarrow':'\u21A0','uacute':'\xFA','Uacute':'\xDA','uarr':'\u2191','uArr':'\u21D1','Uarr':'\u219F','Uarrocir':'\u2949','ubrcy':'\u045E','Ubrcy':'\u040E','ubreve':'\u016D','Ubreve':'\u016C','ucirc':'\xFB','Ucirc':'\xDB','ucy':'\u0443','Ucy':'\u0423','udarr':'\u21C5','udblac':'\u0171','Udblac':'\u0170','udhar':'\u296E','ufisht':'\u297E','ufr':'\uD835\uDD32','Ufr':'\uD835\uDD18','ugrave':'\xF9','Ugrave':'\xD9','uHar':'\u2963','uharl':'\u21BF','uharr':'\u21BE','uhblk':'\u2580','ulcorn':'\u231C','ulcorner':'\u231C','ulcrop':'\u230F','ultri':'\u25F8','umacr':'\u016B','Umacr':'\u016A','uml':'\xA8','UnderBar':'_','UnderBrace':'\u23DF','UnderBracket':'\u23B5','UnderParenthesis':'\u23DD','Union':'\u22C3','UnionPlus':'\u228E','uogon':'\u0173','Uogon':'\u0172','uopf':'\uD835\uDD66','Uopf':'\uD835\uDD4C','uparrow':'\u2191','Uparrow':'\u21D1','UpArrow':'\u2191','UpArrowBar':'\u2912','UpArrowDownArrow':'\u21C5','updownarrow':'\u2195','Updownarrow':'\u21D5','UpDownArrow':'\u2195','UpEquilibrium':'\u296E','upharpoonleft':'\u21BF','upharpoonright':'\u21BE','uplus':'\u228E','UpperLeftArrow':'\u2196','UpperRightArrow':'\u2197','upsi':'\u03C5','Upsi':'\u03D2','upsih':'\u03D2','upsilon':'\u03C5','Upsilon':'\u03A5','UpTee':'\u22A5','UpTeeArrow':'\u21A5','upuparrows':'\u21C8','urcorn':'\u231D','urcorner':'\u231D','urcrop':'\u230E','uring':'\u016F','Uring':'\u016E','urtri':'\u25F9','uscr':'\uD835\uDCCA','Uscr':'\uD835\uDCB0','utdot':'\u22F0','utilde':'\u0169','Utilde':'\u0168','utri':'\u25B5','utrif':'\u25B4','uuarr':'\u21C8','uuml':'\xFC','Uuml':'\xDC','uwangle':'\u29A7','vangrt':'\u299C','varepsilon':'\u03F5','varkappa':'\u03F0','varnothing':'\u2205','varphi':'\u03D5','varpi':'\u03D6','varpropto':'\u221D','varr':'\u2195','vArr':'\u21D5','varrho':'\u03F1','varsigma':'\u03C2','varsubsetneq':'\u228A\uFE00','varsubsetneqq':'\u2ACB\uFE00','varsupsetneq':'\u228B\uFE00','varsupsetneqq':'\u2ACC\uFE00','vartheta':'\u03D1','vartriangleleft':'\u22B2','vartriangleright':'\u22B3','vBar':'\u2AE8','Vbar':'\u2AEB','vBarv':'\u2AE9','vcy':'\u0432','Vcy':'\u0412','vdash':'\u22A2','vDash':'\u22A8','Vdash':'\u22A9','VDash':'\u22AB','Vdashl':'\u2AE6','vee':'\u2228','Vee':'\u22C1','veebar':'\u22BB','veeeq':'\u225A','vellip':'\u22EE','verbar':'|','Verbar':'\u2016','vert':'|','Vert':'\u2016','VerticalBar':'\u2223','VerticalLine':'|','VerticalSeparator':'\u2758','VerticalTilde':'\u2240','VeryThinSpace':'\u200A','vfr':'\uD835\uDD33','Vfr':'\uD835\uDD19','vltri':'\u22B2','vnsub':'\u2282\u20D2','vnsup':'\u2283\u20D2','vopf':'\uD835\uDD67','Vopf':'\uD835\uDD4D','vprop':'\u221D','vrtri':'\u22B3','vscr':'\uD835\uDCCB','Vscr':'\uD835\uDCB1','vsubne':'\u228A\uFE00','vsubnE':'\u2ACB\uFE00','vsupne':'\u228B\uFE00','vsupnE':'\u2ACC\uFE00','Vvdash':'\u22AA','vzigzag':'\u299A','wcirc':'\u0175','Wcirc':'\u0174','wedbar':'\u2A5F','wedge':'\u2227','Wedge':'\u22C0','wedgeq':'\u2259','weierp':'\u2118','wfr':'\uD835\uDD34','Wfr':'\uD835\uDD1A','wopf':'\uD835\uDD68','Wopf':'\uD835\uDD4E','wp':'\u2118','wr':'\u2240','wreath':'\u2240','wscr':'\uD835\uDCCC','Wscr':'\uD835\uDCB2','xcap':'\u22C2','xcirc':'\u25EF','xcup':'\u22C3','xdtri':'\u25BD','xfr':'\uD835\uDD35','Xfr':'\uD835\uDD1B','xharr':'\u27F7','xhArr':'\u27FA','xi':'\u03BE','Xi':'\u039E','xlarr':'\u27F5','xlArr':'\u27F8','xmap':'\u27FC','xnis':'\u22FB','xodot':'\u2A00','xopf':'\uD835\uDD69','Xopf':'\uD835\uDD4F','xoplus':'\u2A01','xotime':'\u2A02','xrarr':'\u27F6','xrArr':'\u27F9','xscr':'\uD835\uDCCD','Xscr':'\uD835\uDCB3','xsqcup':'\u2A06','xuplus':'\u2A04','xutri':'\u25B3','xvee':'\u22C1','xwedge':'\u22C0','yacute':'\xFD','Yacute':'\xDD','yacy':'\u044F','YAcy':'\u042F','ycirc':'\u0177','Ycirc':'\u0176','ycy':'\u044B','Ycy':'\u042B','yen':'\xA5','yfr':'\uD835\uDD36','Yfr':'\uD835\uDD1C','yicy':'\u0457','YIcy':'\u0407','yopf':'\uD835\uDD6A','Yopf':'\uD835\uDD50','yscr':'\uD835\uDCCE','Yscr':'\uD835\uDCB4','yucy':'\u044E','YUcy':'\u042E','yuml':'\xFF','Yuml':'\u0178','zacute':'\u017A','Zacute':'\u0179','zcaron':'\u017E','Zcaron':'\u017D','zcy':'\u0437','Zcy':'\u0417','zdot':'\u017C','Zdot':'\u017B','zeetrf':'\u2128','ZeroWidthSpace':'\u200B','zeta':'\u03B6','Zeta':'\u0396','zfr':'\uD835\uDD37','Zfr':'\u2128','zhcy':'\u0436','ZHcy':'\u0416','zigrarr':'\u21DD','zopf':'\uD835\uDD6B','Zopf':'\u2124','zscr':'\uD835\uDCCF','Zscr':'\uD835\uDCB5','zwj':'\u200D','zwnj':'\u200C'};
  	var decodeMapLegacy = {'aacute':'\xE1','Aacute':'\xC1','acirc':'\xE2','Acirc':'\xC2','acute':'\xB4','aelig':'\xE6','AElig':'\xC6','agrave':'\xE0','Agrave':'\xC0','amp':'&','AMP':'&','aring':'\xE5','Aring':'\xC5','atilde':'\xE3','Atilde':'\xC3','auml':'\xE4','Auml':'\xC4','brvbar':'\xA6','ccedil':'\xE7','Ccedil':'\xC7','cedil':'\xB8','cent':'\xA2','copy':'\xA9','COPY':'\xA9','curren':'\xA4','deg':'\xB0','divide':'\xF7','eacute':'\xE9','Eacute':'\xC9','ecirc':'\xEA','Ecirc':'\xCA','egrave':'\xE8','Egrave':'\xC8','eth':'\xF0','ETH':'\xD0','euml':'\xEB','Euml':'\xCB','frac12':'\xBD','frac14':'\xBC','frac34':'\xBE','gt':'>','GT':'>','iacute':'\xED','Iacute':'\xCD','icirc':'\xEE','Icirc':'\xCE','iexcl':'\xA1','igrave':'\xEC','Igrave':'\xCC','iquest':'\xBF','iuml':'\xEF','Iuml':'\xCF','laquo':'\xAB','lt':'<','LT':'<','macr':'\xAF','micro':'\xB5','middot':'\xB7','nbsp':'\xA0','not':'\xAC','ntilde':'\xF1','Ntilde':'\xD1','oacute':'\xF3','Oacute':'\xD3','ocirc':'\xF4','Ocirc':'\xD4','ograve':'\xF2','Ograve':'\xD2','ordf':'\xAA','ordm':'\xBA','oslash':'\xF8','Oslash':'\xD8','otilde':'\xF5','Otilde':'\xD5','ouml':'\xF6','Ouml':'\xD6','para':'\xB6','plusmn':'\xB1','pound':'\xA3','quot':'"','QUOT':'"','raquo':'\xBB','reg':'\xAE','REG':'\xAE','sect':'\xA7','shy':'\xAD','sup1':'\xB9','sup2':'\xB2','sup3':'\xB3','szlig':'\xDF','thorn':'\xFE','THORN':'\xDE','times':'\xD7','uacute':'\xFA','Uacute':'\xDA','ucirc':'\xFB','Ucirc':'\xDB','ugrave':'\xF9','Ugrave':'\xD9','uml':'\xA8','uuml':'\xFC','Uuml':'\xDC','yacute':'\xFD','Yacute':'\xDD','yen':'\xA5','yuml':'\xFF'};
  	var decodeMapNumeric = {'0':'\uFFFD','128':'\u20AC','130':'\u201A','131':'\u0192','132':'\u201E','133':'\u2026','134':'\u2020','135':'\u2021','136':'\u02C6','137':'\u2030','138':'\u0160','139':'\u2039','140':'\u0152','142':'\u017D','145':'\u2018','146':'\u2019','147':'\u201C','148':'\u201D','149':'\u2022','150':'\u2013','151':'\u2014','152':'\u02DC','153':'\u2122','154':'\u0161','155':'\u203A','156':'\u0153','158':'\u017E','159':'\u0178'};
  	var invalidReferenceCodePoints = [1,2,3,4,5,6,7,8,11,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,64976,64977,64978,64979,64980,64981,64982,64983,64984,64985,64986,64987,64988,64989,64990,64991,64992,64993,64994,64995,64996,64997,64998,64999,65000,65001,65002,65003,65004,65005,65006,65007,65534,65535,131070,131071,196606,196607,262142,262143,327678,327679,393214,393215,458750,458751,524286,524287,589822,589823,655358,655359,720894,720895,786430,786431,851966,851967,917502,917503,983038,983039,1048574,1048575,1114110,1114111];

  	/*--------------------------------------------------------------------------*/

  	var stringFromCharCode = String.fromCharCode;

  	var object = {};
  	var hasOwnProperty = object.hasOwnProperty;
  	var has = function(object, propertyName) {
  		return hasOwnProperty.call(object, propertyName);
  	};

  	var contains = function(array, value) {
  		var index = -1;
  		var length = array.length;
  		while (++index < length) {
  			if (array[index] == value) {
  				return true;
  			}
  		}
  		return false;
  	};

  	var merge = function(options, defaults) {
  		if (!options) {
  			return defaults;
  		}
  		var result = {};
  		var key;
  		for (key in defaults) {
  			// A `hasOwnProperty` check is not needed here, since only recognized
  			// option names are used anyway. Any others are ignored.
  			result[key] = has(options, key) ? options[key] : defaults[key];
  		}
  		return result;
  	};

  	// Modified version of `ucs2encode`; see https://mths.be/punycode.
  	var codePointToSymbol = function(codePoint, strict) {
  		var output = '';
  		if ((codePoint >= 0xD800 && codePoint <= 0xDFFF) || codePoint > 0x10FFFF) {
  			// See issue #4:
  			// “Otherwise, if the number is in the range 0xD800 to 0xDFFF or is
  			// greater than 0x10FFFF, then this is a parse error. Return a U+FFFD
  			// REPLACEMENT CHARACTER.”
  			if (strict) {
  				parseError('character reference outside the permissible Unicode range');
  			}
  			return '\uFFFD';
  		}
  		if (has(decodeMapNumeric, codePoint)) {
  			if (strict) {
  				parseError('disallowed character reference');
  			}
  			return decodeMapNumeric[codePoint];
  		}
  		if (strict && contains(invalidReferenceCodePoints, codePoint)) {
  			parseError('disallowed character reference');
  		}
  		if (codePoint > 0xFFFF) {
  			codePoint -= 0x10000;
  			output += stringFromCharCode(codePoint >>> 10 & 0x3FF | 0xD800);
  			codePoint = 0xDC00 | codePoint & 0x3FF;
  		}
  		output += stringFromCharCode(codePoint);
  		return output;
  	};

  	var hexEscape = function(codePoint) {
  		return '&#x' + codePoint.toString(16).toUpperCase() + ';';
  	};

  	var decEscape = function(codePoint) {
  		return '&#' + codePoint + ';';
  	};

  	var parseError = function(message) {
  		throw Error('Parse error: ' + message);
  	};

  	/*--------------------------------------------------------------------------*/

  	var encode = function(string, options) {
  		options = merge(options, encode.options);
  		var strict = options.strict;
  		if (strict && regexInvalidRawCodePoint.test(string)) {
  			parseError('forbidden code point');
  		}
  		var encodeEverything = options.encodeEverything;
  		var useNamedReferences = options.useNamedReferences;
  		var allowUnsafeSymbols = options.allowUnsafeSymbols;
  		var escapeCodePoint = options.decimal ? decEscape : hexEscape;

  		var escapeBmpSymbol = function(symbol) {
  			return escapeCodePoint(symbol.charCodeAt(0));
  		};

  		if (encodeEverything) {
  			// Encode ASCII symbols.
  			string = string.replace(regexAsciiWhitelist, function(symbol) {
  				// Use named references if requested & possible.
  				if (useNamedReferences && has(encodeMap, symbol)) {
  					return '&' + encodeMap[symbol] + ';';
  				}
  				return escapeBmpSymbol(symbol);
  			});
  			// Shorten a few escapes that represent two symbols, of which at least one
  			// is within the ASCII range.
  			if (useNamedReferences) {
  				string = string
  					.replace(/&gt;\u20D2/g, '&nvgt;')
  					.replace(/&lt;\u20D2/g, '&nvlt;')
  					.replace(/&#x66;&#x6A;/g, '&fjlig;');
  			}
  			// Encode non-ASCII symbols.
  			if (useNamedReferences) {
  				// Encode non-ASCII symbols that can be replaced with a named reference.
  				string = string.replace(regexEncodeNonAscii, function(string) {
  					// Note: there is no need to check `has(encodeMap, string)` here.
  					return '&' + encodeMap[string] + ';';
  				});
  			}
  			// Note: any remaining non-ASCII symbols are handled outside of the `if`.
  		} else if (useNamedReferences) {
  			// Apply named character references.
  			// Encode `<>"'&` using named character references.
  			if (!allowUnsafeSymbols) {
  				string = string.replace(regexEscape, function(string) {
  					return '&' + encodeMap[string] + ';'; // no need to check `has()` here
  				});
  			}
  			// Shorten escapes that represent two symbols, of which at least one is
  			// `<>"'&`.
  			string = string
  				.replace(/&gt;\u20D2/g, '&nvgt;')
  				.replace(/&lt;\u20D2/g, '&nvlt;');
  			// Encode non-ASCII symbols that can be replaced with a named reference.
  			string = string.replace(regexEncodeNonAscii, function(string) {
  				// Note: there is no need to check `has(encodeMap, string)` here.
  				return '&' + encodeMap[string] + ';';
  			});
  		} else if (!allowUnsafeSymbols) {
  			// Encode `<>"'&` using hexadecimal escapes, now that they’re not handled
  			// using named character references.
  			string = string.replace(regexEscape, escapeBmpSymbol);
  		}
  		return string
  			// Encode astral symbols.
  			.replace(regexAstralSymbols, function($0) {
  				// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
  				var high = $0.charCodeAt(0);
  				var low = $0.charCodeAt(1);
  				var codePoint = (high - 0xD800) * 0x400 + low - 0xDC00 + 0x10000;
  				return escapeCodePoint(codePoint);
  			})
  			// Encode any remaining BMP symbols that are not printable ASCII symbols
  			// using a hexadecimal escape.
  			.replace(regexBmpWhitelist, escapeBmpSymbol);
  	};
  	// Expose default options (so they can be overridden globally).
  	encode.options = {
  		'allowUnsafeSymbols': false,
  		'encodeEverything': false,
  		'strict': false,
  		'useNamedReferences': false,
  		'decimal' : false
  	};

  	var decode = function(html, options) {
  		options = merge(options, decode.options);
  		var strict = options.strict;
  		if (strict && regexInvalidEntity.test(html)) {
  			parseError('malformed character reference');
  		}
  		return html.replace(regexDecode, function($0, $1, $2, $3, $4, $5, $6, $7, $8) {
  			var codePoint;
  			var semicolon;
  			var decDigits;
  			var hexDigits;
  			var reference;
  			var next;

  			if ($1) {
  				reference = $1;
  				// Note: there is no need to check `has(decodeMap, reference)`.
  				return decodeMap[reference];
  			}

  			if ($2) {
  				// Decode named character references without trailing `;`, e.g. `&amp`.
  				// This is only a parse error if it gets converted to `&`, or if it is
  				// followed by `=` in an attribute context.
  				reference = $2;
  				next = $3;
  				if (next && options.isAttributeValue) {
  					if (strict && next == '=') {
  						parseError('`&` did not start a character reference');
  					}
  					return $0;
  				} else {
  					if (strict) {
  						parseError(
  							'named character reference was not terminated by a semicolon'
  						);
  					}
  					// Note: there is no need to check `has(decodeMapLegacy, reference)`.
  					return decodeMapLegacy[reference] + (next || '');
  				}
  			}

  			if ($4) {
  				// Decode decimal escapes, e.g. `&#119558;`.
  				decDigits = $4;
  				semicolon = $5;
  				if (strict && !semicolon) {
  					parseError('character reference was not terminated by a semicolon');
  				}
  				codePoint = parseInt(decDigits, 10);
  				return codePointToSymbol(codePoint, strict);
  			}

  			if ($6) {
  				// Decode hexadecimal escapes, e.g. `&#x1D306;`.
  				hexDigits = $6;
  				semicolon = $7;
  				if (strict && !semicolon) {
  					parseError('character reference was not terminated by a semicolon');
  				}
  				codePoint = parseInt(hexDigits, 16);
  				return codePointToSymbol(codePoint, strict);
  			}

  			// If we’re still here, `if ($7)` is implied; it’s an ambiguous
  			// ampersand for sure. https://mths.be/notes/ambiguous-ampersands
  			if (strict) {
  				parseError(
  					'named character reference was not terminated by a semicolon'
  				);
  			}
  			return $0;
  		});
  	};
  	// Expose default options (so they can be overridden globally).
  	decode.options = {
  		'isAttributeValue': false,
  		'strict': false
  	};

  	var escape = function(string) {
  		return string.replace(regexEscape, function($0) {
  			// Note: there is no need to check `has(escapeMap, $0)` here.
  			return escapeMap[$0];
  		});
  	};

  	/*--------------------------------------------------------------------------*/

  	var he = {
  		'version': '1.2.0',
  		'encode': encode,
  		'decode': decode,
  		'escape': escape,
  		'unescape': decode
  	};

  	// Some AMD build optimizers, like r.js, check for specific condition patterns
  	// like the following:
  	if (freeExports && !freeExports.nodeType) {
  		if (freeModule) { // in Node.js, io.js, or RingoJS v0.8.0+
  			freeModule.exports = he;
  		} else { // in Narwhal or RingoJS v0.7.0-
  			for (var key in he) {
  				has(he, key) && (freeExports[key] = he[key]);
  			}
  		}
  	} else { // in Rhino or a web browser
  		root.he = he;
  	}

  }(commonjsGlobal));
  });

  /**
   * Not type-checking this file because it's mostly vendor code.
   */

  // Regular Expressions for parsing tags and attributes
  /**
   * 模版内容类型：
   * 文本
   * HTML注释
   * 条件注释
   * DOC TYPE
   * 开始标签
   * 结束标签
   */
  // 对应的正则表达式
  var attribute =
    /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  var dynamicArgAttribute =
    /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+?\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z" + (unicodeRegExp.source) + "]*";
  var qnameCapture = "((?:" + ncname + "\\:)?" + ncname + ")";
  var startTagOpen = new RegExp(("^<" + qnameCapture));
  var startTagClose = /^\s*(\/?)>/;
  var endTag = new RegExp(("^<\\/" + qnameCapture + "[^>]*>"));
  var doctype = /^<!DOCTYPE [^>]+>/i;
  // #7298: escape - to avoid being passed as HTML comment when inlined in page
  // HTML注释正则表达式
  var comment = /^<!\--/;
  // HTML降级条件注释
  var conditionalComment = /^<!\[/;

  // Special Elements (can contain anything)
  var isPlainTextElement = makeMap("script,style,textarea", true);
  var reCache = {};

  var decodingMap = {
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&amp;": "&",
    "&#10;": "\n",
    "&#9;": "\t",
    "&#39;": "'",
  };
  var encodedAttr = /&(?:lt|gt|quot|amp|#39);/g;
  var encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g;

  // #5992
  var isIgnoreNewlineTag = makeMap("pre,textarea", true);
  var shouldIgnoreFirstNewline = function (tag, html) { return tag && isIgnoreNewlineTag(tag) && html[0] === "\n"; };

  function decodeAttr(value, shouldDecodeNewlines) {
    var re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr;
    return value.replace(re, function (match) { return decodingMap[match]; });
  }

  function parseHTML(html, options) {
    var stack = []; // 维护AST节点层级的栈
    var expectHTML = options.expectHTML;
    var isUnaryTag = options.isUnaryTag || no;
    var canBeLeftOpenTag = options.canBeLeftOpenTag || no; // 用来检测一个标签是否是可以省略闭合标签的非自闭合标签
    var index = 0; // 解析游标
    var last, // 存储剩余还未解析的模版字符串
      lastTag; // 存储位于stack栈顶的元素
    while (html) {
      last = html;
      // Make sure we're not in a plaintext content element like script/style
      // 确保即将parse的内容不是在纯文本标签里面（script、style、textarea）
      if (!lastTag || !isPlainTextElement(lastTag)) {
        var textEnd = html.indexOf("<");
        // textEnd代表文本的结束位置
        if (textEnd === 0) {
          // Comment: 普通注释
          if (comment.test(html)) {
            var commentEnd = html.indexOf("-->");

            if (commentEnd >= 0) {
              // 是否保留注释
              if (options.shouldKeepComment) {
                options.comment(
                  html.substring(4, commentEnd), // 注释内容
                  index, // 注释起点
                  index + commentEnd + 3 // 注释结束
                );
              }
              advance(commentEnd + 3);
              continue;
            }
          }

          // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
          // HTML条件注释，比如<!if[IE]><![endif]>
          if (conditionalComment.test(html)) {
            var conditionalEnd = html.indexOf("]>");

            if (conditionalEnd >= 0) {
              advance(conditionalEnd + 2);
              continue;
            }
          }

          // Doctype:
          var doctypeMatch = html.match(doctype);
          if (doctypeMatch) {
            advance(doctypeMatch[0].length);
            continue;
          }

          // End tag: 结束标签
          var endTagMatch = html.match(endTag);
          if (endTagMatch) {
            var curIndex = index;
            // 比如当前html为：'</p></div>'
            // endTagMatch[0]: '</p>'
            // endTagMatch[1]: 'p'
            advance(endTagMatch[0].length);
            parseEndTag(endTagMatch[1], curIndex, index);
            continue;
          }

          // Start tag: 开始标签
          var startTagMatch = parseStartTag();
          if (startTagMatch) {
            handleStartTag(startTagMatch);
            if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
              advance(1);
            }
            continue;
          }
        }
        // 文本标签
        var text = (void 0), rest = (void 0), next = (void 0);
        if (textEnd >= 0) {
          rest = html.slice(textEnd);
          while (
            !endTag.test(rest) &&
            !startTagOpen.test(rest) &&
            !comment.test(rest) &&
            !conditionalComment.test(rest)
          ) {
            // < in plain text, be forgiving and treat it as text
            next = rest.indexOf("<", 1);
            if (next < 0) { break; }
            textEnd += next;
            rest = html.slice(textEnd);
          }
          text = html.substring(0, textEnd);
        }

        if (textEnd < 0) {
          text = html;
        }

        if (text) {
          advance(text.length);
        }

        if (options.chars && text) {
          options.chars(text, index - text.length, index);
        }
      }
      // 纯文本
      else {
        var endTagLength = 0;
        var stackedTag = lastTag.toLowerCase();
        var reStackedTag =
          reCache[stackedTag] ||
          (reCache[stackedTag] = new RegExp(
            "([\\s\\S]*?)(</" + stackedTag + "[^>]*>)",
            "i"
          ));
        var rest$1 = html.replace(reStackedTag, function (all, text, endTag) {
          endTagLength = endTag.length;
          if (!isPlainTextElement(stackedTag) && stackedTag !== "noscript") {
            text = text
              .replace(/<!\--([\s\S]*?)-->/g, "$1") // #7298
              .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, "$1");
          }
          if (shouldIgnoreFirstNewline(stackedTag, text)) {
            text = text.slice(1);
          }
          // 解析纯文本
          if (options.chars) {
            options.chars(text);
          }
          return "";
        });
        index += html.length - rest$1.length;
        html = rest$1;
        parseEndTag(stackedTag, index - endTagLength, index);
      }
      // 将整个字符串作为文本对待
      if (html === last) {
        options.chars && options.chars(html);
        if (
          
          !stack.length &&
          options.warn
        ) {
          options.warn(("Mal-formatted tag at end of template: \"" + html + "\""), {
            start: index + html.length,
          });
        }
        break;
      }
    }

    // Clean up any remaining tags
    parseEndTag();
    /**
     * 下标index前进
     * @param {*} n
     */
    function advance(n) {
      index += n;
      html = html.substring(n);
    }
    // 解析开始标签
    function parseStartTag() {
      // 比如 '<div id="#app"></div>‘，start[0]: 'div', start[1]: '<div'
      var start = html.match(startTagOpen);
      if (start) {
        var match = {
          tagName: start[1],
          attrs: [],
          start: index,
        };
        advance(start[0].length);
        var end, attr;
        // 解析标签属性
        while (
          !(end = html.match(startTagClose)) &&
          (attr = html.match(dynamicArgAttribute) || html.match(attribute))
        ) {
          // attr: [" id="app"", "id", "=", "app"]
          attr.start = index;
          advance(attr[0].length);
          attr.end = index;
          match.attrs.push(attr);
        }
        // 是否为自闭合标签
        if (end) {
          match.unarySlash = end[1];
          advance(end[0].length);
          match.end = index;
          return match;
        }
      }
    }
    // 对parseStartTag函数的解析结果进行下一步处理
    function handleStartTag(match) {
      var tagName = match.tagName;
      var unarySlash = match.unarySlash;

      if (expectHTML) {
        if (lastTag === "p" && isNonPhrasingTag(tagName)) {
          parseEndTag(lastTag);
        }
        if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
          parseEndTag(tagName);
        }
      }

      var unary = isUnaryTag(tagName) || !!unarySlash;

      var l = match.attrs.length;
      var attrs = new Array(l);
      for (var i = 0; i < l; i++) {
        var args = match.attrs[i];
        var value = args[3] || args[4] || args[5] || "";
        var shouldDecodeNewlines =
          tagName === "a" && args[1] === "href"
            ? options.shouldDecodeNewlinesForHref
            : options.shouldDecodeNewlines;
        attrs[i] = {
          name: args[1],
          value: decodeAttr(value, shouldDecodeNewlines),
        };
        if ( options.outputSourceRange) {
          attrs[i].start = args.start + args[0].match(/^\s*/).length;
          attrs[i].end = args.end;
        }
      }

      if (!unary) {
        stack.push({
          tag: tagName,
          lowerCasedTag: tagName.toLowerCase(),
          attrs: attrs,
          start: match.start,
          end: match.end,
        });
        lastTag = tagName;
      }

      if (options.start) {
        options.start(tagName, attrs, unary, match.start, match.end);
      }
    }
    // 解析结束标签
    /**
     * 第一种是三个参数都传递，用于处理普通的结束标签
     * 第二种是只传递tagName
     * 第三种是三个参数都不传递，用于处理栈中剩余未处理的标签
     */
    function parseEndTag(tagName, start, end) {
      var pos, lowerCasedTagName;
      if (start == null) { start = index; }
      if (end == null) { end = index; }

      // Find the closest opened tag of the same type
      // 如果tagName存在，那么就从后往前遍历栈，在栈中寻找与tagName相同的标签并记录其所在的位置pos，如果tagName不存在，则将pos置为0。
      if (tagName) {
        lowerCasedTagName = tagName.toLowerCase();
        for (pos = stack.length - 1; pos >= 0; pos--) {
          if (stack[pos].lowerCasedTag === lowerCasedTagName) {
            break;
          }
        }
      } else {
        // If no tag name is provided, clean shop
        pos = 0;
      }

      if (pos >= 0) {
        // Close all the open elements, up the stack
        // 从栈顶往前遍历，如果有其他标签，则表明这个标签没有被正确闭合，直接打印警告
        for (var i = stack.length - 1; i >= pos; i--) {
          if (
            
            (i > pos || !tagName) &&
            options.warn
          ) {
            options.warn(("tag <" + (stack[i].tag) + "> has no matching end tag."), {
              start: stack[i].start,
              end: stack[i].end,
            });
          }
          // 为了程序的正确性，自动将其闭合
          if (options.end) {
            options.end(stack[i].tag, start, end);
          }
        }

        // Remove the open elements from the stack
        // 出栈
        stack.length = pos;
        // 更新栈顶元素
        lastTag = pos && stack[pos - 1].tag;
      }
      // 没有找到对应的开始标签，即pos === -1
      // 浏览器会自动把</br>标签解析为正常的 <br>标签，而对于</p>浏览器则自动将其补全为<p></p>，
      // 所以Vue为了与浏览器对这两个标签的行为保持一致，故对这两个便签单独判断处理，
      // 是否为br标签
      else if (lowerCasedTagName === "br") {
        if (options.start) {
          options.start(tagName, [], true, start, end);
        }
      }
      // 是否为p标签
      else if (lowerCasedTagName === "p") {
        if (options.start) {
          options.start(tagName, [], false, start, end);
        }
        if (options.end) {
          options.end(tagName, start, end);
        }
      }
    }
  }

  /*  */

  /**
   * Cross-platform code generation for component v-model
   */
  // 组件v-model解析
  function genComponentModel (
    el,
    value,
    modifiers
  ) {
    var ref = modifiers || {};
    var number = ref.number;
    var trim = ref.trim;

    var baseValueExpression = '$$v';
    var valueExpression = baseValueExpression;
    if (trim) {
      valueExpression =
        "(typeof " + baseValueExpression + " === 'string'" +
        "? " + baseValueExpression + ".trim()" +
        ": " + baseValueExpression + ")";
    }
    if (number) {
      valueExpression = "_n(" + valueExpression + ")";
    }
    var assignment = genAssignmentCode(value, valueExpression);

    el.model = {
      value: ("(" + value + ")"),
      expression: JSON.stringify(value),
      callback: ("function (" + baseValueExpression + ") {" + assignment + "}")
    };
  }

  /**
   * Cross-platform codegen helper for generating v-model value assignment code.
   */
  function genAssignmentCode (
    value,
    assignment
  ) {
    var res = parseModel(value);
    if (res.key === null) {
      return (value + "=" + assignment)
    } else {
      return ("$set(" + (res.exp) + ", " + (res.key) + ", " + assignment + ")")
    }
  }

  /**
   * Parse a v-model expression into a base path and a final key segment.
   * Handles both dot-path and possible square brackets.
   *
   * Possible cases:
   *
   * - test
   * - test[key]
   * - test[test1[key]]
   * - test["a"][key]
   * - xxx.test[a[a].test1[key]]
   * - test.xxx.a["asa"][test1[key]]
   *
   */

  var len, str, chr, index, expressionPos, expressionEndPos;



  function parseModel (val) {
    // Fix https://github.com/vuejs/vue/pull/7730
    // allow v-model="obj.val " (trailing whitespace)
    val = val.trim();
    len = val.length;

    if (val.indexOf('[') < 0 || val.lastIndexOf(']') < len - 1) {
      index = val.lastIndexOf('.');
      if (index > -1) {
        return {
          exp: val.slice(0, index),
          key: '"' + val.slice(index + 1) + '"'
        }
      } else {
        return {
          exp: val,
          key: null
        }
      }
    }

    str = val;
    index = expressionPos = expressionEndPos = 0;

    while (!eof()) {
      chr = next();
      /* istanbul ignore if */
      if (isStringStart(chr)) {
        parseString(chr);
      } else if (chr === 0x5B) {
        parseBracket(chr);
      }
    }

    return {
      exp: val.slice(0, expressionPos),
      key: val.slice(expressionPos + 1, expressionEndPos)
    }
  }

  function next () {
    return str.charCodeAt(++index)
  }

  function eof () {
    return index >= len
  }

  function isStringStart (chr) {
    return chr === 0x22 || chr === 0x27
  }

  function parseBracket (chr) {
    var inBracket = 1;
    expressionPos = index;
    while (!eof()) {
      chr = next();
      if (isStringStart(chr)) {
        parseString(chr);
        continue
      }
      if (chr === 0x5B) { inBracket++; }
      if (chr === 0x5D) { inBracket--; }
      if (inBracket === 0) {
        expressionEndPos = index;
        break
      }
    }
  }

  function parseString (chr) {
    var stringQuote = chr;
    while (!eof()) {
      chr = next();
      if (chr === stringQuote) {
        break
      }
    }
  }

  /*  */

  var onRE = /^@|^v-on:/;
  var dirRE =  /^v-|^@|^:|^#/;
  var forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
  var forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
  var stripParensRE = /^\(|\)$/g;
  var dynamicArgRE = /^\[.*\]$/;

  var argRE = /:(.*)$/;
  var bindRE = /^:|^\.|^v-bind:/;
  var modifierRE = /\.[^.\]]+(?=[^\]]*$)/g;

  var slotRE = /^v-slot(:|$)|^#/;

  var lineBreakRE = /[\r\n]/;
  var whitespaceRE = /[ \f\t\r\n]+/g;

  var invalidAttributeRE = /[\s"'<>\/=]/;

  var decodeHTMLCached = cached(he.decode);

  var emptySlotScopeToken = "_empty_";

  // configurable state
  var warn$1;
  var delimiters;
  var transforms;
  var preTransforms;
  var postTransforms;
  var platformIsPreTag;
  var platformMustUseProp;
  var platformGetTagNamespace;
  var maybeComponent;

  function createASTElement(
    tag,
    attrs,
    parent //
  ) {
    return {
      type: 1,
      tag: tag,
      attrsList: attrs,
      attrsMap: makeAttrsMap(attrs),
      rawAttrsMap: {},
      parent: parent,
      children: [],
    };
  }

  /**
   * Convert HTML string to AST.
   */
  function parse(
    template,
    options
  ) {
    warn$1 = options.warn || baseWarn;

    platformIsPreTag = options.isPreTag || no;
    platformMustUseProp = options.mustUseProp || no;
    platformGetTagNamespace = options.getTagNamespace || no;
    var isReservedTag = options.isReservedTag || no;
    maybeComponent = function (el) { return !!(
        el.component ||
        el.attrsMap[":is"] ||
        el.attrsMap["v-bind:is"] ||
        !(el.attrsMap.is ? isReservedTag(el.attrsMap.is) : isReservedTag(el.tag))
      ); };
    transforms = pluckModuleFunction(options.modules, "transformNode");
    preTransforms = pluckModuleFunction(options.modules, "preTransformNode");
    postTransforms = pluckModuleFunction(options.modules, "postTransformNode");

    delimiters = options.delimiters;

    var stack = [];
    var preserveWhitespace = options.preserveWhitespace !== false;
    var whitespaceOption = options.whitespace;
    var root;
    var currentParent;
    var inVPre = false;
    var inPre = false;
    var warned = false;

    function warnOnce(msg, range) {
      if (!warned) {
        warned = true;
        warn$1(msg, range);
      }
    }

    function closeElement(element) {
      trimEndingWhitespace(element);
      if (!inVPre && !element.processed) {
        element = processElement(element, options);
      }
      // tree management
      if (!stack.length && element !== root) {
        // allow root elements with v-if, v-else-if and v-else
        if (root.if && (element.elseif || element.else)) {
          {
            checkRootConstraints(element);
          }
          addIfCondition(root, {
            exp: element.elseif,
            block: element,
          });
        } else {
          warnOnce(
            "Component template should contain exactly one root element. " +
              "If you are using v-if on multiple elements, " +
              "use v-else-if to chain them instead.",
            { start: element.start }
          );
        }
      }
      if (currentParent && !element.forbidden) {
        if (element.elseif || element.else) {
          processIfConditions(element, currentParent);
        } else {
          if (element.slotScope) {
            // scoped slot
            // keep it in the children list so that v-else(-if) conditions can
            // find it as the prev node.
            var name = element.slotTarget || '"default"';
            (currentParent.scopedSlots || (currentParent.scopedSlots = {}))[
              name
            ] = element;
          }
          currentParent.children.push(element);
          element.parent = currentParent;
        }
      }

      // final children cleanup
      // filter out scoped slots
      element.children = element.children.filter(function (c) { return !(c).slotScope; });
      // remove trailing whitespace node again
      trimEndingWhitespace(element);

      // check pre state
      if (element.pre) {
        inVPre = false;
      }
      if (platformIsPreTag(element.tag)) {
        inPre = false;
      }
      // apply post-transforms
      for (var i = 0; i < postTransforms.length; i++) {
        postTransforms[i](element, options);
      }
    }

    function trimEndingWhitespace(el) {
      // remove trailing whitespace node
      if (!inPre) {
        var lastNode;
        while (
          (lastNode = el.children[el.children.length - 1]) &&
          lastNode.type === 3 &&
          lastNode.text === " "
        ) {
          el.children.pop();
        }
      }
    }

    function checkRootConstraints(el) {
      if (el.tag === "slot" || el.tag === "template") {
        warnOnce(
          "Cannot use <" + (el.tag) + "> as component root element because it may " +
            "contain multiple nodes.",
          { start: el.start }
        );
      }
      if (el.attrsMap.hasOwnProperty("v-for")) {
        warnOnce(
          "Cannot use v-for on stateful component root element because " +
            "it renders multiple elements.",
          el.rawAttrsMap["v-for"]
        );
      }
    }

    parseHTML(template, {
      warn: warn$1,
      expectHTML: options.expectHTML,
      isUnaryTag: options.isUnaryTag,
      canBeLeftOpenTag: options.canBeLeftOpenTag,
      shouldDecodeNewlines: options.shouldDecodeNewlines,
      shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
      shouldKeepComment: options.comments,
      outputSourceRange: options.outputSourceRange,
      // 当解析到开始标签时，调用该函数
      // tag: 标签名
      // attrs: 标签属性
      // unary: 标签是否闭合
      start: function start(tag, attrs, unary, start$1, end) {
        // check namespace.
        // inherit parent ns if there is one
        var ns =
          (currentParent && currentParent.ns) || platformGetTagNamespace(tag);

        // handle IE svg bug
        /* istanbul ignore if */
        if (isIE && ns === "svg") {
          attrs = guardIESVGBug(attrs);
        }

        var element = createASTElement(tag, attrs, currentParent);
        if (ns) {
          element.ns = ns;
        }

        {
          if (options.outputSourceRange) {
            element.start = start$1;
            element.end = end;
            element.rawAttrsMap = element.attrsList.reduce(function (cumulated, attr) {
              cumulated[attr.name] = attr;
              return cumulated;
            }, {});
          }
          attrs.forEach(function (attr) {
            if (invalidAttributeRE.test(attr.name)) {
              warn$1(
                "Invalid dynamic argument expression: attribute names cannot contain " +
                  "spaces, quotes, <, >, / or =.",
                {
                  start: attr.start + attr.name.indexOf("["),
                  end: attr.start + attr.name.length,
                }
              );
            }
          });
        }

        if (isForbiddenTag(element) && !isServerRendering()) {
          element.forbidden = true;
          
            warn$1(
              "Templates should only be responsible for mapping the state to the " +
                "UI. Avoid placing tags with side-effects in your templates, such as " +
                "<" + tag + ">" +
                ", as they will not be parsed.",
              { start: element.start }
            );
        }

        // apply pre-transforms
        for (var i = 0; i < preTransforms.length; i++) {
          element = preTransforms[i](element, options) || element;
        }

        if (!inVPre) {
          processPre(element);
          if (element.pre) {
            inVPre = true;
          }
        }

        if (platformIsPreTag(element.tag)) {
          inPre = true;
        }

        if (inVPre) {
          processRawAttrs(element);
        } else if (!element.processed) {
          // structural directives
          processFor(element);
          processIf(element);
          processOnce(element);
        }

        if (!root) {
          root = element;
          {
            checkRootConstraints(root);
          }
        }

        if (!unary) {
          currentParent = element;
          stack.push(element);
        } else {
          closeElement(element);
        }
      },
      // 当解析到结束标签时，调用该函数
      end: function end(tag, start, end$1) {
        var element = stack[stack.length - 1];
        // pop stack
        stack.length -= 1;
        currentParent = stack[stack.length - 1];
        if ( options.outputSourceRange) {
          element.end = end$1;
        }
        closeElement(element);
      },
      // 当解析到文本时，调用该函数
      // 根据文本是否包含变量再细化为创建含有变量的AST节点和不包含变量的AST节点
      chars: function chars(text, start, end) {
        // 打印警告
        if (!currentParent) {
          {
            if (text === template) {
              warnOnce(
                "Component template requires a root element, rather than just text.",
                { start: start }
              );
            } else if ((text = text.trim())) {
              warnOnce(("text \"" + text + "\" outside root element will be ignored."), {
                start: start,
              });
            }
          }
          return;
        }
        // IE textarea placeholder bug
        /* istanbul ignore if */
        if (
          isIE &&
          currentParent.tag === "textarea" &&
          currentParent.attrsMap.placeholder === text
        ) {
          return;
        }
        var children = currentParent.children;
        if (inPre || text.trim()) {
          text = isTextTag(currentParent) ? text : decodeHTMLCached(text);
        } else if (!children.length) {
          // remove the whitespace-only node right after an opening tag
          text = "";
        } else if (whitespaceOption) {
          if (whitespaceOption === "condense") {
            // in condense mode, remove the whitespace node if it contains
            // line break, otherwise condense to a single space
            text = lineBreakRE.test(text) ? "" : " ";
          } else {
            text = " ";
          }
        } else {
          text = preserveWhitespace ? " " : "";
        }
        if (text) {
          if (!inPre && whitespaceOption === "condense") {
            // condense consecutive whitespaces into single space
            text = text.replace(whitespaceRE, " ");
          }
          var res;
          var child;
          // 包含变量的文本
          if (!inVPre && text !== " " && (res = parseText(text, delimiters))) {
            /**
             * let res = parseText(text)
             * res = {
             *     expression:"我叫"+_s(name)+"，我今年"+_s(age)+"岁了",
             *     tokens:[
             *         "我叫",
             *         {'@binding': name },
             *         "，我今年"
             *         {'@binding': age },
             *       "岁了"
             *     ]
             * }
             */
            child = {
              type: 2,
              expression: res.expression,
              tokens: res.tokens,
              text: text,
            };
          }
          // 不包含变量的文本
          else if (
            text !== " " ||
            !children.length ||
            children[children.length - 1].text !== " "
          ) {
            child = {
              type: 3,
              text: text,
            };
          }
          if (child) {
            if (
              
              options.outputSourceRange
            ) {
              child.start = start;
              child.end = end;
            }
            children.push(child);
          }
        }
      },
      // 当解析到注释时，调用该函数
      comment: function comment(text, start, end) {
        // adding anything as a sibling to the root node is forbidden
        // comments should still be allowed, but ignored
        if (currentParent) {
          // comment的AST
          var child = {
            type: 3,
            text: text,
            isComment: true,
          };
          if (
            
            options.outputSourceRange
          ) {
            child.start = start;
            child.end = end;
          }
          currentParent.children.push(child);
        }
      },
    });
    return root;
  }

  function processPre(el) {
    if (getAndRemoveAttr(el, "v-pre") != null) {
      el.pre = true;
    }
  }

  function processRawAttrs(el) {
    var list = el.attrsList;
    var len = list.length;
    if (len) {
      var attrs = (el.attrs = new Array(len));
      for (var i = 0; i < len; i++) {
        attrs[i] = {
          name: list[i].name,
          value: JSON.stringify(list[i].value),
        };
        if (list[i].start != null) {
          attrs[i].start = list[i].start;
          attrs[i].end = list[i].end;
        }
      }
    } else if (!el.pre) {
      // non root node in pre blocks with no attributes
      el.plain = true;
    }
  }

  function processElement(element, options) {
    processKey(element);

    // determine whether this is a plain element after
    // removing structural attributes
    element.plain =
      !element.key && !element.scopedSlots && !element.attrsList.length;

    processRef(element);
    processSlotContent(element);
    processSlotOutlet(element);
    processComponent(element);
    for (var i = 0; i < transforms.length; i++) {
      element = transforms[i](element, options) || element;
    }
    processAttrs(element);
    return element;
  }

  function processKey(el) {
    var exp = getBindingAttr(el, "key");
    if (exp) {
      {
        if (el.tag === "template") {
          warn$1(
            "<template> cannot be keyed. Place the key on real elements instead.",
            getRawBindingAttr(el, "key")
          );
        }
        if (el.for) {
          var iterator = el.iterator2 || el.iterator1;
          var parent = el.parent;
          if (
            iterator &&
            iterator === exp &&
            parent &&
            parent.tag === "transition-group"
          ) {
            warn$1(
              "Do not use v-for index as key on <transition-group> children, " +
                "this is the same as not using keys.",
              getRawBindingAttr(el, "key"),
              true /* tip */
            );
          }
        }
      }
      el.key = exp;
    }
  }

  function processRef(el) {
    var ref = getBindingAttr(el, "ref");
    if (ref) {
      el.ref = ref;
      el.refInFor = checkInFor(el);
    }
  }

  function processFor(el) {
    var exp;
    if ((exp = getAndRemoveAttr(el, "v-for"))) {
      var res = parseFor(exp);
      if (res) {
        extend(el, res);
      } else {
        warn$1(("Invalid v-for expression: " + exp), el.rawAttrsMap["v-for"]);
      }
    }
  }



  function parseFor(exp) {
    var inMatch = exp.match(forAliasRE);
    if (!inMatch) { return; }
    var res = {};
    res.for = inMatch[2].trim();
    var alias = inMatch[1].trim().replace(stripParensRE, "");
    var iteratorMatch = alias.match(forIteratorRE);
    if (iteratorMatch) {
      res.alias = alias.replace(forIteratorRE, "").trim();
      res.iterator1 = iteratorMatch[1].trim();
      if (iteratorMatch[2]) {
        res.iterator2 = iteratorMatch[2].trim();
      }
    } else {
      res.alias = alias;
    }
    return res;
  }

  function processIf(el) {
    var exp = getAndRemoveAttr(el, "v-if");
    if (exp) {
      el.if = exp;
      addIfCondition(el, {
        exp: exp,
        block: el,
      });
    } else {
      if (getAndRemoveAttr(el, "v-else") != null) {
        el.else = true;
      }
      var elseif = getAndRemoveAttr(el, "v-else-if");
      if (elseif) {
        el.elseif = elseif;
      }
    }
  }

  function processIfConditions(el, parent) {
    var prev = findPrevElement(parent.children);
    if (prev && prev.if) {
      addIfCondition(prev, {
        exp: el.elseif,
        block: el,
      });
    } else {
      warn$1(
        "v-" + (el.elseif ? 'else-if="' + el.elseif + '"' : "else") + " " +
          "used on element <" + (el.tag) + "> without corresponding v-if.",
        el.rawAttrsMap[el.elseif ? "v-else-if" : "v-else"]
      );
    }
  }

  function findPrevElement(children) {
    var i = children.length;
    while (i--) {
      if (children[i].type === 1) {
        return children[i];
      } else {
        if ( children[i].text !== " ") {
          warn$1(
            "text \"" + (children[i].text.trim()) + "\" between v-if and v-else(-if) " +
              "will be ignored.",
            children[i]
          );
        }
        children.pop();
      }
    }
  }

  function addIfCondition(el, condition) {
    if (!el.ifConditions) {
      el.ifConditions = [];
    }
    el.ifConditions.push(condition);
  }

  function processOnce(el) {
    var once = getAndRemoveAttr(el, "v-once");
    if (once != null) {
      el.once = true;
    }
  }

  // handle content being passed to a component as slot,
  // e.g. <template slot="xxx">, <div slot-scope="xxx">
  function processSlotContent(el) {
    var slotScope;
    if (el.tag === "template") {
      slotScope = getAndRemoveAttr(el, "scope");
      /* istanbul ignore if */
      if ( slotScope) {
        warn$1(
          "the \"scope\" attribute for scoped slots have been deprecated and " +
            "replaced by \"slot-scope\" since 2.5. The new \"slot-scope\" attribute " +
            "can also be used on plain elements in addition to <template> to " +
            "denote scoped slots.",
          el.rawAttrsMap["scope"],
          true
        );
      }
      el.slotScope = slotScope || getAndRemoveAttr(el, "slot-scope");
    } else if ((slotScope = getAndRemoveAttr(el, "slot-scope"))) {
      /* istanbul ignore if */
      if ( el.attrsMap["v-for"]) {
        warn$1(
          "Ambiguous combined usage of slot-scope and v-for on <" + (el.tag) + "> " +
            "(v-for takes higher priority). Use a wrapper <template> for the " +
            "scoped slot to make it clearer.",
          el.rawAttrsMap["slot-scope"],
          true
        );
      }
      el.slotScope = slotScope;
    }

    // slot="xxx"
    var slotTarget = getBindingAttr(el, "slot");
    if (slotTarget) {
      el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget;
      el.slotTargetDynamic = !!(
        el.attrsMap[":slot"] || el.attrsMap["v-bind:slot"]
      );
      // preserve slot as an attribute for native shadow DOM compat
      // only for non-scoped slots.
      if (el.tag !== "template" && !el.slotScope) {
        addAttr(el, "slot", slotTarget, getRawBindingAttr(el, "slot"));
      }
    }

    // 2.6 v-slot syntax
    {
      if (el.tag === "template") {
        // v-slot on <template>
        var slotBinding = getAndRemoveAttrByRegex(el, slotRE);
        if (slotBinding) {
          {
            if (el.slotTarget || el.slotScope) {
              warn$1("Unexpected mixed usage of different slot syntaxes.", el);
            }
            if (el.parent && !maybeComponent(el.parent)) {
              warn$1(
                "<template v-slot> can only appear at the root level inside " +
                  "the receiving component",
                el
              );
            }
          }
          var ref = getSlotName(slotBinding);
          var name = ref.name;
          var dynamic = ref.dynamic;
          el.slotTarget = name;
          el.slotTargetDynamic = dynamic;
          el.slotScope = slotBinding.value || emptySlotScopeToken; // force it into a scoped slot for perf
        }
      } else {
        // v-slot on component, denotes default slot
        var slotBinding$1 = getAndRemoveAttrByRegex(el, slotRE);
        if (slotBinding$1) {
          {
            if (!maybeComponent(el)) {
              warn$1(
                "v-slot can only be used on components or <template>.",
                slotBinding$1
              );
            }
            if (el.slotScope || el.slotTarget) {
              warn$1("Unexpected mixed usage of different slot syntaxes.", el);
            }
            if (el.scopedSlots) {
              warn$1(
                "To avoid scope ambiguity, the default slot should also use " +
                  "<template> syntax when there are other named slots.",
                slotBinding$1
              );
            }
          }
          // add the component's children to its default slot
          var slots = el.scopedSlots || (el.scopedSlots = {});
          var ref$1 = getSlotName(slotBinding$1);
          var name$1 = ref$1.name;
          var dynamic$1 = ref$1.dynamic;
          var slotContainer = (slots[name$1] = createASTElement(
            "template",
            [],
            el
          ));
          slotContainer.slotTarget = name$1;
          slotContainer.slotTargetDynamic = dynamic$1;
          slotContainer.children = el.children.filter(function (c) {
            if (!c.slotScope) {
              c.parent = slotContainer;
              return true;
            }
          });
          slotContainer.slotScope = slotBinding$1.value || emptySlotScopeToken;
          // remove children as they are returned from scopedSlots now
          el.children = [];
          // mark el non-plain so data gets generated
          el.plain = false;
        }
      }
    }
  }

  function getSlotName(binding) {
    var name = binding.name.replace(slotRE, "");
    if (!name) {
      if (binding.name[0] !== "#") {
        name = "default";
      } else {
        warn$1("v-slot shorthand syntax requires a slot name.", binding);
      }
    }
    return dynamicArgRE.test(name)
      ? // dynamic [name]
        { name: name.slice(1, -1), dynamic: true }
      : // static name
        { name: ("\"" + name + "\""), dynamic: false };
  }

  // handle <slot/> outlets
  function processSlotOutlet(el) {
    if (el.tag === "slot") {
      el.slotName = getBindingAttr(el, "name");
      if ( el.key) {
        warn$1(
          "`key` does not work on <slot> because slots are abstract outlets " +
            "and can possibly expand into multiple elements. " +
            "Use the key on a wrapping element instead.",
          getRawBindingAttr(el, "key")
        );
      }
    }
  }

  function processComponent(el) {
    var binding;
    if ((binding = getBindingAttr(el, "is"))) {
      el.component = binding;
    }
    if (getAndRemoveAttr(el, "inline-template") != null) {
      el.inlineTemplate = true;
    }
  }

  function processAttrs(el) {
    var list = el.attrsList;
    var i, l, name, rawName, value, modifiers, syncGen, isDynamic;
    for (i = 0, l = list.length; i < l; i++) {
      name = rawName = list[i].name;
      value = list[i].value;
      // Vue内部指令，以v-、@、:开头
      if (dirRE.test(name)) {
        // mark element as dynamic
        el.hasBindings = true;
        // modifiers
        modifiers = parseModifiers(name.replace(dirRE, ""));
        // support .foo shorthand syntax for the .prop modifier
        if (modifiers) {
          name = name.replace(modifierRE, "");
        }
        // v-bind
        if (bindRE.test(name)) {
          // v-bind
          name = name.replace(bindRE, "");
          value = parseFilters(value);
          isDynamic = dynamicArgRE.test(name);
          if (isDynamic) {
            name = name.slice(1, -1);
          }
          if (
            
            value.trim().length === 0
          ) {
            warn$1(
              ("The value for a v-bind expression cannot be empty. Found in \"v-bind:" + name + "\"")
            );
          }
          if (modifiers) {
            if (modifiers.prop && !isDynamic) {
              name = camelize(name);
              if (name === "innerHtml") { name = "innerHTML"; }
            }
            if (modifiers.camel && !isDynamic) {
              name = camelize(name);
            }
            if (modifiers.sync) {
              syncGen = genAssignmentCode(value, "$event");
              if (!isDynamic) {
                addHandler(
                  el,
                  ("update:" + (camelize(name))),
                  syncGen,
                  null,
                  false,
                  warn$1,
                  list[i]
                );
                if (hyphenate(name) !== camelize(name)) {
                  addHandler(
                    el,
                    ("update:" + (hyphenate(name))),
                    syncGen,
                    null,
                    false,
                    warn$1,
                    list[i]
                  );
                }
              } else {
                // handler w/ dynamic event name
                addHandler(
                  el,
                  ("\"update:\"+(" + name + ")"),
                  syncGen,
                  null,
                  false,
                  warn$1,
                  list[i],
                  true // dynamic
                );
              }
            }
          }
          if (
            (modifiers && modifiers.prop) ||
            (!el.component && platformMustUseProp(el.tag, el.attrsMap.type, name))
          ) {
            addProp(el, name, value, list[i], isDynamic);
          } else {
            addAttr(el, name, value, list[i], isDynamic);
          }
        }
        // v-on
        else if (onRE.test(name)) {
          // v-on
          name = name.replace(onRE, "");
          isDynamic = dynamicArgRE.test(name);
          if (isDynamic) {
            name = name.slice(1, -1);
          }
          addHandler(el, name, value, modifiers, false, warn$1, list[i], isDynamic);
        }
        // 普通
        else {
          // normal directives
          name = name.replace(dirRE, "");
          // parse arg
          var argMatch = name.match(argRE);
          var arg = argMatch && argMatch[1];
          isDynamic = false;
          if (arg) {
            name = name.slice(0, -(arg.length + 1));
            if (dynamicArgRE.test(arg)) {
              arg = arg.slice(1, -1);
              isDynamic = true;
            }
          }
          addDirective(
            el,
            name,
            rawName,
            value,
            arg,
            isDynamic,
            modifiers,
            list[i]
          );
          if ( name === "model") {
            checkForAliasModel(el, value);
          }
        }
      }
      // 非Vue内部指令
      else {
        // literal attribute
        {
          var res = parseText(value, delimiters);
          if (res) {
            warn$1(
              name + "=\"" + value + "\": " +
                "Interpolation inside attributes has been removed. " +
                "Use v-bind or the colon shorthand instead. For example, " +
                'instead of <div id="{{ val }}">, use <div :id="val">.',
              list[i]
            );
          }
        }
        addAttr(el, name, JSON.stringify(value), list[i]);
        // #6887 firefox doesn't update muted state if set via attribute
        // even immediately after element creation
        if (
          !el.component &&
          name === "muted" &&
          platformMustUseProp(el.tag, el.attrsMap.type, name)
        ) {
          addProp(el, name, "true", list[i]);
        }
      }
    }
  }

  function checkInFor(el) {
    var parent = el;
    while (parent) {
      if (parent.for !== undefined) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  function parseModifiers(name) {
    var match = name.match(modifierRE);
    if (match) {
      var ret = {};
      match.forEach(function (m) {
        ret[m.slice(1)] = true;
      });
      return ret;
    }
  }

  function makeAttrsMap(attrs) {
    var map = {};
    for (var i = 0, l = attrs.length; i < l; i++) {
      if (
        
        map[attrs[i].name] &&
        !isIE &&
        !isEdge
      ) {
        warn$1("duplicate attribute: " + attrs[i].name, attrs[i]);
      }
      map[attrs[i].name] = attrs[i].value;
    }
    return map;
  }

  // for script (e.g. type="x/template") or style, do not decode content
  function isTextTag(el) {
    return el.tag === "script" || el.tag === "style";
  }

  function isForbiddenTag(el) {
    return (
      el.tag === "style" ||
      (el.tag === "script" &&
        (!el.attrsMap.type || el.attrsMap.type === "text/javascript"))
    );
  }

  var ieNSBug = /^xmlns:NS\d+/;
  var ieNSPrefix = /^NS\d+:/;

  /* istanbul ignore next */
  function guardIESVGBug(attrs) {
    var res = [];
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      if (!ieNSBug.test(attr.name)) {
        attr.name = attr.name.replace(ieNSPrefix, "");
        res.push(attr);
      }
    }
    return res;
  }

  function checkForAliasModel(el, value) {
    var _el = el;
    while (_el) {
      if (_el.for && _el.alias === value) {
        warn$1(
          "<" + (el.tag) + " v-model=\"" + value + "\">: " +
            "You are binding v-model directly to a v-for iteration alias. " +
            "This will not be able to modify the v-for source array because " +
            "writing to the alias is like modifying a function local variable. " +
            "Consider using an array of objects and use v-model on an object property instead.",
          el.rawAttrsMap["v-model"]
        );
      }
      _el = _el.parent;
    }
  }

  /*  */

  function preTransformNode (el, options) {
    if (el.tag === 'input') {
      var map = el.attrsMap;
      if (!map['v-model']) {
        return
      }

      var typeBinding;
      if (map[':type'] || map['v-bind:type']) {
        typeBinding = getBindingAttr(el, 'type');
      }
      if (!map.type && !typeBinding && map['v-bind']) {
        typeBinding = "(" + (map['v-bind']) + ").type";
      }

      if (typeBinding) {
        var ifCondition = getAndRemoveAttr(el, 'v-if', true);
        var ifConditionExtra = ifCondition ? ("&&(" + ifCondition + ")") : "";
        var hasElse = getAndRemoveAttr(el, 'v-else', true) != null;
        var elseIfCondition = getAndRemoveAttr(el, 'v-else-if', true);
        // 1. checkbox
        var branch0 = cloneASTElement(el);
        // process for on the main node
        processFor(branch0);
        addRawAttr(branch0, 'type', 'checkbox');
        processElement(branch0, options);
        branch0.processed = true; // prevent it from double-processed
        branch0.if = "(" + typeBinding + ")==='checkbox'" + ifConditionExtra;
        addIfCondition(branch0, {
          exp: branch0.if,
          block: branch0
        });
        // 2. add radio else-if condition
        var branch1 = cloneASTElement(el);
        getAndRemoveAttr(branch1, 'v-for', true);
        addRawAttr(branch1, 'type', 'radio');
        processElement(branch1, options);
        addIfCondition(branch0, {
          exp: "(" + typeBinding + ")==='radio'" + ifConditionExtra,
          block: branch1
        });
        // 3. other
        var branch2 = cloneASTElement(el);
        getAndRemoveAttr(branch2, 'v-for', true);
        addRawAttr(branch2, ':type', typeBinding);
        processElement(branch2, options);
        addIfCondition(branch0, {
          exp: ifCondition,
          block: branch2
        });

        if (hasElse) {
          branch0.else = true;
        } else if (elseIfCondition) {
          branch0.elseif = elseIfCondition;
        }

        return branch0
      }
    }
  }

  function cloneASTElement (el) {
    return createASTElement(el.tag, el.attrsList.slice(), el.parent)
  }

  var model$1 = {
    preTransformNode: preTransformNode
  };

  var modules$1 = [
    klass,
    style,
    model$1
  ];

  /*  */

  var warn$2;

  // in some cases, the event used has to be determined at runtime
  // so we used some reserved tokens during compile.
  var RANGE_TOKEN = '__r';
  // v-model指令的实现
  function model$2 (
    el,
    dir,
    _warn
  ) {
    warn$2 = _warn;
    var value = dir.value;
    var modifiers = dir.modifiers;
    var tag = el.tag;
    var type = el.attrsMap.type;
    // type: file不能使用v-model
    {
      // inputs with type="file" are read only and setting the input's
      // value will throw an error.
      if (tag === 'input' && type === 'file') {
        warn$2(
          "<" + (el.tag) + " v-model=\"" + value + "\" type=\"file\">:\n" +
          "File inputs are read only. Use a v-on:change listener instead.",
          el.rawAttrsMap['v-model']
        );
      }
    }
    // 根据v-model作用的对象不同，做不同的处理
    if (el.component) {
      genComponentModel(el, value, modifiers);
      // component v-model doesn't need extra runtime
      return false
    } else if (tag === 'select') {
      genSelect(el, value, modifiers);
    } else if (tag === 'input' && type === 'checkbox') {
      genCheckboxModel(el, value, modifiers);
    } else if (tag === 'input' && type === 'radio') {
      genRadioModel(el, value, modifiers);
    } else if (tag === 'input' || tag === 'textarea') {
      genDefaultModel(el, value, modifiers);
    } else if (!config.isReservedTag(tag)) {
      genComponentModel(el, value, modifiers);
      // component v-model doesn't need extra runtime
      return false
    } else {
      warn$2(
        "<" + (el.tag) + " v-model=\"" + value + "\">: " +
        "v-model is not supported on this element type. " +
        'If you are working with contenteditable, it\'s recommended to ' +
        'wrap a library dedicated for that purpose inside a custom component.',
        el.rawAttrsMap['v-model']
      );
    }

    // ensure runtime directive metadata
    return true
  }
  // checkbox的v-model绑定
  function genCheckboxModel (
    el,
    value,
    modifiers
  ) {
    var number = modifiers && modifiers.number;
    var valueBinding = getBindingAttr(el, 'value') || 'null';
    var trueValueBinding = getBindingAttr(el, 'true-value') || 'true';
    var falseValueBinding = getBindingAttr(el, 'false-value') || 'false';
    addProp(el, 'checked',
      "Array.isArray(" + value + ")" +
      "?_i(" + value + "," + valueBinding + ")>-1" + (
        trueValueBinding === 'true'
          ? (":(" + value + ")")
          : (":_q(" + value + "," + trueValueBinding + ")")
      )
    );
    addHandler(el, 'change',
      "var $$a=" + value + "," +
          '$$el=$event.target,' +
          "$$c=$$el.checked?(" + trueValueBinding + "):(" + falseValueBinding + ");" +
      'if(Array.isArray($$a)){' +
        "var $$v=" + (number ? '_n(' + valueBinding + ')' : valueBinding) + "," +
            '$$i=_i($$a,$$v);' +
        "if($$el.checked){$$i<0&&(" + (genAssignmentCode(value, '$$a.concat([$$v])')) + ")}" +
        "else{$$i>-1&&(" + (genAssignmentCode(value, '$$a.slice(0,$$i).concat($$a.slice($$i+1))')) + ")}" +
      "}else{" + (genAssignmentCode(value, '$$c')) + "}",
      null, true
    );
  }
  // radio的v-model绑定
  function genRadioModel (
    el,
    value,
    modifiers
  ) {
    var number = modifiers && modifiers.number;
    var valueBinding = getBindingAttr(el, 'value') || 'null';
    valueBinding = number ? ("_n(" + valueBinding + ")") : valueBinding;
    addProp(el, 'checked', ("_q(" + value + "," + valueBinding + ")"));
    addHandler(el, 'change', genAssignmentCode(value, valueBinding), null, true);
  }
  // select的v-model绑定
  function genSelect (
    el,
    value,
    modifiers
  ) {
    var number = modifiers && modifiers.number;
    var selectedVal = "Array.prototype.filter" +
      ".call($event.target.options,function(o){return o.selected})" +
      ".map(function(o){var val = \"_value\" in o ? o._value : o.value;" +
      "return " + (number ? '_n(val)' : 'val') + "})";

    var assignment = '$event.target.multiple ? $$selectedVal : $$selectedVal[0]';
    var code = "var $$selectedVal = " + selectedVal + ";";
    code = code + " " + (genAssignmentCode(value, assignment));
    addHandler(el, 'change', code, null, true);
  }
  // input、textarea的v-model绑定
  function genDefaultModel (
    el,
    value,
    modifiers
  ) {
    var type = el.attrsMap.type;
    // v-bind:value和v-model不能同时使用
    // warn if v-bind:value conflicts with v-model
    // except for inputs with v-bind:type
    {
      var value$1 = el.attrsMap['v-bind:value'] || el.attrsMap[':value'];
      var typeBinding = el.attrsMap['v-bind:type'] || el.attrsMap[':type'];
      if (value$1 && !typeBinding) {
        var binding = el.attrsMap['v-bind:value'] ? 'v-bind:value' : ':value';
        warn$2(
          binding + "=\"" + value$1 + "\" conflicts with v-model on the same element " +
          'because the latter already expands to a value binding internally',
          el.rawAttrsMap[binding]
        );
      }
    }

    var ref = modifiers || {};
    var lazy = ref.lazy;
    var number = ref.number;
    var trim = ref.trim;
    var needCompositionGuard = !lazy && type !== 'range';
    var event = lazy
      ? 'change'
      : type === 'range'
        ? RANGE_TOKEN
        : 'input';

    var valueExpression = '$event.target.value';
    if (trim) {
      valueExpression = "$event.target.value.trim()";
    }
    if (number) {
      valueExpression = "_n(" + valueExpression + ")";
    }

    var code = genAssignmentCode(value, valueExpression);
    // 处理输入法编辑器
    if (needCompositionGuard) {
      code = "if($event.target.composing)return;" + code;
    }
    // 新增props属性
    addProp(el, 'value', ("(" + value + ")"));
    // 新增事件监听
    addHandler(el, event, code, null, true);
    if (trim || number) {
      addHandler(el, 'blur', '$forceUpdate()');
    }
  }

  /*  */

  function text (el, dir) {
    if (dir.value) {
      addProp(el, 'textContent', ("_s(" + (dir.value) + ")"), dir);
    }
  }

  /*  */

  function html (el, dir) {
    if (dir.value) {
      addProp(el, 'innerHTML', ("_s(" + (dir.value) + ")"), dir);
    }
  }

  var directives$1 = {
    model: model$2,
    text: text,
    html: html
  };

  /*  */

  var baseOptions = {
    expectHTML: true,
    modules: modules$1,
    directives: directives$1,
    isPreTag: isPreTag,
    isUnaryTag: isUnaryTag,
    mustUseProp: mustUseProp,
    canBeLeftOpenTag: canBeLeftOpenTag,
    isReservedTag: isReservedTag,
    getTagNamespace: getTagNamespace,
    staticKeys: genStaticKeys(modules$1)
  };

  /*  */

  var fnExpRE = /^([\w$_]+|\([^)]*?\))\s*=>|^function(?:\s+[\w$]+)?\s*\(/;
  var fnInvokeRE = /\([^)]*?\);*$/;
  var simplePathRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/;

  // KeyboardEvent.keyCode aliases
  var keyCodes = {
    esc: 27,
    tab: 9,
    enter: 13,
    space: 32,
    up: 38,
    left: 37,
    right: 39,
    down: 40,
    'delete': [8, 46]
  };

  // KeyboardEvent.key aliases
  var keyNames = {
    // #7880: IE11 and Edge use `Esc` for Escape key name.
    esc: ['Esc', 'Escape'],
    tab: 'Tab',
    enter: 'Enter',
    // #9112: IE11 uses `Spacebar` for Space key name.
    space: [' ', 'Spacebar'],
    // #7806: IE11 uses key names without `Arrow` prefix for arrow keys.
    up: ['Up', 'ArrowUp'],
    left: ['Left', 'ArrowLeft'],
    right: ['Right', 'ArrowRight'],
    down: ['Down', 'ArrowDown'],
    // #9112: IE11 uses `Del` for Delete key name.
    'delete': ['Backspace', 'Delete', 'Del']
  };

  // #4868: modifiers that prevent the execution of the listener
  // need to explicitly return null so that we can determine whether to remove
  // the listener for .once
  var genGuard = function (condition) { return ("if(" + condition + ")return null;"); };

  var modifierCode = {
    stop: '$event.stopPropagation();',
    prevent: '$event.preventDefault();',
    self: genGuard("$event.target !== $event.currentTarget"),
    ctrl: genGuard("!$event.ctrlKey"),
    shift: genGuard("!$event.shiftKey"),
    alt: genGuard("!$event.altKey"),
    meta: genGuard("!$event.metaKey"),
    left: genGuard("'button' in $event && $event.button !== 0"),
    middle: genGuard("'button' in $event && $event.button !== 1"),
    right: genGuard("'button' in $event && $event.button !== 2")
  };

  function genHandlers (
    events,
    isNative
  ) {
    var prefix = isNative ? 'nativeOn:' : 'on:';
    var staticHandlers = "";
    var dynamicHandlers = "";
    for (var name in events) {
      var handlerCode = genHandler(events[name]);
      if (events[name] && events[name].dynamic) {
        dynamicHandlers += name + "," + handlerCode + ",";
      } else {
        staticHandlers += "\"" + name + "\":" + handlerCode + ",";
      }
    }
    staticHandlers = "{" + (staticHandlers.slice(0, -1)) + "}";
    if (dynamicHandlers) {
      return prefix + "_d(" + staticHandlers + ",[" + (dynamicHandlers.slice(0, -1)) + "])"
    } else {
      return prefix + staticHandlers
    }
  }

  function genHandler (handler) {
    if (!handler) {
      return 'function(){}'
    }

    if (Array.isArray(handler)) {
      return ("[" + (handler.map(function (handler) { return genHandler(handler); }).join(',')) + "]")
    }

    var isMethodPath = simplePathRE.test(handler.value);
    var isFunctionExpression = fnExpRE.test(handler.value);
    var isFunctionInvocation = simplePathRE.test(handler.value.replace(fnInvokeRE, ''));

    if (!handler.modifiers) {
      if (isMethodPath || isFunctionExpression) {
        return handler.value
      }
      return ("function($event){" + (isFunctionInvocation ? ("return " + (handler.value)) : handler.value) + "}") // inline statement
    } else {
      var code = '';
      var genModifierCode = '';
      var keys = [];
      for (var key in handler.modifiers) {
        if (modifierCode[key]) {
          genModifierCode += modifierCode[key];
          // left/right
          if (keyCodes[key]) {
            keys.push(key);
          }
        } else if (key === 'exact') {
          var modifiers = (handler.modifiers);
          genModifierCode += genGuard(
            ['ctrl', 'shift', 'alt', 'meta']
              .filter(function (keyModifier) { return !modifiers[keyModifier]; })
              .map(function (keyModifier) { return ("$event." + keyModifier + "Key"); })
              .join('||')
          );
        } else {
          keys.push(key);
        }
      }
      if (keys.length) {
        code += genKeyFilter(keys);
      }
      // Make sure modifiers like prevent and stop get executed after key filtering
      if (genModifierCode) {
        code += genModifierCode;
      }
      var handlerCode = isMethodPath
        ? ("return " + (handler.value) + ".apply(null, arguments)")
        : isFunctionExpression
          ? ("return (" + (handler.value) + ").apply(null, arguments)")
          : isFunctionInvocation
            ? ("return " + (handler.value))
            : handler.value;
      return ("function($event){" + code + handlerCode + "}")
    }
  }

  function genKeyFilter (keys) {
    return (
      // make sure the key filters only apply to KeyboardEvents
      // #9441: can't use 'keyCode' in $event because Chrome autofill fires fake
      // key events that do not have keyCode property...
      "if(!$event.type.indexOf('key')&&" +
      (keys.map(genFilterCode).join('&&')) + ")return null;"
    )
  }

  function genFilterCode (key) {
    var keyVal = parseInt(key, 10);
    if (keyVal) {
      return ("$event.keyCode!==" + keyVal)
    }
    var keyCode = keyCodes[key];
    var keyName = keyNames[key];
    return (
      "_k($event.keyCode," +
      (JSON.stringify(key)) + "," +
      (JSON.stringify(keyCode)) + "," +
      "$event.key," +
      "" + (JSON.stringify(keyName)) +
      ")"
    )
  }

  /*  */

  function on (el, dir) {
    if ( dir.modifiers) {
      warn("v-on without argument does not support modifiers.");
    }
    el.wrapListeners = function (code) { return ("_g(" + code + "," + (dir.value) + ")"); };
  }

  /*  */

  function bind (el, dir) {
    el.wrapData = function (code) {
      return ("_b(" + code + ",'" + (el.tag) + "'," + (dir.value) + "," + (dir.modifiers && dir.modifiers.prop ? 'true' : 'false') + (dir.modifiers && dir.modifiers.sync ? ',true' : '') + ")")
    };
  }

  /*  */

  var baseDirectives = {
    on: on,
    bind: bind,
    cloak: noop
  };

  /*  */





  var CodegenState = function CodegenState (options) {
    this.options = options;
    this.warn = options.warn || baseWarn;
    this.transforms = pluckModuleFunction(options.modules, 'transformCode');
    this.dataGenFns = pluckModuleFunction(options.modules, 'genData');
    this.directives = extend(extend({}, baseDirectives), options.directives);
    var isReservedTag = options.isReservedTag || no;
    this.maybeComponent = function (el) { return !!el.component || !isReservedTag(el.tag); };
    this.onceId = 0;
    this.staticRenderFns = [];
    this.pre = false;
  };



  function generate (
    ast,
    options
  ) {
    var state = new CodegenState(options);
    // fix #11483, Root level <script> tags should not be rendered.
    var code = ast ? (ast.tag === 'script' ? 'null' : genElement(ast, state)) : '_c("div")';
    return {
      render: ("with(this){return " + code + "}"),
      staticRenderFns: state.staticRenderFns
    }
  }

  function genElement (el, state) {
    if (el.parent) {
      el.pre = el.pre || el.parent.pre;
    }

    if (el.staticRoot && !el.staticProcessed) {
      return genStatic(el, state)
    } else if (el.once && !el.onceProcessed) {
      return genOnce(el, state)
    } else if (el.for && !el.forProcessed) {
      return genFor(el, state)
    } else if (el.if && !el.ifProcessed) {
      return genIf(el, state)
    } else if (el.tag === 'template' && !el.slotTarget && !state.pre) {
      return genChildren(el, state) || 'void 0'
    } else if (el.tag === 'slot') {
      return genSlot(el, state)
    } else {
      // component or element
      var code;
      if (el.component) {
        code = genComponent(el.component, el, state);
      } else {
        var data;
        if (!el.plain || (el.pre && state.maybeComponent(el))) {
          data = genData$2(el, state);
        }

        var children = el.inlineTemplate ? null : genChildren(el, state, true);
        code = "_c('" + (el.tag) + "'" + (data ? ("," + data) : '') + (children ? ("," + children) : '') + ")";
      }
      // module transforms
      for (var i = 0; i < state.transforms.length; i++) {
        code = state.transforms[i](el, code);
      }
      return code
    }
  }

  // hoist static sub-trees out
  function genStatic (el, state) {
    el.staticProcessed = true;
    // Some elements (templates) need to behave differently inside of a v-pre
    // node.  All pre nodes are static roots, so we can use this as a location to
    // wrap a state change and reset it upon exiting the pre node.
    var originalPreState = state.pre;
    if (el.pre) {
      state.pre = el.pre;
    }
    state.staticRenderFns.push(("with(this){return " + (genElement(el, state)) + "}"));
    state.pre = originalPreState;
    return ("_m(" + (state.staticRenderFns.length - 1) + (el.staticInFor ? ',true' : '') + ")")
  }

  // v-once
  function genOnce (el, state) {
    el.onceProcessed = true;
    if (el.if && !el.ifProcessed) {
      return genIf(el, state)
    } else if (el.staticInFor) {
      var key = '';
      var parent = el.parent;
      while (parent) {
        if (parent.for) {
          key = parent.key;
          break
        }
        parent = parent.parent;
      }
      if (!key) {
         state.warn(
          "v-once can only be used inside v-for that is keyed. ",
          el.rawAttrsMap['v-once']
        );
        return genElement(el, state)
      }
      return ("_o(" + (genElement(el, state)) + "," + (state.onceId++) + "," + key + ")")
    } else {
      return genStatic(el, state)
    }
  }

  function genIf (
    el,
    state,
    altGen,
    altEmpty
  ) {
    el.ifProcessed = true; // avoid recursion
    return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty)
  }

  function genIfConditions (
    conditions,
    state,
    altGen,
    altEmpty
  ) {
    if (!conditions.length) {
      return altEmpty || '_e()'
    }

    var condition = conditions.shift();
    if (condition.exp) {
      return ("(" + (condition.exp) + ")?" + (genTernaryExp(condition.block)) + ":" + (genIfConditions(conditions, state, altGen, altEmpty)))
    } else {
      return ("" + (genTernaryExp(condition.block)))
    }

    // v-if with v-once should generate code like (a)?_m(0):_m(1)
    function genTernaryExp (el) {
      return altGen
        ? altGen(el, state)
        : el.once
          ? genOnce(el, state)
          : genElement(el, state)
    }
  }

  function genFor (
    el,
    state,
    altGen,
    altHelper
  ) {
    var exp = el.for;
    var alias = el.alias;
    var iterator1 = el.iterator1 ? ("," + (el.iterator1)) : '';
    var iterator2 = el.iterator2 ? ("," + (el.iterator2)) : '';

    if (
      state.maybeComponent(el) &&
      el.tag !== 'slot' &&
      el.tag !== 'template' &&
      !el.key
    ) {
      state.warn(
        "<" + (el.tag) + " v-for=\"" + alias + " in " + exp + "\">: component lists rendered with " +
        "v-for should have explicit keys. " +
        "See https://vuejs.org/guide/list.html#key for more info.",
        el.rawAttrsMap['v-for'],
        true /* tip */
      );
    }

    el.forProcessed = true; // avoid recursion
    return (altHelper || '_l') + "((" + exp + ")," +
      "function(" + alias + iterator1 + iterator2 + "){" +
        "return " + ((altGen || genElement)(el, state)) +
      '})'
  }

  function genData$2 (el, state) {
    var data = '{';

    // directives first.
    // directives may mutate the el's other properties before they are generated.
    var dirs = genDirectives(el, state);
    if (dirs) { data += dirs + ','; }

    // key
    if (el.key) {
      data += "key:" + (el.key) + ",";
    }
    // ref
    if (el.ref) {
      data += "ref:" + (el.ref) + ",";
    }
    if (el.refInFor) {
      data += "refInFor:true,";
    }
    // pre
    if (el.pre) {
      data += "pre:true,";
    }
    // record original tag name for components using "is" attribute
    if (el.component) {
      data += "tag:\"" + (el.tag) + "\",";
    }
    // module data generation functions
    for (var i = 0; i < state.dataGenFns.length; i++) {
      data += state.dataGenFns[i](el);
    }
    // attributes
    if (el.attrs) {
      data += "attrs:" + (genProps(el.attrs)) + ",";
    }
    // DOM props
    if (el.props) {
      data += "domProps:" + (genProps(el.props)) + ",";
    }
    // event handlers
    if (el.events) {
      data += (genHandlers(el.events, false)) + ",";
    }
    if (el.nativeEvents) {
      data += (genHandlers(el.nativeEvents, true)) + ",";
    }
    // slot target
    // only for non-scoped slots
    if (el.slotTarget && !el.slotScope) {
      data += "slot:" + (el.slotTarget) + ",";
    }
    // scoped slots
    if (el.scopedSlots) {
      data += (genScopedSlots(el, el.scopedSlots, state)) + ",";
    }
    // component v-model
    if (el.model) {
      data += "model:{value:" + (el.model.value) + ",callback:" + (el.model.callback) + ",expression:" + (el.model.expression) + "},";
    }
    // inline-template
    if (el.inlineTemplate) {
      var inlineTemplate = genInlineTemplate(el, state);
      if (inlineTemplate) {
        data += inlineTemplate + ",";
      }
    }
    data = data.replace(/,$/, '') + '}';
    // v-bind dynamic argument wrap
    // v-bind with dynamic arguments must be applied using the same v-bind object
    // merge helper so that class/style/mustUseProp attrs are handled correctly.
    if (el.dynamicAttrs) {
      data = "_b(" + data + ",\"" + (el.tag) + "\"," + (genProps(el.dynamicAttrs)) + ")";
    }
    // v-bind data wrap
    if (el.wrapData) {
      data = el.wrapData(data);
    }
    // v-on data wrap
    if (el.wrapListeners) {
      data = el.wrapListeners(data);
    }
    return data
  }
  // 生成指令对应的字符串代码
  function genDirectives (el, state) {
    var dirs = el.directives;
    if (!dirs) { return }
    var res = 'directives:[';
    var hasRuntime = false;
    var i, l, dir, needRuntime;
    for (i = 0, l = dirs.length; i < l; i++) {
      dir = dirs[i];
      needRuntime = true;
      var gen = state.directives[dir.name];
      if (gen) {
        // compile-time directive that manipulates AST.
        // returns true if it also needs a runtime counterpart.
        needRuntime = !!gen(el, dir, state.warn);
      }
      if (needRuntime) {
        hasRuntime = true;
        res += "{name:\"" + (dir.name) + "\",rawName:\"" + (dir.rawName) + "\"" + (dir.value ? (",value:(" + (dir.value) + "),expression:" + (JSON.stringify(dir.value))) : '') + (dir.arg ? (",arg:" + (dir.isDynamicArg ? dir.arg : ("\"" + (dir.arg) + "\""))) : '') + (dir.modifiers ? (",modifiers:" + (JSON.stringify(dir.modifiers))) : '') + "},";
      }
    }
    if (hasRuntime) {
      return res.slice(0, -1) + ']'
    }
  }

  function genInlineTemplate (el, state) {
    var ast = el.children[0];
    if ( (
      el.children.length !== 1 || ast.type !== 1
    )) {
      state.warn(
        'Inline-template components must have exactly one child element.',
        { start: el.start }
      );
    }
    if (ast && ast.type === 1) {
      var inlineRenderFns = generate(ast, state.options);
      return ("inlineTemplate:{render:function(){" + (inlineRenderFns.render) + "},staticRenderFns:[" + (inlineRenderFns.staticRenderFns.map(function (code) { return ("function(){" + code + "}"); }).join(',')) + "]}")
    }
  }

  function genScopedSlots (
    el,
    slots,
    state
  ) {
    // by default scoped slots are considered "stable", this allows child
    // components with only scoped slots to skip forced updates from parent.
    // but in some cases we have to bail-out of this optimization
    // for example if the slot contains dynamic names, has v-if or v-for on them...
    var needsForceUpdate = el.for || Object.keys(slots).some(function (key) {
      var slot = slots[key];
      return (
        slot.slotTargetDynamic ||
        slot.if ||
        slot.for ||
        containsSlotChild(slot) // is passing down slot from parent which may be dynamic
      )
    });

    // #9534: if a component with scoped slots is inside a conditional branch,
    // it's possible for the same component to be reused but with different
    // compiled slot content. To avoid that, we generate a unique key based on
    // the generated code of all the slot contents.
    var needsKey = !!el.if;

    // OR when it is inside another scoped slot or v-for (the reactivity may be
    // disconnected due to the intermediate scope variable)
    // #9438, #9506
    // TODO: this can be further optimized by properly analyzing in-scope bindings
    // and skip force updating ones that do not actually use scope variables.
    if (!needsForceUpdate) {
      var parent = el.parent;
      while (parent) {
        if (
          (parent.slotScope && parent.slotScope !== emptySlotScopeToken) ||
          parent.for
        ) {
          needsForceUpdate = true;
          break
        }
        if (parent.if) {
          needsKey = true;
        }
        parent = parent.parent;
      }
    }

    var generatedSlots = Object.keys(slots)
      .map(function (key) { return genScopedSlot(slots[key], state); })
      .join(',');

    return ("scopedSlots:_u([" + generatedSlots + "]" + (needsForceUpdate ? ",null,true" : "") + (!needsForceUpdate && needsKey ? (",null,false," + (hash(generatedSlots))) : "") + ")")
  }

  function hash(str) {
    var hash = 5381;
    var i = str.length;
    while(i) {
      hash = (hash * 33) ^ str.charCodeAt(--i);
    }
    return hash >>> 0
  }

  function containsSlotChild (el) {
    if (el.type === 1) {
      if (el.tag === 'slot') {
        return true
      }
      return el.children.some(containsSlotChild)
    }
    return false
  }

  function genScopedSlot (
    el,
    state
  ) {
    var isLegacySyntax = el.attrsMap['slot-scope'];
    if (el.if && !el.ifProcessed && !isLegacySyntax) {
      return genIf(el, state, genScopedSlot, "null")
    }
    if (el.for && !el.forProcessed) {
      return genFor(el, state, genScopedSlot)
    }
    var slotScope = el.slotScope === emptySlotScopeToken
      ? ""
      : String(el.slotScope);
    var fn = "function(" + slotScope + "){" +
      "return " + (el.tag === 'template'
        ? el.if && isLegacySyntax
          ? ("(" + (el.if) + ")?" + (genChildren(el, state) || 'undefined') + ":undefined")
          : genChildren(el, state) || 'undefined'
        : genElement(el, state)) + "}";
    // reverse proxy v-slot without scope on this.$slots
    var reverseProxy = slotScope ? "" : ",proxy:true";
    return ("{key:" + (el.slotTarget || "\"default\"") + ",fn:" + fn + reverseProxy + "}")
  }

  function genChildren (
    el,
    state,
    checkSkip,
    altGenElement,
    altGenNode
  ) {
    var children = el.children;
    if (children.length) {
      var el$1 = children[0];
      // optimize single v-for
      if (children.length === 1 &&
        el$1.for &&
        el$1.tag !== 'template' &&
        el$1.tag !== 'slot'
      ) {
        var normalizationType = checkSkip
          ? state.maybeComponent(el$1) ? ",1" : ",0"
          : "";
        return ("" + ((altGenElement || genElement)(el$1, state)) + normalizationType)
      }
      var normalizationType$1 = checkSkip
        ? getNormalizationType(children, state.maybeComponent)
        : 0;
      var gen = altGenNode || genNode;
      return ("[" + (children.map(function (c) { return gen(c, state); }).join(',')) + "]" + (normalizationType$1 ? ("," + normalizationType$1) : ''))
    }
  }

  // determine the normalization needed for the children array.
  // 0: no normalization needed
  // 1: simple normalization needed (possible 1-level deep nested array)
  // 2: full normalization needed
  function getNormalizationType (
    children,
    maybeComponent
  ) {
    var res = 0;
    for (var i = 0; i < children.length; i++) {
      var el = children[i];
      if (el.type !== 1) {
        continue
      }
      if (needsNormalization(el) ||
          (el.ifConditions && el.ifConditions.some(function (c) { return needsNormalization(c.block); }))) {
        res = 2;
        break
      }
      if (maybeComponent(el) ||
          (el.ifConditions && el.ifConditions.some(function (c) { return maybeComponent(c.block); }))) {
        res = 1;
      }
    }
    return res
  }

  function needsNormalization (el) {
    return el.for !== undefined || el.tag === 'template' || el.tag === 'slot'
  }

  function genNode (node, state) {
    if (node.type === 1) {
      return genElement(node, state)
    } else if (node.type === 3 && node.isComment) {
      return genComment(node)
    } else {
      return genText(node)
    }
  }

  function genText (text) {
    return ("_v(" + (text.type === 2
      ? text.expression // no need for () because already wrapped in _s()
      : transformSpecialNewlines(JSON.stringify(text.text))) + ")")
  }

  function genComment (comment) {
    return ("_e(" + (JSON.stringify(comment.text)) + ")")
  }

  function genSlot (el, state) {
    var slotName = el.slotName || '"default"';
    var children = genChildren(el, state);
    var res = "_t(" + slotName + (children ? (",function(){return " + children + "}") : '');
    var attrs = el.attrs || el.dynamicAttrs
      ? genProps((el.attrs || []).concat(el.dynamicAttrs || []).map(function (attr) { return ({
          // slot props are camelized
          name: camelize(attr.name),
          value: attr.value,
          dynamic: attr.dynamic
        }); }))
      : null;
    var bind = el.attrsMap['v-bind'];
    if ((attrs || bind) && !children) {
      res += ",null";
    }
    if (attrs) {
      res += "," + attrs;
    }
    if (bind) {
      res += (attrs ? '' : ',null') + "," + bind;
    }
    return res + ')'
  }

  // componentName is el.component, take it as argument to shun flow's pessimistic refinement
  function genComponent (
    componentName,
    el,
    state
  ) {
    var children = el.inlineTemplate ? null : genChildren(el, state, true);
    return ("_c(" + componentName + "," + (genData$2(el, state)) + (children ? ("," + children) : '') + ")")
  }

  function genProps (props) {
    var staticProps = "";
    var dynamicProps = "";
    for (var i = 0; i < props.length; i++) {
      var prop = props[i];
      var value =  transformSpecialNewlines(prop.value);
      if (prop.dynamic) {
        dynamicProps += (prop.name) + "," + value + ",";
      } else {
        staticProps += "\"" + (prop.name) + "\":" + value + ",";
      }
    }
    staticProps = "{" + (staticProps.slice(0, -1)) + "}";
    if (dynamicProps) {
      return ("_d(" + staticProps + ",[" + (dynamicProps.slice(0, -1)) + "])")
    } else {
      return staticProps
    }
  }

  // #3895, #4268
  function transformSpecialNewlines (text) {
    return text
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029')
  }

  /*  */




  var plainStringRE = /^"(?:[^"\\]|\\.)*"$|^'(?:[^'\\]|\\.)*'$/;

  // let the model AST transform translate v-model into appropriate
  // props bindings
  function applyModelTransform (el, state) {
    if (el.directives) {
      for (var i = 0; i < el.directives.length; i++) {
        var dir = el.directives[i];
        if (dir.name === 'model') {
          state.directives.model(el, dir, state.warn);
          // remove value for textarea as its converted to text
          if (el.tag === 'textarea' && el.props) {
            el.props = el.props.filter(function (p) { return p.name !== 'value'; });
          }
          break
        }
      }
    }
  }

  function genAttrSegments (
    attrs
  ) {
    return attrs.map(function (ref) {
      var name = ref.name;
      var value = ref.value;

      return genAttrSegment(name, value);
    })
  }

  function genDOMPropSegments (
    props,
    attrs
  ) {
    var segments = [];
    props.forEach(function (ref) {
      var name = ref.name;
      var value = ref.value;

      name = propsToAttrMap[name] || name.toLowerCase();
      if (isRenderableAttr(name) &&
        !(attrs && attrs.some(function (a) { return a.name === name; }))
      ) {
        segments.push(genAttrSegment(name, value));
      }
    });
    return segments
  }

  function genAttrSegment (name, value) {
    if (plainStringRE.test(value)) {
      // force double quote
      value = value.replace(/^'|'$/g, '"');
      // force enumerated attr to "true"
      if (isEnumeratedAttr(name) && value !== "\"false\"") {
        value = "\"true\"";
      }
      return {
        type: RAW,
        value: isBooleanAttr(name)
          ? (" " + name + "=\"" + name + "\"")
          : value === '""'
            ? (" " + name)
            : (" " + name + "=\"" + (JSON.parse(value)) + "\"")
      }
    } else {
      return {
        type: EXPRESSION,
        value: ("_ssrAttr(" + (JSON.stringify(name)) + "," + value + ")")
      }
    }
  }

  function genClassSegments (
    staticClass,
    classBinding
  ) {
    if (staticClass && !classBinding) {
      return [{ type: RAW, value: (" class=\"" + (JSON.parse(staticClass)) + "\"") }]
    } else {
      return [{
        type: EXPRESSION,
        value: ("_ssrClass(" + (staticClass || 'null') + "," + (classBinding || 'null') + ")")
      }]
    }
  }

  function genStyleSegments (
    staticStyle,
    parsedStaticStyle,
    styleBinding,
    vShowExpression
  ) {
    if (staticStyle && !styleBinding && !vShowExpression) {
      return [{ type: RAW, value: (" style=" + (JSON.stringify(staticStyle))) }]
    } else {
      return [{
        type: EXPRESSION,
        value: ("_ssrStyle(" + (parsedStaticStyle || 'null') + "," + (styleBinding || 'null') + ", " + (vShowExpression
            ? ("{ display: (" + vShowExpression + ") ? '' : 'none' }")
            : 'null') + ")")
      }]
    }
  }

  /*  */

  // optimizability constants
  var optimizability = {
    FALSE: 0,    // whole sub tree un-optimizable
    FULL: 1,     // whole sub tree optimizable
    SELF: 2,     // self optimizable but has some un-optimizable children
    CHILDREN: 3, // self un-optimizable but have fully optimizable children
    PARTIAL: 4   // self un-optimizable with some un-optimizable children
  };

  var isPlatformReservedTag;

  function optimize (root, options) {
    if (!root) { return }
    isPlatformReservedTag = options.isReservedTag || no;
    walk(root, true);
  }

  function walk (node, isRoot) {
    if (isUnOptimizableTree(node)) {
      node.ssrOptimizability = optimizability.FALSE;
      return
    }
    // root node or nodes with custom directives should always be a VNode
    var selfUnoptimizable = isRoot || hasCustomDirective(node);
    var check = function (child) {
      if (child.ssrOptimizability !== optimizability.FULL) {
        node.ssrOptimizability = selfUnoptimizable
          ? optimizability.PARTIAL
          : optimizability.SELF;
      }
    };
    if (selfUnoptimizable) {
      node.ssrOptimizability = optimizability.CHILDREN;
    }
    if (node.type === 1) {
      for (var i = 0, l = node.children.length; i < l; i++) {
        var child = node.children[i];
        walk(child);
        check(child);
      }
      if (node.ifConditions) {
        for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
          var block = node.ifConditions[i$1].block;
          walk(block, isRoot);
          check(block);
        }
      }
      if (node.ssrOptimizability == null ||
        (!isRoot && (node.attrsMap['v-html'] || node.attrsMap['v-text']))
      ) {
        node.ssrOptimizability = optimizability.FULL;
      } else {
        node.children = optimizeSiblings(node);
      }
    } else {
      node.ssrOptimizability = optimizability.FULL;
    }
  }

  function optimizeSiblings (el) {
    var children = el.children;
    var optimizedChildren = [];

    var currentOptimizableGroup = [];
    var pushGroup = function () {
      if (currentOptimizableGroup.length) {
        optimizedChildren.push({
          type: 1,
          parent: el,
          tag: 'template',
          attrsList: [],
          attrsMap: {},
          rawAttrsMap: {},
          children: currentOptimizableGroup,
          ssrOptimizability: optimizability.FULL
        });
      }
      currentOptimizableGroup = [];
    };

    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (c.ssrOptimizability === optimizability.FULL) {
        currentOptimizableGroup.push(c);
      } else {
        // wrap fully-optimizable adjacent siblings inside a template tag
        // so that they can be optimized into a single ssrNode by codegen
        pushGroup();
        optimizedChildren.push(c);
      }
    }
    pushGroup();
    return optimizedChildren
  }

  function isUnOptimizableTree (node) {
    if (node.type === 2 || node.type === 3) { // text or expression
      return false
    }
    return (
      isBuiltInTag(node.tag) || // built-in (slot, component)
      !isPlatformReservedTag(node.tag) || // custom component
      !!node.component || // "is" component
      isSelectWithModel(node) // <select v-model> requires runtime inspection
    )
  }

  var isBuiltInDir = makeMap('text,html,show,on,bind,model,pre,cloak,once');

  function hasCustomDirective (node) {
    return (
      node.type === 1 &&
      node.directives &&
      node.directives.some(function (d) { return !isBuiltInDir(d.name); })
    )
  }

  // <select v-model> cannot be optimized because it requires a runtime check
  // to determine proper selected option
  function isSelectWithModel (node) {
    return (
      node.type === 1 &&
      node.tag === 'select' &&
      node.directives != null &&
      node.directives.some(function (d) { return d.name === 'model'; })
    )
  }

  /*  */




  // segment types
  var RAW = 0;
  var INTERPOLATION = 1;
  var EXPRESSION = 2;

  function generate$1 (
    ast,
    options
  ) {
    var state = new CodegenState(options);
    var code = ast ? genSSRElement(ast, state) : '_c("div")';
    return {
      render: ("with(this){return " + code + "}"),
      staticRenderFns: state.staticRenderFns
    }
  }

  function genSSRElement (el, state) {
    if (el.for && !el.forProcessed) {
      return genFor(el, state, genSSRElement)
    } else if (el.if && !el.ifProcessed) {
      return genIf(el, state, genSSRElement)
    } else if (el.tag === 'template' && !el.slotTarget) {
      return el.ssrOptimizability === optimizability.FULL
        ? genChildrenAsStringNode(el, state)
        : genSSRChildren(el, state) || 'void 0'
    }

    switch (el.ssrOptimizability) {
      case optimizability.FULL:
        // stringify whole tree
        return genStringElement(el, state)
      case optimizability.SELF:
        // stringify self and check children
        return genStringElementWithChildren(el, state)
      case optimizability.CHILDREN:
        // generate self as VNode and stringify children
        return genNormalElement(el, state, true)
      case optimizability.PARTIAL:
        // generate self as VNode and check children
        return genNormalElement(el, state, false)
      default:
        // bail whole tree
        return genElement(el, state)
    }
  }

  function genNormalElement (el, state, stringifyChildren) {
    var data = el.plain ? undefined : genData$2(el, state);
    var children = stringifyChildren
      ? ("[" + (genChildrenAsStringNode(el, state)) + "]")
      : genSSRChildren(el, state, true);
    return ("_c('" + (el.tag) + "'" + (data ? ("," + data) : '') + (children ? ("," + children) : '') + ")")
  }

  function genSSRChildren (el, state, checkSkip) {
    return genChildren(el, state, checkSkip, genSSRElement, genSSRNode)
  }

  function genSSRNode (el, state) {
    return el.type === 1
      ? genSSRElement(el, state)
      : genText(el)
  }

  function genChildrenAsStringNode (el, state) {
    return el.children.length
      ? ("_ssrNode(" + (flattenSegments(childrenToSegments(el, state))) + ")")
      : ''
  }

  function genStringElement (el, state) {
    return ("_ssrNode(" + (elementToString(el, state)) + ")")
  }

  function genStringElementWithChildren (el, state) {
    var children = genSSRChildren(el, state, true);
    return ("_ssrNode(" + (flattenSegments(elementToOpenTagSegments(el, state))) + ",\"</" + (el.tag) + ">\"" + (children ? ("," + children) : '') + ")")
  }

  function elementToString (el, state) {
    return ("(" + (flattenSegments(elementToSegments(el, state))) + ")")
  }

  function elementToSegments (el, state) {
    // v-for / v-if
    if (el.for && !el.forProcessed) {
      el.forProcessed = true;
      return [{
        type: EXPRESSION,
        value: genFor(el, state, elementToString, '_ssrList')
      }]
    } else if (el.if && !el.ifProcessed) {
      el.ifProcessed = true;
      return [{
        type: EXPRESSION,
        value: genIf(el, state, elementToString, '"<!---->"')
      }]
    } else if (el.tag === 'template') {
      return childrenToSegments(el, state)
    }

    var openSegments = elementToOpenTagSegments(el, state);
    var childrenSegments = childrenToSegments(el, state);
    var ref = state.options;
    var isUnaryTag = ref.isUnaryTag;
    var close = (isUnaryTag && isUnaryTag(el.tag))
      ? []
      : [{ type: RAW, value: ("</" + (el.tag) + ">") }];
    return openSegments.concat(childrenSegments, close)
  }

  function elementToOpenTagSegments (el, state) {
    applyModelTransform(el, state);
    var binding;
    var segments = [{ type: RAW, value: ("<" + (el.tag)) }];
    // attrs
    if (el.attrs) {
      segments.push.apply(segments, genAttrSegments(el.attrs));
    }
    // domProps
    if (el.props) {
      segments.push.apply(segments, genDOMPropSegments(el.props, el.attrs));
    }
    // v-bind="object"
    if ((binding = el.attrsMap['v-bind'])) {
      segments.push({ type: EXPRESSION, value: ("_ssrAttrs(" + binding + ")") });
    }
    // v-bind.prop="object"
    if ((binding = el.attrsMap['v-bind.prop'])) {
      segments.push({ type: EXPRESSION, value: ("_ssrDOMProps(" + binding + ")") });
    }
    // class
    if (el.staticClass || el.classBinding) {
      segments.push.apply(
        segments,
        genClassSegments(el.staticClass, el.classBinding)
      );
    }
    // style & v-show
    if (el.staticStyle || el.styleBinding || el.attrsMap['v-show']) {
      segments.push.apply(
        segments,
        genStyleSegments(
          el.attrsMap.style,
          el.staticStyle,
          el.styleBinding,
          el.attrsMap['v-show']
        )
      );
    }
    // _scopedId
    if (state.options.scopeId) {
      segments.push({ type: RAW, value: (" " + (state.options.scopeId)) });
    }
    segments.push({ type: RAW, value: ">" });
    return segments
  }

  function childrenToSegments (el, state) {
    var binding;
    if ((binding = el.attrsMap['v-html'])) {
      return [{ type: EXPRESSION, value: ("_s(" + binding + ")") }]
    }
    if ((binding = el.attrsMap['v-text'])) {
      return [{ type: INTERPOLATION, value: ("_s(" + binding + ")") }]
    }
    if (el.tag === 'textarea' && (binding = el.attrsMap['v-model'])) {
      return [{ type: INTERPOLATION, value: ("_s(" + binding + ")") }]
    }
    return el.children
      ? nodesToSegments(el.children, state)
      : []
  }

  function nodesToSegments (
    children,
    state
  ) {
    var segments = [];
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (c.type === 1) {
        segments.push.apply(segments, elementToSegments(c, state));
      } else if (c.type === 2) {
        segments.push({ type: INTERPOLATION, value: c.expression });
      } else if (c.type === 3) {
        var text = escape(c.text);
        if (c.isComment) {
          text = '<!--' + text + '-->';
        }
        segments.push({ type: RAW, value: text });
      }
    }
    return segments
  }

  function flattenSegments (segments) {
    var mergedSegments = [];
    var textBuffer = '';

    var pushBuffer = function () {
      if (textBuffer) {
        mergedSegments.push(JSON.stringify(textBuffer));
        textBuffer = '';
      }
    };

    for (var i = 0; i < segments.length; i++) {
      var s = segments[i];
      if (s.type === RAW) {
        textBuffer += s.value;
      } else if (s.type === INTERPOLATION) {
        pushBuffer();
        mergedSegments.push(("_ssrEscape(" + (s.value) + ")"));
      } else if (s.type === EXPRESSION) {
        pushBuffer();
        mergedSegments.push(("(" + (s.value) + ")"));
      }
    }
    pushBuffer();

    return mergedSegments.join('+')
  }

  /*  */



  // these keywords should not appear inside expressions, but operators like
  // typeof, instanceof and in are allowed
  var prohibitedKeywordRE = new RegExp('\\b' + (
    'do,if,for,let,new,try,var,case,else,with,await,break,catch,class,const,' +
    'super,throw,while,yield,delete,export,import,return,switch,default,' +
    'extends,finally,continue,debugger,function,arguments'
  ).split(',').join('\\b|\\b') + '\\b');

  // these unary operators should not be used as property/method names
  var unaryOperatorsRE = new RegExp('\\b' + (
    'delete,typeof,void'
  ).split(',').join('\\s*\\([^\\)]*\\)|\\b') + '\\s*\\([^\\)]*\\)');

  // strip strings in expressions
  var stripStringRE = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`/g;

  // detect problematic expressions in a template
  function detectErrors (ast, warn) {
    if (ast) {
      checkNode(ast, warn);
    }
  }

  function checkNode (node, warn) {
    if (node.type === 1) {
      for (var name in node.attrsMap) {
        if (dirRE.test(name)) {
          var value = node.attrsMap[name];
          if (value) {
            var range = node.rawAttrsMap[name];
            if (name === 'v-for') {
              checkFor(node, ("v-for=\"" + value + "\""), warn, range);
            } else if (name === 'v-slot' || name[0] === '#') {
              checkFunctionParameterExpression(value, (name + "=\"" + value + "\""), warn, range);
            } else if (onRE.test(name)) {
              checkEvent(value, (name + "=\"" + value + "\""), warn, range);
            } else {
              checkExpression(value, (name + "=\"" + value + "\""), warn, range);
            }
          }
        }
      }
      if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
          checkNode(node.children[i], warn);
        }
      }
    } else if (node.type === 2) {
      checkExpression(node.expression, node.text, warn, node);
    }
  }

  function checkEvent (exp, text, warn, range) {
    var stripped = exp.replace(stripStringRE, '');
    var keywordMatch = stripped.match(unaryOperatorsRE);
    if (keywordMatch && stripped.charAt(keywordMatch.index - 1) !== '$') {
      warn(
        "avoid using JavaScript unary operator as property name: " +
        "\"" + (keywordMatch[0]) + "\" in expression " + (text.trim()),
        range
      );
    }
    checkExpression(exp, text, warn, range);
  }

  function checkFor (node, text, warn, range) {
    checkExpression(node.for || '', text, warn, range);
    checkIdentifier(node.alias, 'v-for alias', text, warn, range);
    checkIdentifier(node.iterator1, 'v-for iterator', text, warn, range);
    checkIdentifier(node.iterator2, 'v-for iterator', text, warn, range);
  }

  function checkIdentifier (
    ident,
    type,
    text,
    warn,
    range
  ) {
    if (typeof ident === 'string') {
      try {
        new Function(("var " + ident + "=_"));
      } catch (e) {
        warn(("invalid " + type + " \"" + ident + "\" in expression: " + (text.trim())), range);
      }
    }
  }

  function checkExpression (exp, text, warn, range) {
    try {
      new Function(("return " + exp));
    } catch (e) {
      var keywordMatch = exp.replace(stripStringRE, '').match(prohibitedKeywordRE);
      if (keywordMatch) {
        warn(
          "avoid using JavaScript keyword as property name: " +
          "\"" + (keywordMatch[0]) + "\"\n  Raw expression: " + (text.trim()),
          range
        );
      } else {
        warn(
          "invalid expression: " + (e.message) + " in\n\n" +
          "    " + exp + "\n\n" +
          "  Raw expression: " + (text.trim()) + "\n",
          range
        );
      }
    }
  }

  function checkFunctionParameterExpression (exp, text, warn, range) {
    try {
      new Function(exp, '');
    } catch (e) {
      warn(
        "invalid function parameter expression: " + (e.message) + " in\n\n" +
        "    " + exp + "\n\n" +
        "  Raw expression: " + (text.trim()) + "\n",
        range
      );
    }
  }

  /*  */

  var range = 2;

  function generateCodeFrame (
    source,
    start,
    end
  ) {
    if ( start === void 0 ) start = 0;
    if ( end === void 0 ) end = source.length;

    var lines = source.split(/\r?\n/);
    var count = 0;
    var res = [];
    for (var i = 0; i < lines.length; i++) {
      count += lines[i].length + 1;
      if (count >= start) {
        for (var j = i - range; j <= i + range || end > count; j++) {
          if (j < 0 || j >= lines.length) { continue }
          res.push(("" + (j + 1) + (repeat$1(" ", 3 - String(j + 1).length)) + "|  " + (lines[j])));
          var lineLength = lines[j].length;
          if (j === i) {
            // push underline
            var pad = start - (count - lineLength) + 1;
            var length = end > count ? lineLength - pad : end - start;
            res.push("   |  " + repeat$1(" ", pad) + repeat$1("^", length));
          } else if (j > i) {
            if (end > count) {
              var length$1 = Math.min(end - count, lineLength);
              res.push("   |  " + repeat$1("^", length$1));
            }
            count += lineLength + 1;
          }
        }
        break
      }
    }
    return res.join('\n')
  }

  function repeat$1 (str, n) {
    var result = '';
    if (n > 0) {
      while (true) { // eslint-disable-line
        if (n & 1) { result += str; }
        n >>>= 1;
        if (n <= 0) { break }
        str += str;
      }
    }
    return result
  }

  /*  */


  // 字符串转函数
  function createFunction (code, errors) {
    try {
      return new Function(code)
    } catch (err) {
      errors.push({ err: err, code: code });
      return noop
    }
  }

  function createCompileToFunctionFn (compile) {
    var cache = Object.create(null);

    return function compileToFunctions (
      template,
      options,
      vm
    ) {
      options = extend({}, options);
      var warn$1 = options.warn || warn;
      delete options.warn;

      /* istanbul ignore if */
      {
        // detect possible CSP restriction
        try {
          new Function('return 1');
        } catch (e) {
          if (e.toString().match(/unsafe-eval|CSP/)) {
            warn$1(
              'It seems you are using the standalone build of Vue.js in an ' +
              'environment with Content Security Policy that prohibits unsafe-eval. ' +
              'The template compiler cannot work in this environment. Consider ' +
              'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
              'templates into render functions.'
            );
          }
        }
      }

      // check cache
      var key = options.delimiters
        ? String(options.delimiters) + template
        : template;
      if (cache[key]) {
        return cache[key]
      }

      // compile
      var compiled = compile(template, options);

      // check compilation errors/tips
      {
        if (compiled.errors && compiled.errors.length) {
          if (options.outputSourceRange) {
            compiled.errors.forEach(function (e) {
              warn$1(
                "Error compiling template:\n\n" + (e.msg) + "\n\n" +
                generateCodeFrame(template, e.start, e.end),
                vm
              );
            });
          } else {
            warn$1(
              "Error compiling template:\n\n" + template + "\n\n" +
              compiled.errors.map(function (e) { return ("- " + e); }).join('\n') + '\n',
              vm
            );
          }
        }
        if (compiled.tips && compiled.tips.length) {
          if (options.outputSourceRange) {
            compiled.tips.forEach(function (e) { return tip(e.msg, vm); });
          } else {
            compiled.tips.forEach(function (msg) { return tip(msg, vm); });
          }
        }
      }

      // turn code into functions
      var res = {};
      var fnGenErrors = [];
      res.render = createFunction(compiled.render, fnGenErrors);
      res.staticRenderFns = compiled.staticRenderFns.map(function (code) {
        return createFunction(code, fnGenErrors)
      });

      // check function generation errors.
      // this should only happen if there is a bug in the compiler itself.
      // mostly for codegen development use
      /* istanbul ignore if */
      {
        if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
          warn$1(
            "Failed to generate render function:\n\n" +
            fnGenErrors.map(function (ref) {
              var err = ref.err;
              var code = ref.code;

              return ((err.toString()) + " in\n\n" + code + "\n");
          }).join('\n'),
            vm
          );
        }
      }

      return (cache[key] = res)
    }
  }

  /*  */

  function createCompilerCreator (baseCompile) {
    return function createCompiler (baseOptions) {
      function compile (
        template,
        options
      ) {
        var finalOptions = Object.create(baseOptions);
        var errors = [];
        var tips = [];

        var warn = function (msg, range, tip) {
          (tip ? tips : errors).push(msg);
        };

        if (options) {
          if ( options.outputSourceRange) {
            // $flow-disable-line
            var leadingSpaceLength = template.match(/^\s*/)[0].length;

            warn = function (msg, range, tip) {
              var data = { msg: msg };
              if (range) {
                if (range.start != null) {
                  data.start = range.start + leadingSpaceLength;
                }
                if (range.end != null) {
                  data.end = range.end + leadingSpaceLength;
                }
              }
              (tip ? tips : errors).push(data);
            };
          }
          // merge custom modules
          if (options.modules) {
            finalOptions.modules =
              (baseOptions.modules || []).concat(options.modules);
          }
          // merge custom directives
          if (options.directives) {
            finalOptions.directives = extend(
              Object.create(baseOptions.directives || null),
              options.directives
            );
          }
          // copy other options
          for (var key in options) {
            if (key !== 'modules' && key !== 'directives') {
              finalOptions[key] = options[key];
            }
          }
        }

        finalOptions.warn = warn;

        var compiled = baseCompile(template.trim(), finalOptions);
        {
          detectErrors(compiled.ast, warn);
        }
        compiled.errors = errors;
        compiled.tips = tips;
        return compiled
      }

      return {
        compile: compile,
        compileToFunctions: createCompileToFunctionFn(compile)
      }
    }
  }

  /*  */

  var createCompiler = createCompilerCreator(function baseCompile (
    template,
    options
  ) {
    var ast = parse(template.trim(), options);
    optimize(ast, options);
    var code = generate$1(ast, options);
    return {
      ast: ast,
      render: code.render,
      staticRenderFns: code.staticRenderFns
    }
  });

  /*  */

  var ref = createCompiler(baseOptions);
  var compileToFunctions = ref.compileToFunctions;

  /*  */

  // The template compiler attempts to minimize the need for normalization by
  // statically analyzing the template at compile time.
  //
  // For plain HTML markup, normalization can be completely skipped because the
  // generated render function is guaranteed to return Array<VNode>. There are
  // two cases where extra normalization is needed:

  // 处理函数式组件作为子组件的情况
  // 1. When the children contains components - because a functional component
  // may return an Array instead of a single root. In this case, just a simple
  // normalization is needed - if any child is an Array, we flatten the whole
  // thing with Array.prototype.concat. It is guaranteed to be only 1-level deep
  // because functional components already normalize their own children.
  function simpleNormalizeChildren (children) {
    for (var i = 0; i < children.length; i++) {
      if (Array.isArray(children[i])) {
        return Array.prototype.concat.apply([], children)
      }
    }
    return children
  }

  // 2. When the children contains constructs that always generated nested Arrays,
  // e.g. <template>, <slot>, v-for, or when the children is provided by user
  // with hand-written render functions / JSX. In such cases a full normalization
  // is needed to cater to all possible types of children values.
  function normalizeChildren (children) {
    return isPrimitive(children)
      ? [createTextVNode(children)]
      : Array.isArray(children)
        ? normalizeArrayChildren(children)
        : undefined
  }
  // 是否是文本节点
  function isTextNode (node) {
    return isDef(node) && isDef(node.text) && isFalse(node.isComment)
  }
  // 处理v-slot或者v-for嵌套数组的情况
  function normalizeArrayChildren (children, nestedIndex) {
    var res = [];
    var i, c, lastIndex, last;
    for (i = 0; i < children.length; i++) {
      c = children[i]; // 当前节点
      // 布尔值跳过
      if (isUndef(c) || typeof c === 'boolean') { continue }
      lastIndex = res.length - 1;
      last = res[lastIndex]; // 规范好的最后一个节点
      // nested
      if (Array.isArray(c)) {
        if (c.length > 0) {
          c = normalizeArrayChildren(c, ((nestedIndex || '') + "_" + i));
          // merge adjacent text nodes
          // 如果遇到两个连续的text节点，则把他们合并成一个
          if (isTextNode(c[0]) && isTextNode(last)) {
            // 拼接到规范好的最后一个元素
            res[lastIndex] = createTextVNode(last.text + (c[0]).text);
            c.shift();
          }
          // 利用apply扁平化嵌套数组
          res.push.apply(res, c);
        }
      }
      // 原始值
      else if (isPrimitive(c)) {
        // 合并文本节点
        if (isTextNode(last)) {
          // merge adjacent text nodes
          // this is necessary for SSR hydration because text nodes are
          // essentially merged when rendered to HTML strings
          res[lastIndex] = createTextVNode(last.text + c);
        }
        else if (c !== '') {
          // convert primitive to vnode
          res.push(createTextVNode(c));
        }
      }
      else {
        // 合并文本节点
        if (isTextNode(c) && isTextNode(last)) {
          // merge adjacent text nodes
          res[lastIndex] = createTextVNode(last.text + c.text);
        }
        else {
          // default key for nested array children (likely generated by v-for)
          if (isTrue(children._isVList) &&
            isDef(c.tag) &&
            isUndef(c.key) &&
            isDef(nestedIndex)) {
            c.key = "__vlist" + nestedIndex + "_" + i + "__";
          }
          res.push(c);
        }
      }
    }
    return res
  }

  /*  */

  var ssrHelpers = {
    _ssrEscape: escape,
    _ssrNode: renderStringNode,
    _ssrList: renderStringList,
    _ssrAttr: renderAttr,
    _ssrAttrs: renderAttrs$1,
    _ssrDOMProps: renderDOMProps$1,
    _ssrClass: renderSSRClass,
    _ssrStyle: renderSSRStyle
  };

  function installSSRHelpers (vm) {
    if (vm._ssrNode) {
      return
    }
    var Vue = vm.constructor;
    while (Vue.super) {
      Vue = Vue.super;
    }
    extend(Vue.prototype, ssrHelpers);
    if (Vue.FunctionalRenderContext) {
      extend(Vue.FunctionalRenderContext.prototype, ssrHelpers);
    }
  }

  var StringNode = function StringNode (
    open,
    close,
    children,
    normalizationType
  ) {
    this.isString = true;
    this.open = open;
    this.close = close;
    if (children) {
      this.children = normalizationType === 1
        ? simpleNormalizeChildren(children)
        : normalizationType === 2
          ? normalizeChildren(children)
          : children;
    } else {
      this.children = void 0;
    }
  };

  function renderStringNode (
    open,
    close,
    children,
    normalizationType
  ) {
    return new StringNode(open, close, children, normalizationType)
  }

  function renderStringList (
    val,
    render
  ) {
    var ret = '';
    var i, l, keys, key;
    if (Array.isArray(val) || typeof val === 'string') {
      for (i = 0, l = val.length; i < l; i++) {
        ret += render(val[i], i);
      }
    } else if (typeof val === 'number') {
      for (i = 0; i < val; i++) {
        ret += render(i + 1, i);
      }
    } else if (isObject(val)) {
      keys = Object.keys(val);
      for (i = 0, l = keys.length; i < l; i++) {
        key = keys[i];
        ret += render(val[key], key, i);
      }
    }
    return ret
  }

  function renderAttrs$1 (obj) {
    var res = '';
    for (var key in obj) {
      if (isSSRUnsafeAttr(key)) {
        continue
      }
      res += renderAttr(key, obj[key]);
    }
    return res
  }

  function renderDOMProps$1 (obj) {
    var res = '';
    for (var key in obj) {
      var attr = propsToAttrMap[key] || key.toLowerCase();
      if (isRenderableAttr(attr)) {
        res += renderAttr(attr, obj[key]);
      }
    }
    return res
  }

  function renderSSRClass (
    staticClass,
    dynamic
  ) {
    var res = renderClass(staticClass, dynamic);
    return res === '' ? res : (" class=\"" + (escape(res)) + "\"")
  }

  function renderSSRStyle (
    staticStyle,
    dynamic,
    extra
  ) {
    var style = {};
    if (staticStyle) { extend(style, staticStyle); }
    if (dynamic) { extend(style, normalizeStyleBinding(dynamic)); }
    if (extra) { extend(style, extra); }
    var res = genStyle(style);
    return res === '' ? res : (" style=" + (JSON.stringify(escape(res))))
  }

  /* not type checking this file because flow doesn't play well with Proxy */

  {
    // 允许render函数访问的全局属性
    var allowedGlobals = makeMap(
      'Infinity,undefined,NaN,isFinite,isNaN,' +
      'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
      'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt,' +
      'require' // for Webpack/Browserify
    );

    var hasProxy =
      typeof Proxy !== 'undefined' && isNative(Proxy);

    if (hasProxy) {
      var isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact');
      config.keyCodes = new Proxy(config.keyCodes, {
        set: function set (target, key, value) {
          if (isBuiltInModifier(key)) {
            warn(("Avoid overwriting built-in modifier in config.keyCodes: ." + key));
            return false
          } else {
            target[key] = value;
            return true
          }
        }
      });
    }
  }

  /*  */

  var seenObjects = new _Set();

  /**
   * Recursively traverse an object to evoke all converted
   * getters, so that every nested property inside the object
   * is collected as a "deep" dependency.
   */
  // 递归遍历对象，实现深度监听
  function traverse (val) {
    _traverse(val, seenObjects);
    seenObjects.clear();
  }

  function _traverse (val, seen) {
    var i, keys;
    var isA = Array.isArray(val);
    if ((!isA && !isObject(val)) || Object.isFrozen(val) || val instanceof VNode) {
      return
    }
    if (val.__ob__) {
      var depId = val.__ob__.dep.id;
      if (seen.has(depId)) {
        return
      }
      seen.add(depId);
    }
    if (isA) {
      i = val.length;
      while (i--) { _traverse(val[i], seen); }
    } else {
      keys = Object.keys(val);
      i = keys.length;
      while (i--) { _traverse(val[keys[i]], seen); }
    }
  }

  {
    var perf = inBrowser && window.performance;
    /* istanbul ignore if */
    if (
      perf &&
      perf.mark &&
      perf.measure &&
      perf.clearMarks &&
      perf.clearMeasures
    ) ;
  }

  /*  */
  // 创建一个有缓存功能的函数名格式化函数
  var normalizeEvent = cached(function (name) {
    var passive = name.charAt(0) === '&';
    name = passive ? name.slice(1) : name;
    var once = name.charAt(0) === '~'; // Prefixed last, checked first
    name = once ? name.slice(1) : name;
    var capture = name.charAt(0) === '!';
    name = capture ? name.slice(1) : name;
    return {
      name: name,
      once: once,
      capture: capture,
      passive: passive
    }
  });

  function createFnInvoker (fns, vm) {
    function invoker () {
      var arguments$1 = arguments;

      var fns = invoker.fns;
      if (Array.isArray(fns)) {
        var cloned = fns.slice();
        for (var i = 0; i < cloned.length; i++) {
          invokeWithErrorHandling(cloned[i], null, arguments$1, vm, "v-on handler");
        }
      } else {
        // return handler return value for single handlers
        return invokeWithErrorHandling(fns, null, arguments, vm, "v-on handler")
      }
    }
    invoker.fns = fns;
    return invoker
  }
  // 利用父组件绑定的事件更新本地事件
  function updateListeners (
    on,
    oldOn,
    add,
    remove,
    createOnceHandler,
    vm
  ) {
    var name, def, cur, old, event;
    for (name in on) {
      def = cur = on[name];
      old = oldOn[name];
      // 解析绑定事件修饰符
      event = normalizeEvent(name);
      // 没有绑定有效的方法名
      if (isUndef(cur)) {
         warn(
          "Invalid handler for event \"" + (event.name) + "\": got " + String(cur),
          vm
        );
      }
      else if (isUndef(old)) {
        if (isUndef(cur.fns)) {
          cur = on[name] = createFnInvoker(cur, vm);
        }
        if (isTrue(event.once)) {
          cur = on[name] = createOnceHandler(event.name, cur, event.capture);
        }
        add(event.name, cur, event.capture, event.passive, event.params);
      } else if (cur !== old) {
        old.fns = cur;
        on[name] = old;
      }
    }
    // 根据最新的绑定，删除旧的事件
    for (name in oldOn) {
      if (isUndef(on[name])) {
        event = normalizeEvent(name);
        remove(event.name, oldOn[name], event.capture);
      }
    }
  }

  /*  */
  // props处理, 处理父组件传给子组件的props绑定，生成propsData对象，
  // 子组件实例化时，会用propsData去初始化props
  function extractPropsFromVNodeData (
    data,
    Ctor,
    tag
  ) {
    // we are only extracting raw values here.
    // validation and default values are handled in the child
    // component itself.
    // 组件props选项
    var propOptions = Ctor.options.props;
    if (isUndef(propOptions)) {
      return
    }
    var res = {};
    // 这里的data是render函数第二个参数
    // attrs是普通的HTML属性，props是要传给子组件的props
    var attrs = data.attrs;
    var props = data.props;
    if (isDef(attrs) || isDef(props)) {
      for (var key in propOptions) {
        // 格式化key，驼峰转kebab-case
        var altKey = hyphenate(key);
        {
          var keyInLowerCase = key.toLowerCase();
          if (
            key !== keyInLowerCase &&
            attrs && hasOwn(attrs, keyInLowerCase)
          ) {
            tip(
              "Prop \"" + keyInLowerCase + "\" is passed to component " +
              (formatComponentName(tag || Ctor)) + ", but the declared prop name is" +
              " \"" + key + "\". " +
              "Note that HTML attributes are case-insensitive and camelCased " +
              "props need to use their kebab-case equivalents when using in-DOM " +
              "templates. You should probably use \"" + altKey + "\" instead of \"" + key + "\"."
            );
          }
        }
        // 检查子组件需要的prop，父组件是否有通过props传
        // 如果父组件没有传，则返回false，触发短路操作
        // 检查子组件需要的prop，父组件是否有通过attrs传
        checkProp(res, props, key, altKey, true) ||
        // attrs命中prop时，会从attrs对象中删除，这样就不会添加到DOM上了
        // 这也是最后一个参数设置为false的作用
        checkProp(res, attrs, key, altKey, false);
      }
    }
    return res
  }

  function checkProp (
    res,
    hash,
    key,
    altKey,
    preserve
  ) {
    if (isDef(hash)) {
      if (hasOwn(hash, key)) {
        res[key] = hash[key];
        if (!preserve) {
          delete hash[key];
        }
        return true
      } else if (hasOwn(hash, altKey)) {
        res[key] = hash[altKey];
        if (!preserve) {
          delete hash[altKey];
        }
        return true
      }
    }
    return false
  }

  /*  */

  var SIMPLE_NORMALIZE = 1;
  var ALWAYS_NORMALIZE = 2;

  // wrapper function for providing a more flexible interface
  // without getting yelled at by flow
  // _createElement函数的封装，接收的参数更加灵活
  function createElement (
    context,
    tag,
    data,
    children,
    normalizationType, // 区分以何种方式规范children
    alwaysNormalize
  ) {
    // 如果data没有设置，则第三个参数就是children
    if (Array.isArray(data) || isPrimitive(data)) {
      normalizationType = children;
      children = data;
      data = undefined;
    }
    // 手写的render函数alwaysNormalize一定为true
    if (isTrue(alwaysNormalize)) {
      normalizationType = ALWAYS_NORMALIZE;
    }
    return _createElement(context, tag, data, children, normalizationType)
  }
  // 创建VNode的函数
  function _createElement (
    context, // 执行上下文
    tag, // 标签、组件
    data, // VNode数据
    children, // 后代节点
    normalizationType
  ) {
    // 判断data是否响应式的，是则直接返回一个空的VNode
    if (isDef(data) && isDef((data).__ob__)) {
       warn(
        "Avoid using observed data object as vnode data: " + (JSON.stringify(data)) + "\n" +
        'Always create fresh vnode data objects in each render!',
        context
      );
      return createEmptyVNode()
    }
    // 处理ul的子节点只能是li这种情况
    // object syntax in v-bind
    if (isDef(data) && isDef(data.is)) {
      tag = data.is;
    }
    // 创建空节点
    if (!tag) {
      // in case of component :is set to falsy value
      return createEmptyVNode()
    }
    // warn against non-primitive key
    // 绑定的key不能是非原始类型
    if (
      isDef(data) && isDef(data.key) && !isPrimitive(data.key)
    ) {
      {
        warn(
          'Avoid using non-primitive value as key, ' +
          'use string/number value instead.',
          context
        );
      }
    }
    // support single function children as default scoped slot
    // 如果children的第一个元素是函数，那么这个函数会被当作作用域插槽，并且抛弃后面的子元素
    if (Array.isArray(children) &&
      typeof children[0] === 'function'
    ) {
      data = data || {};
      data.scopedSlots = { default: children[0] };
      children.length = 0;
    }
    // 格式化children，children可以有不同的形式
    if (normalizationType === ALWAYS_NORMALIZE) {
      children = normalizeChildren(children);
    }
    else if (normalizationType === SIMPLE_NORMALIZE) {
      children = simpleNormalizeChildren(children);
    }
    var vnode, ns;
    // 字符串
    if (typeof tag === 'string') {
      var Ctor;
      ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);
      // 原始标签
      if (config.isReservedTag(tag)) {
        // platform built-in elements
        // .native修饰符不能用于原始标签
        if ( isDef(data) && isDef(data.nativeOn) && data.tag !== 'component') {
          warn(
            ("The .native modifier for v-on is only valid on components but it was used on <" + tag + ">."),
            context
          );
        }
        vnode = new VNode(
          config.parsePlatformTagName(tag), data, children,
          undefined, undefined, context
        );
      }
      // component组件
      // resolveAsset(A, B, C)，在A的B中查找是否存在C
      else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
        // component
        // Ctor：组件
        vnode = createComponent(Ctor, data, context, children, tag);
      }
      // 自定义元素
      else {
        // unknown or unlisted namespaced elements
        // check at runtime because it may get assigned a namespace when its
        // parent normalizes children
        vnode = new VNode(
          tag, data, children,
          undefined, undefined, context
        );
      }
    }
    // 组件选项
    else {
      // direct component options / constructor
      vnode = createComponent(tag, data, context, children);
    }
    if (Array.isArray(vnode)) {
      return vnode
    } else if (isDef(vnode)) {
      if (isDef(ns)) { applyNS(vnode, ns); }
      // 这个方法的作用可以搜索 ref #5318 这个issue
      if (isDef(data)) { registerDeepBindings(data); }
      return vnode
    } else {
      return createEmptyVNode()
    }
  }

  function applyNS (vnode, ns, force) {
    vnode.ns = ns;
    if (vnode.tag === 'foreignObject') {
      // use default namespace inside foreignObject
      ns = undefined;
      force = true;
    }
    if (isDef(vnode.children)) {
      for (var i = 0, l = vnode.children.length; i < l; i++) {
        var child = vnode.children[i];
        if (isDef(child.tag) && (
          isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
          applyNS(child, ns, force);
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
      traverse(data.style);
    }
    if (isObject(data.class)) {
      traverse(data.class);
    }
  }

  /*  */

  /**
   * Runtime helper for rendering v-for lists.
   */
  // 渲染v-for列表
  function renderList (
    val,
    render
  ) {
    var ret, i, l, keys, key;
    if (Array.isArray(val) || typeof val === 'string') {
      ret = new Array(val.length);
      for (i = 0, l = val.length; i < l; i++) {
        ret[i] = render(val[i], i);
      }
    } else if (typeof val === 'number') {
      ret = new Array(val);
      for (i = 0; i < val; i++) {
        ret[i] = render(i + 1, i);
      }
    } else if (isObject(val)) {
      if (hasSymbol && val[Symbol.iterator]) {
        ret = [];
        var iterator = val[Symbol.iterator]();
        var result = iterator.next();
        while (!result.done) {
          ret.push(render(result.value, ret.length));
          result = iterator.next();
        }
      } else {
        keys = Object.keys(val);
        ret = new Array(keys.length);
        for (i = 0, l = keys.length; i < l; i++) {
          key = keys[i];
          ret[i] = render(val[key], key, i);
        }
      }
    }
    if (!isDef(ret)) {
      ret = [];
    }
    (ret)._isVList = true;
    return ret
  }

  /*  */

  /**
   * Runtime helper for rendering <slot>
   */
  // 渲染插槽
  function renderSlot (
    name,
    fallbackRender,
    props,
    bindObject
  ) {
    var scopedSlotFn = this.$scopedSlots[name];
    var nodes;
    if (scopedSlotFn) {
      // scoped slot
      props = props || {};
      if (bindObject) {
        if ( !isObject(bindObject)) {
          warn('slot v-bind without argument expects an Object', this);
        }
        props = extend(extend({}, bindObject), props);
      }
      nodes =
        scopedSlotFn(props) ||
        (typeof fallbackRender === 'function' ? fallbackRender() : fallbackRender);
    } else {
      nodes =
        this.$slots[name] ||
        (typeof fallbackRender === 'function' ? fallbackRender() : fallbackRender);
    }

    var target = props && props.slot;
    if (target) {
      return this.$createElement('template', { slot: target }, nodes)
    } else {
      return nodes
    }
  }

  /*  */

  /**
   * Runtime helper for resolving filters
   * 查找并返回指定的过滤器
   */
  function resolveFilter (id) {
    // 查找，找不到则返回identity
    return resolveAsset(this.$options, 'filters', id, true) || identity
  }

  /*  */

  function isKeyNotMatch (expect, actual) {
    if (Array.isArray(expect)) {
      return expect.indexOf(actual) === -1
    } else {
      return expect !== actual
    }
  }

  /**
   * Runtime helper for checking keyCodes from config.
   * exposed as Vue.prototype._k
   * passing in eventKeyName as last argument separately for backwards compat
   */
  function checkKeyCodes (
    eventKeyCode,
    key,
    builtInKeyCode,
    eventKeyName,
    builtInKeyName
  ) {
    var mappedKeyCode = config.keyCodes[key] || builtInKeyCode;
    if (builtInKeyName && eventKeyName && !config.keyCodes[key]) {
      return isKeyNotMatch(builtInKeyName, eventKeyName)
    } else if (mappedKeyCode) {
      return isKeyNotMatch(mappedKeyCode, eventKeyCode)
    } else if (eventKeyName) {
      return hyphenate(eventKeyName) !== key
    }
    return eventKeyCode === undefined
  }

  /*  */

  /**
   * Runtime helper for merging v-bind="object" into a VNode's data.
   */
  // v-bind绑定对象
  function bindObjectProps (
    data,
    tag,
    value,
    asProp,
    isSync
  ) {
    if (value) {
      if (!isObject(value)) {
         warn(
          'v-bind without argument expects an Object or Array value',
          this
        );
      } else {
        if (Array.isArray(value)) {
          value = toObject(value);
        }
        var hash;
        var loop = function ( key ) {
          if (
            key === 'class' ||
            key === 'style' ||
            isReservedAttribute(key)
          ) {
            hash = data;
          } else {
            var type = data.attrs && data.attrs.type;
            hash = asProp || config.mustUseProp(tag, type, key)
              ? data.domProps || (data.domProps = {})
              : data.attrs || (data.attrs = {});
          }
          var camelizedKey = camelize(key);
          var hyphenatedKey = hyphenate(key);
          if (!(camelizedKey in hash) && !(hyphenatedKey in hash)) {
            hash[key] = value[key];

            if (isSync) {
              var on = data.on || (data.on = {});
              on[("update:" + key)] = function ($event) {
                value[key] = $event;
              };
            }
          }
        };

        for (var key in value) loop( key );
      }
    }
    return data
  }

  /*  */

  /**
   * Runtime helper for rendering static trees.
   */
  // 编译静态节点，生成并缓存静态节点Vnode
  function renderStatic (
    index,
    isInFor
  ) {
    var cached = this._staticTrees || (this._staticTrees = []);
    var tree = cached[index];
    // if has already-rendered static tree and not inside v-for,
    // we can reuse the same tree.
    if (tree && !isInFor) {
      return tree
    }
    // otherwise, render a fresh tree.
    tree = cached[index] = this.$options.staticRenderFns[index].call(
      this._renderProxy,
      null,
      this // for render fns generated for functional component templates
    );
    markStatic(tree, ("__static__" + index), false);
    return tree
  }

  /**
   * Runtime helper for v-once.
   * Effectively it means marking the node as static with a unique key.
   */
  function markOnce (
    tree,
    index,
    key
  ) {
    markStatic(tree, ("__once__" + index + (key ? ("_" + key) : "")), true);
    return tree
  }
  // 标记静态节点
  function markStatic (
    tree,
    key,
    isOnce
  ) {
    if (Array.isArray(tree)) {
      for (var i = 0; i < tree.length; i++) {
        if (tree[i] && typeof tree[i] !== 'string') {
          markStaticNode(tree[i], (key + "_" + i), isOnce);
        }
      }
    } else {
      markStaticNode(tree, key, isOnce);
    }
  }
  // 标记静态节点
  function markStaticNode (node, key, isOnce) {
    node.isStatic = true;
    node.key = key;
    node.isOnce = isOnce;
  }

  /*  */
  // v-on绑定一个事件对象
  function bindObjectListeners (data, value) {
    if (value) {
      if (!isPlainObject(value)) {
         warn(
          'v-on without argument expects an Object value',
          this
        );
      } else {
        var on = data.on = data.on ? extend({}, data.on) : {};
        for (var key in value) {
          var existing = on[key];
          var ours = value[key];
          on[key] = existing ? [].concat(existing, ours) : ours;
        }
      }
    }
    return data
  }

  /*  */

  function resolveScopedSlots (
    fns, // see flow/vnode
    res,
    // the following are added in 2.6
    hasDynamicKeys,
    contentHashKey
  ) {
    res = res || { $stable: !hasDynamicKeys };
    for (var i = 0; i < fns.length; i++) {
      var slot = fns[i];
      if (Array.isArray(slot)) {
        resolveScopedSlots(slot, res, hasDynamicKeys);
      } else if (slot) {
        // marker for reverse proxying v-slot without scope on this.$slots
        if (slot.proxy) {
          slot.fn.proxy = true;
        }
        res[slot.key] = slot.fn;
      }
    }
    if (contentHashKey) {
      (res).$key = contentHashKey;
    }
    return res
  }

  /*  */

  function bindDynamicKeys (baseObj, values) {
    for (var i = 0; i < values.length; i += 2) {
      var key = values[i];
      if (typeof key === 'string' && key) {
        baseObj[values[i]] = values[i + 1];
      } else if ( key !== '' && key !== null) {
        // null is a special value for explicitly removing a binding
        warn(
          ("Invalid value for dynamic directive argument (expected string or null): " + key),
          this
        );
      }
    }
    return baseObj
  }

  // helper to dynamically append modifier runtime markers to event names.
  // ensure only append when value is already string, otherwise it will be cast
  // to string and cause the type check to miss.
  function prependModifier (value, symbol) {
    return typeof value === 'string' ? symbol + value : value
  }

  /*  */

  function installRenderHelpers (target) {
    target._o = markOnce;
    target._n = toNumber;
    target._s = toString;
    target._l = renderList;
    target._t = renderSlot;
    target._q = looseEqual;
    target._i = looseIndexOf;
    target._m = renderStatic;
    target._f = resolveFilter;
    target._k = checkKeyCodes;
    target._b = bindObjectProps;
    target._v = createTextVNode;
    target._e = createEmptyVNode;
    target._u = resolveScopedSlots;
    target._g = bindObjectListeners;
    target._d = bindDynamicKeys;
    target._p = prependModifier;
  }

  /*  */



  /**
   * Runtime helper for resolving raw children VNodes into a slot object.
   */
  // 处理子组件在父组件渲染时，把children处理成$slots
  function resolveSlots (
    children,
    context
  ) {
    if (!children || !children.length) {
      return {}
    }
    var slots = {};
    for (var i = 0, l = children.length; i < l; i++) {
      var child = children[i];
      var data = child.data;
      // remove slot attribute if the node is resolved as a Vue slot node
      // <span slot="header"></span>，废弃属性，指定具名插槽，作用和v-slot一样，
      if (data && data.attrs && data.attrs.slot) {
        delete data.attrs.slot;
      }
      // named slots should only be respected if the vnode was rendered in the
      // same context.
      // 具名插槽
      if ((child.context === context || child.fnContext === context) &&
        data && data.slot != null
      ) {
        var name = data.slot;
        var slot = (slots[name] || (slots[name] = []));
        if (child.tag === 'template') {
          slot.push.apply(slot, child.children || []);
        } else {
          slot.push(child);
        }
      }
      // 默认插槽
      else {
        (slots.default || (slots.default = [])).push(child);
      }
    }
    // ignore slots that contains only whitespace
    for (var name$1 in slots) {
      if (slots[name$1].every(isWhitespace)) {
        delete slots[name$1];
      }
    }
    return slots
  }

  function isWhitespace (node) {
    return (node.isComment && !node.asyncFactory) || node.text === ' '
  }

  /*  */

  function isAsyncPlaceholder (node) {
    return node.isComment && node.asyncFactory
  }

  /*  */

  function normalizeScopedSlots (
    slots,
    normalSlots,
    prevSlots
  ) {
    var res;
    var hasNormalSlots = Object.keys(normalSlots).length > 0;
    var isStable = slots ? !!slots.$stable : !hasNormalSlots;
    var key = slots && slots.$key;
    if (!slots) {
      res = {};
    } else if (slots._normalized) {
      // fast path 1: child component re-render only, parent did not change
      return slots._normalized
    } else if (
      isStable &&
      prevSlots &&
      prevSlots !== emptyObject &&
      key === prevSlots.$key &&
      !hasNormalSlots &&
      !prevSlots.$hasNormal
    ) {
      // fast path 2: stable scoped slots w/ no normal slots to proxy,
      // only need to normalize once
      return prevSlots
    } else {
      res = {};
      for (var key$1 in slots) {
        if (slots[key$1] && key$1[0] !== '$') {
          res[key$1] = normalizeScopedSlot(normalSlots, key$1, slots[key$1]);
        }
      }
    }
    // expose normal slots on scopedSlots
    for (var key$2 in normalSlots) {
      if (!(key$2 in res)) {
        res[key$2] = proxyNormalSlot(normalSlots, key$2);
      }
    }
    // avoriaz seems to mock a non-extensible $scopedSlots object
    // and when that is passed down this would cause an error
    if (slots && Object.isExtensible(slots)) {
      (slots)._normalized = res;
    }
    def(res, '$stable', isStable);
    def(res, '$key', key);
    def(res, '$hasNormal', hasNormalSlots);
    return res
  }

  function normalizeScopedSlot(normalSlots, key, fn) {
    var normalized = function () {
      var res = arguments.length ? fn.apply(null, arguments) : fn({});
      res = res && typeof res === 'object' && !Array.isArray(res)
        ? [res] // single vnode
        : normalizeChildren(res);
      var vnode = res && res[0];
      return res && (
        !vnode ||
        (res.length === 1 && vnode.isComment && !isAsyncPlaceholder(vnode)) // #9658, #10391
      ) ? undefined
        : res
    };
    // this is a slot using the new v-slot syntax without scope. although it is
    // compiled as a scoped slot, render fn users would expect it to be present
    // on this.$slots because the usage is semantically a normal slot.
    if (fn.proxy) {
      Object.defineProperty(normalSlots, key, {
        get: normalized,
        enumerable: true,
        configurable: true
      });
    }
    return normalized
  }

  function proxyNormalSlot(slots, key) {
    return function () { return slots[key]; }
  }

  /*  */

  function createAsyncPlaceholder (
    factory,
    data,
    context,
    children,
    tag
  ) {
    var node = createEmptyVNode();
    node.asyncFactory = factory;
    node.asyncMeta = { data: data, context: context, children: children, tag: tag };
    return node
  }

  function resolveAsyncComponent (
    factory,
    baseCtor
  ) {
    if (isTrue(factory.error) && isDef(factory.errorComp)) {
      return factory.errorComp
    }

    if (isDef(factory.resolved)) {
      return factory.resolved
    }

    if (isTrue(factory.loading) && isDef(factory.loadingComp)) {
      return factory.loadingComp
    }
  }

  /*  */

  var target;
  // 添加自定义事件
  function add (event, fn) {
    target.$on(event, fn);
  }
  // 删除自定义事件
  function remove$1 (event, fn) {
    target.$off(event, fn);
  }
  // 创建单一自定义事件
  function createOnceHandler (event, fn) {
    var _target = target;
    return function onceHandler () {
      var res = fn.apply(null, arguments);
      // 执行的时候删除自身
      if (res !== null) {
        _target.$off(event, onceHandler);
      }
    }
  }

  function updateComponentListeners (
    vm,
    listeners,
    oldListeners
  ) {
    target = vm;
    // 把事件处理相关的方法通过参数传过去，利用闭包的特性
    updateListeners(listeners, oldListeners || {}, add, remove$1, createOnceHandler, vm);
    target = undefined;
  }

  /*  */
  // 存储当前激活实例
  var activeInstance = null;
  // prepatch这个hook会调用这个函数
  function updateChildComponent(
    vm, // componentInstance
    propsData, // 更新后的propsData
    listeners, // 更新后的listeners
    parentVnode, // 子组件在父组件中的Vnode，和组件内部render的Vnode不是一回事
    renderChildren // 当前Vnode下的children
  ) {

    // determine whether component has slot children
    // we need to do this before overwriting $options._renderChildren.

    // check if there are dynamic scopedSlots (hand-written or compiled but with
    // dynamic slot names). Static scoped slots compiled from template has the
    // "$stable" marker.
    // 新的插槽
    var newScopedSlots = parentVnode.data.scopedSlots;
    // 旧的插槽
    var oldScopedSlots = vm.$scopedSlots;
    // 是否是动态插槽
    var hasDynamicScopedSlot = !!(
      // 新插槽不稳定，$stable标记是模版编译时标记的
      (
        (newScopedSlots && !newScopedSlots.$stable) ||
        // 旧插槽不稳定
        (oldScopedSlots !== emptyObject && !oldScopedSlots.$stable) ||
        // 新旧插槽绑定的key不同
        (newScopedSlots && vm.$scopedSlots.$key !== newScopedSlots.$key) ||
        // 没有新插槽，旧插槽有Key
        (!newScopedSlots && vm.$scopedSlots.$key)
      )
    );

    // Any static slot children from the parent may have changed during parent's
    // update. Dynamic scoped slots may also have changed. In such cases, a forced
    // update is necessary to ensure correctness.
    var needsForceUpdate = !!(
      renderChildren || // has new static slots
      vm.$options._renderChildren || // has old static slots
      hasDynamicScopedSlot
    );

    vm.$options._parentVnode = parentVnode;
    vm.$vnode = parentVnode; // update vm's placeholder node without re-render

    if (vm._vnode) {
      // update child tree's parent
      vm._vnode.parent = parentVnode;
    }
    vm.$options._renderChildren = renderChildren;

    // update $attrs and $listeners hash
    // these are also reactive so they may trigger child update if the child
    // used them during render
    vm.$attrs = parentVnode.data.attrs || emptyObject;
    vm.$listeners = listeners || emptyObject;

    // update props
    // 更新props
    if (propsData && vm.$options.props) {
      toggleObserving(false);
      var props = vm._props;
      var propKeys = vm.$options._propKeys || [];
      for (var i = 0; i < propKeys.length; i++) {
        var key = propKeys[i];
        var propOptions = vm.$options.props; // wtf flow?
        props[key] = validateProp(key, propOptions, propsData, vm);
      }
      toggleObserving(true);
      // keep a copy of raw propsData
      vm.$options.propsData = propsData;
    }

    // update listeners
    // 更新listeners
    listeners = listeners || emptyObject;
    var oldListeners = vm.$options._parentListeners;
    vm.$options._parentListeners = listeners;
    updateComponentListeners(vm, listeners, oldListeners);

    // resolve slots + force update if has children
    // 是否需要强制更新子组件
    if (needsForceUpdate) {
      vm.$slots = resolveSlots(renderChildren, parentVnode.context);
      vm.$forceUpdate();
    }
  }

  function isInInactiveTree(vm) {
    while (vm && (vm = vm.$parent)) {
      if (vm._inactive) { return true; }
    }
    return false;
  }

  function activateChildComponent(vm, direct) {
    if (direct) {
      vm._directInactive = false;
      if (isInInactiveTree(vm)) {
        return;
      }
    } else if (vm._directInactive) {
      return;
    }
    if (vm._inactive || vm._inactive === null) {
      vm._inactive = false;
      for (var i = 0; i < vm.$children.length; i++) {
        activateChildComponent(vm.$children[i]);
      }
      callHook(vm, "activated");
    }
  }

  function deactivateChildComponent(vm, direct) {
    if (direct) {
      vm._directInactive = true;
      if (isInInactiveTree(vm)) {
        return;
      }
    }
    if (!vm._inactive) {
      vm._inactive = true;
      for (var i = 0; i < vm.$children.length; i++) {
        deactivateChildComponent(vm.$children[i]);
      }
      callHook(vm, "deactivated");
    }
  }

  function callHook(vm, hook) {
    // #7573 disable dep collection when invoking lifecycle hooks
    pushTarget();
    var handlers = vm.$options[hook];
    var info = hook + " hook";
    if (handlers) {
      for (var i = 0, j = handlers.length; i < j; i++) {
        invokeWithErrorHandling(handlers[i], vm, null, vm, info);
      }
    }
    /**
     * 父组件通过@hook:[xxx]监听子组件的生命周期，比如
     * <hello-world @hook:updated="hookUpdate"></hello-world>
     * 子组件初始化事件系统时，会判断事件名是否包括hook:，包括的话则会把_hasHookEvent设置为true，
     * callHook调用时，则会触发对应的事件
     */
    if (vm._hasHookEvent) {
      vm.$emit("hook:" + hook);
    }
    popTarget();
  }

  /*  */

  // Async edge case fix requires storing an event listener's attach timestamp.
  var getNow = Date.now;

  // Determine what event timestamp the browser is using. Annoyingly, the
  // timestamp can either be hi-res (relative to page load) or low-res
  // (relative to UNIX epoch), so in order to compare time we have to use the
  // same timestamp type when saving the flush timestamp.
  // All IE versions use low-res event timestamps, and have problematic clock
  // implementations (#9632)
  if (inBrowser && !isIE) {
    var performance = window.performance;
    if (
      performance &&
      typeof performance.now === 'function' &&
      getNow() > document.createEvent('Event').timeStamp
    ) {
      // if the event timestamp, although evaluated AFTER the Date.now(), is
      // smaller than it, it means the event is using a hi-res timestamp,
      // and we need to use the hi-res version for event listener timestamps as
      // well.
      getNow = function () { return performance.now(); };
    }
  }

  /**
   * Queue a kept-alive component that was activated during patch.
   * The queue will be processed after the entire tree has been patched.
   */
  function queueActivatedComponent (vm) {
    // setting _inactive to false here so that a render function can
    // rely on checking whether it's in an inactive tree (e.g. router-view)
    vm._inactive = false;
  }

  /*  */
  // 针对inject不同的配置格式做处理
  function resolveInject (inject, vm) {
    if (inject) {
      // inject is :any because flow is not smart enough to figure out cached
      var result = Object.create(null);
      // 是否支持symbol
      var keys = hasSymbol
        ? Reflect.ownKeys(inject)
        : Object.keys(inject);

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        // #6574 in case the inject object is observed...
        if (key === '__ob__') { continue }
        // from用于指定来源
        var provideKey = inject[key].from;
        var source = vm;
        // 通过key设置value
        while (source) {
          // 这里没有直接从vm.$parent开始查找，是因为inject初始化在provide前面，
          // 此时当前实例的_provided为undefined
          if (source._provided && hasOwn(source._provided, provideKey)) {
            result[key] = source._provided[provideKey];
            break
          }
          source = source.$parent;
        }
        // 设置默认值
        if (!source) {
          if ('default' in inject[key]) {
            var provideDefault = inject[key].default;
            result[key] = typeof provideDefault === 'function'
              ? provideDefault.call(vm)
              : provideDefault;
          } else {
            warn(("Injection \"" + key + "\" not found"), vm);
          }
        }
      }
      return result
    }
  }

  /*  */

  function resolveConstructorOptions (Ctor) {
    // 这里的options是在 initGlobalAPI() 时注入的，格式如下
    // { component, directive, filter }
    var options = Ctor.options;
    // 判断当前构造函数是否是继承Vue
    if (Ctor.super) {
      var superOptions = resolveConstructorOptions(Ctor.super);
      var cachedSuperOptions = Ctor.superOptions;
      if (superOptions !== cachedSuperOptions) {
        // super option changed,
        // need to resolve new options.
        Ctor.superOptions = superOptions;
        // check if there are any late-modified/attached options (#4976)
        var modifiedOptions = resolveModifiedOptions(Ctor);
        // update base extend options
        if (modifiedOptions) {
          extend(Ctor.extendOptions, modifiedOptions);
        }
        options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
        if (options.name) {
          options.components[options.name] = Ctor;
        }
      }
    }
    return options
  }

  function resolveModifiedOptions (Ctor) {
    var modified;
    var latest = Ctor.options;
    var sealed = Ctor.sealedOptions;
    for (var key in latest) {
      if (latest[key] !== sealed[key]) {
        if (!modified) { modified = {}; }
        modified[key] = latest[key];
      }
    }
    return modified
  }

  /*  */

  function FunctionalRenderContext (
    data,
    props,
    children,
    parent,
    Ctor
  ) {
    var this$1 = this;

    var options = Ctor.options;
    // ensure the createElement function in functional components
    // gets a unique context - this is necessary for correct named slot check
    var contextVm;
    if (hasOwn(parent, '_uid')) {
      contextVm = Object.create(parent);
      // $flow-disable-line
      contextVm._original = parent;
    } else {
      // the context vm passed in is a functional context as well.
      // in this case we want to make sure we are able to get a hold to the
      // real context instance.
      contextVm = parent;
      // $flow-disable-line
      parent = parent._original;
    }
    var isCompiled = isTrue(options._compiled);
    var needNormalization = !isCompiled;

    this.data = data;
    this.props = props;
    this.children = children;
    this.parent = parent;
    this.listeners = data.on || emptyObject;
    this.injections = resolveInject(options.inject, parent);
    this.slots = function () {
      if (!this$1.$slots) {
        normalizeScopedSlots(
          data.scopedSlots,
          this$1.$slots = resolveSlots(children, parent)
        );
      }
      return this$1.$slots
    };

    Object.defineProperty(this, 'scopedSlots', ({
      enumerable: true,
      get: function get () {
        return normalizeScopedSlots(data.scopedSlots, this.slots())
      }
    }));

    // support for compiled functional template
    if (isCompiled) {
      // exposing $options for renderStatic()
      this.$options = options;
      // pre-resolve slots for renderSlot()
      this.$slots = this.slots();
      this.$scopedSlots = normalizeScopedSlots(data.scopedSlots, this.$slots);
    }

    if (options._scopeId) {
      this._c = function (a, b, c, d) {
        var vnode = createElement(contextVm, a, b, c, d, needNormalization);
        if (vnode && !Array.isArray(vnode)) {
          vnode.fnScopeId = options._scopeId;
          vnode.fnContext = parent;
        }
        return vnode
      };
    } else {
      this._c = function (a, b, c, d) { return createElement(contextVm, a, b, c, d, needNormalization); };
    }
  }

  installRenderHelpers(FunctionalRenderContext.prototype);

  function createFunctionalComponent (
    Ctor,
    propsData,
    data,
    contextVm,
    children
  ) {
    var options = Ctor.options;
    var props = {};
    var propOptions = options.props;
    if (isDef(propOptions)) {
      for (var key in propOptions) {
        props[key] = validateProp(key, propOptions, propsData || emptyObject);
      }
    } else {
      if (isDef(data.attrs)) { mergeProps(props, data.attrs); }
      if (isDef(data.props)) { mergeProps(props, data.props); }
    }

    var renderContext = new FunctionalRenderContext(
      data,
      props,
      children,
      contextVm,
      Ctor
    );

    var vnode = options.render.call(null, renderContext._c, renderContext);

    if (vnode instanceof VNode) {
      return cloneAndMarkFunctionalResult(vnode, data, renderContext.parent, options, renderContext)
    } else if (Array.isArray(vnode)) {
      var vnodes = normalizeChildren(vnode) || [];
      var res = new Array(vnodes.length);
      for (var i = 0; i < vnodes.length; i++) {
        res[i] = cloneAndMarkFunctionalResult(vnodes[i], data, renderContext.parent, options, renderContext);
      }
      return res
    }
  }

  function cloneAndMarkFunctionalResult (vnode, data, contextVm, options, renderContext) {
    // #7817 clone node before setting fnContext, otherwise if the node is reused
    // (e.g. it was from a cached normal slot) the fnContext causes named slots
    // that should not be matched to match.
    var clone = cloneVNode(vnode);
    clone.fnContext = contextVm;
    clone.fnOptions = options;
    {
      (clone.devtoolsMeta = clone.devtoolsMeta || {}).renderContext = renderContext;
    }
    if (data.slot) {
      (clone.data || (clone.data = {})).slot = data.slot;
    }
    return clone
  }

  function mergeProps (to, from) {
    for (var key in from) {
      to[camelize(key)] = from[key];
    }
  }

  /*  */

  // inline hooks to be invoked on component VNodes during patch
  // vue虚拟DOM依赖的开源库的hook函数
  var componentVNodeHooks = {
    init: function init (vnode, hydrating) {
      /**
       * <template>
       *   <div>
       *     <keep-alive>
       *       <component :is="name"></component>
       *     </keep-alive>
       *   </div>
       * </template>
       * 切换组件时，会重新执行init钩子，
       */
      // keep-alive逻辑，直接走if逻辑，不会走else中的child.$mount()逻辑，
      // 因为keep-alive会直接将保存的Vnode的elm插入到父元素中
      if (
        vnode.componentInstance &&
        !vnode.componentInstance._isDestroyed &&
        vnode.data.keepAlive
      ) {
        // kept-alive components, treat as a patch
        var mountedNode = vnode; // work around flow
        // 注意点，keepalive组件的prepatch传递两个相同的Vnode
        componentVNodeHooks.prepatch(mountedNode, mountedNode);
      }
      // 递归处理子组件的逻辑
      else {
        // 实例化子组件，相当于new Vue()
        var child = vnode.componentInstance = createComponentInstanceForVnode(
          vnode,
          activeInstance
        );
        // 挂载子组件
        child.$mount(hydrating ? vnode.elm : undefined, hydrating);
      }
    },
    // patch比对的hook函数
    prepatch: function prepatch (oldVnode, vnode) {
      var options = vnode.componentOptions;
      var child = vnode.componentInstance = oldVnode.componentInstance;
      updateChildComponent(
        child,
        options.propsData, // updated props
        options.listeners, // updated listeners
        vnode, // new parent vnode
        options.children // new children
      );
    },
    // 插入的hook函数
    insert: function insert (vnode) {
      var context = vnode.context;
      var componentInstance = vnode.componentInstance;
      if (!componentInstance._isMounted) {
        componentInstance._isMounted = true;
        callHook(componentInstance, 'mounted');
      }
      if (vnode.data.keepAlive) {
        if (context._isMounted) {
          // vue-router#1212
          // During updates, a kept-alive component's child components may
          // change, so directly walking the tree here may call activated hooks
          // on incorrect children. Instead we push them into a queue which will
          // be processed after the whole patch process ended.
          queueActivatedComponent(componentInstance);
        } else {
          activateChildComponent(componentInstance, true /* direct */);
        }
      }
    },
    // 销毁的hook函数
    destroy: function destroy (vnode) {
      var componentInstance = vnode.componentInstance;
      // 组件是否已经销毁
      if (!componentInstance._isDestroyed) {
        // 是否在keepalive缓存的组件
        if (!vnode.data.keepAlive) {
          // 调用组件实例原型上的$destroy方法
          componentInstance.$destroy();
        }
        else {
          deactivateChildComponent(componentInstance, true /* direct */);
        }
      }
    }
  };
  // 待合并的虚拟DOM的钩子函数
  var hooksToMerge = Object.keys(componentVNodeHooks);
  // 为组件生成对应的Vnode
  function createComponent (
    Ctor,  // 组件选项
    data, // data
    context, // 父实例
    children, // children
    tag  // 在模版中使用的标签字符串
  ) {
    if (isUndef(Ctor)) {
      return
    }
    // Vue构造函数
    var baseCtor = context.$options._base;

    // plain options object: turn it into a constructor
    if (isObject(Ctor)) {
      // Vue.extend(), 返回一个新的构造函数，Vue的子类，实例化它就可以得到一个Vue实例
      Ctor = baseCtor.extend(Ctor);
    }

    // if at this stage it's not a constructor or an async component factory,
    // reject.
    if (typeof Ctor !== 'function') {
      {
        warn(("Invalid Component definition: " + (String(Ctor))), context);
      }
      return
    }

    // async component
    // 异步组件
    var asyncFactory;
    if (isUndef(Ctor.cid)) {
      asyncFactory = Ctor;
      Ctor = resolveAsyncComponent(asyncFactory);
      if (Ctor === undefined) {
        // return a placeholder node for async component, which is rendered
        // as a comment node but preserves all the raw information for the node.
        // the information will be used for async server-rendering and hydration.
        return createAsyncPlaceholder(
          asyncFactory,
          data,
          context,
          children,
          tag
        )
      }
    }

    data = data || {};

    // resolve constructor options in case global mixins are applied after
    // component constructor creation
    // 合并组件选项
    resolveConstructorOptions(Ctor);

    // transform component v-model data into props & events
    // v-model实现
    if (isDef(data.model)) {
      transformModel(Ctor.options, data);
    }

    // extract props
    // props处理, 处理父组件传给子组件的props绑定，生成propsData对象，
    // 子组件实例化时，会用propsData去初始化props
    var propsData = extractPropsFromVNodeData(data, Ctor, tag);

    // functional component
    // 函数式组件
    if (isTrue(Ctor.options.functional)) {
      return createFunctionalComponent(Ctor, propsData, data, context, children)
    }

    // extract listeners, since these needs to be treated as
    // child component listeners instead of DOM listeners
    var listeners = data.on;
    // replace with listeners with .native modifier
    // so it gets processed during parent component patch.
    data.on = data.nativeOn;
    // 抽象组件
    if (isTrue(Ctor.options.abstract)) {
      // abstract components do not keep anything
      // other than props & listeners & slot

      // work around flow
      var slot = data.slot;
      data = {};
      if (slot) {
        data.slot = slot;
      }
    }

    // install component management hooks onto the placeholder node
    installComponentHooks(data);

    // return a placeholder vnode
    // 实例化VNode
    var name = Ctor.options.name || tag;
    var vnode = new VNode(
      ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
      data, undefined, undefined, undefined,
      context, // 上下文
      { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children },  // componentOptions
      asyncFactory
    );

    return vnode
  }

  function createComponentInstanceForVnode (
    // we know it's MountedComponentVNode but flow doesn't
    vnode,
    // activeInstance in lifecycle state
    parent
  ) {
    var options = {
      _isComponent: true,
      // 这里的_parentVnode是父级Vnode，值得注意的是，子组件在父组件中是一个Vnode，
      // 但子组件实例化时render生成的也是一个Vnode，这个Vnode和代表子组件的Vnode是父子层级关系
      // 所以这里通过_parentVnode传给子组件内部
      _parentVnode: vnode,
      // 这里的parent是父组件
      parent: parent
    };
    // check inline-template render functions
    var inlineTemplate = vnode.data.inlineTemplate;
    if (isDef(inlineTemplate)) {
      options.render = inlineTemplate.render;
      options.staticRenderFns = inlineTemplate.staticRenderFns;
    }
    // init逻辑
    return new vnode.componentOptions.Ctor(options)
  }
  // 为VNode的hook安装虚拟DOM的钩子函数
  function installComponentHooks (data) {
    var hooks = data.hook || (data.hook = {});
    for (var i = 0; i < hooksToMerge.length; i++) {
      var key = hooksToMerge[i];
      var existing = hooks[key];
      var toMerge = componentVNodeHooks[key];
      // 这里主要处理自定义hook和内部hook的合并逻辑
      if (existing !== toMerge && !(existing && existing._merged)) {
        hooks[key] = existing ? mergeHook$1(toMerge, existing) : toMerge;
      }
    }
  } 
  // 合并hook
  function mergeHook$1 (f1, f2) {
    var merged = function (a, b) {
      // flow complains about extra args which is why we use any
      f1(a, b);
      f2(a, b);
    };
    merged._merged = true;
    return merged
  }

  // transform component v-model info (value and callback) into
  // prop and event handler respectively.
  // v-model的实现
  // data.model是模版编译的时候生成的，来源compiler/codegen/index.js
  function transformModel (options, data) {
    var prop = (options.model && options.model.prop) || 'value';
    var event = (options.model && options.model.event) || 'input'
    ;(data.attrs || (data.attrs = {}))[prop] = data.model.value;
    var on = data.on || (data.on = {});
    var existing = on[event];
    var callback = data.model.callback;
    if (isDef(existing)) {
      if (
        Array.isArray(existing)
          ? existing.indexOf(callback) === -1
          : existing !== callback
      ) {
        on[event] = [callback].concat(existing);
      }
    } else {
      on[event] = callback;
    }
  }

  /*  */

  var warned = Object.create(null);
  var warnOnce = function (msg) {
    if (!warned[msg]) {
      warned[msg] = true;
      // eslint-disable-next-line no-console
      console.warn(("\n\u001b[31m" + msg + "\u001b[39m\n"));
    }
  };

  var onCompilationError = function (err, vm) {
    var trace = vm ? generateComponentTrace(vm) : '';
    throw new Error(("\n\u001b[31m" + err + trace + "\u001b[39m\n"))
  };

  var normalizeRender = function (vm) {
    var ref = vm.$options;
    var render = ref.render;
    var template = ref.template;
    var _scopeId = ref._scopeId;
    if (isUndef(render)) {
      if (template) {
        var compiled = compileToFunctions(template, {
          scopeId: _scopeId,
          warn: onCompilationError
        }, vm);

        vm.$options.render = compiled.render;
        vm.$options.staticRenderFns = compiled.staticRenderFns;
      } else {
        throw new Error(
          ("render function or template not defined in component: " + (vm.$options.name || vm.$options._componentTag || 'anonymous'))
        )
      }
    }
  };

  function waitForServerPrefetch (vm, resolve, reject) {
    var handlers = vm.$options.serverPrefetch;
    if (isDef(handlers)) {
      if (!Array.isArray(handlers)) { handlers = [handlers]; }
      try {
        var promises = [];
        for (var i = 0, j = handlers.length; i < j; i++) {
          var result = handlers[i].call(vm, vm);
          if (result && typeof result.then === 'function') {
            promises.push(result);
          }
        }
        Promise.all(promises).then(resolve).catch(reject);
        return
      } catch (e) {
        reject(e);
      }
    }
    resolve();
  }

  function renderNode (node, isRoot, context) {
    if (node.isString) {
      renderStringNode$1(node, context);
    } else if (isDef(node.componentOptions)) {
      renderComponent(node, isRoot, context);
    } else if (isDef(node.tag)) {
      renderElement(node, isRoot, context);
    } else if (isTrue(node.isComment)) {
      if (isDef(node.asyncFactory)) {
        // async component
        renderAsyncComponent(node, isRoot, context);
      } else {
        context.write(("<!--" + (node.text) + "-->"), context.next);
      }
    } else {
      context.write(
        node.raw ? node.text : escape(String(node.text)),
        context.next
      );
    }
  }

  function registerComponentForCache (options, write) {
    // exposed by vue-loader, need to call this if cache hit because
    // component lifecycle hooks will not be called.
    var register = options._ssrRegister;
    if (write.caching && isDef(register)) {
      write.componentBuffer[write.componentBuffer.length - 1].add(register);
    }
    return register
  }

  function renderComponent (node, isRoot, context) {
    var write = context.write;
    var next = context.next;
    var userContext = context.userContext;

    // check cache hit
    var Ctor = node.componentOptions.Ctor;
    var getKey = Ctor.options.serverCacheKey;
    var name = Ctor.options.name;
    var cache = context.cache;
    var registerComponent = registerComponentForCache(Ctor.options, write);

    if (isDef(getKey) && isDef(cache) && isDef(name)) {
      var rawKey = getKey(node.componentOptions.propsData);
      if (rawKey === false) {
        renderComponentInner(node, isRoot, context);
        return
      }
      var key = name + '::' + rawKey;
      var has = context.has;
      var get = context.get;
      if (isDef(has)) {
        has(key, function (hit) {
          if (hit === true && isDef(get)) {
            get(key, function (res) {
              if (isDef(registerComponent)) {
                registerComponent(userContext);
              }
              res.components.forEach(function (register) { return register(userContext); });
              write(res.html, next);
            });
          } else {
            renderComponentWithCache(node, isRoot, key, context);
          }
        });
      } else if (isDef(get)) {
        get(key, function (res) {
          if (isDef(res)) {
            if (isDef(registerComponent)) {
              registerComponent(userContext);
            }
            res.components.forEach(function (register) { return register(userContext); });
            write(res.html, next);
          } else {
            renderComponentWithCache(node, isRoot, key, context);
          }
        });
      }
    } else {
      if (isDef(getKey) && isUndef(cache)) {
        warnOnce(
          "[vue-server-renderer] Component " + (Ctor.options.name || '(anonymous)') + " implemented serverCacheKey, " +
          'but no cache was provided to the renderer.'
        );
      }
      if (isDef(getKey) && isUndef(name)) {
        warnOnce(
          "[vue-server-renderer] Components that implement \"serverCacheKey\" " +
          "must also define a unique \"name\" option."
        );
      }
      renderComponentInner(node, isRoot, context);
    }
  }

  function renderComponentWithCache (node, isRoot, key, context) {
    var write = context.write;
    write.caching = true;
    var buffer = write.cacheBuffer;
    var bufferIndex = buffer.push('') - 1;
    var componentBuffer = write.componentBuffer;
    componentBuffer.push(new Set());
    context.renderStates.push({
      type: 'ComponentWithCache',
      key: key,
      buffer: buffer,
      bufferIndex: bufferIndex,
      componentBuffer: componentBuffer
    });
    renderComponentInner(node, isRoot, context);
  }

  function renderComponentInner (node, isRoot, context) {
    var prevActive = context.activeInstance;
    // expose userContext on vnode
    node.ssrContext = context.userContext;
    var child = context.activeInstance = createComponentInstanceForVnode(
      node,
      context.activeInstance
    );
    normalizeRender(child);

    var resolve = function () {
      var childNode = child._render();
      childNode.parent = node;
      context.renderStates.push({
        type: 'Component',
        prevActive: prevActive
      });
      renderNode(childNode, isRoot, context);
    };

    var reject = context.done;

    waitForServerPrefetch(child, resolve, reject);
  }

  function renderAsyncComponent (node, isRoot, context) {
    var factory = node.asyncFactory;

    var resolve = function (comp) {
      if (comp.__esModule && comp.default) {
        comp = comp.default;
      }
      var ref = node.asyncMeta;
      var data = ref.data;
      var children = ref.children;
      var tag = ref.tag;
      var nodeContext = node.asyncMeta.context;
      var resolvedNode = createComponent(
        comp,
        data,
        nodeContext,
        children,
        tag
      );
      if (resolvedNode) {
        if (resolvedNode.componentOptions) {
          // normal component
          renderComponent(resolvedNode, isRoot, context);
        } else if (!Array.isArray(resolvedNode)) {
          // single return node from functional component
          renderNode(resolvedNode, isRoot, context);
        } else {
          // multiple return nodes from functional component
          context.renderStates.push({
            type: 'Fragment',
            children: resolvedNode,
            rendered: 0,
            total: resolvedNode.length
          });
          context.next();
        }
      } else {
        // invalid component, but this does not throw on the client
        // so render empty comment node
        context.write("<!---->", context.next);
      }
    };

    if (factory.resolved) {
      resolve(factory.resolved);
      return
    }

    var reject = context.done;
    var res;
    try {
      res = factory(resolve, reject);
    } catch (e) {
      reject(e);
    }
    if (res) {
      if (typeof res.then === 'function') {
        res.then(resolve, reject).catch(reject);
      } else {
        // new syntax in 2.3
        var comp = res.component;
        if (comp && typeof comp.then === 'function') {
          comp.then(resolve, reject).catch(reject);
        }
      }
    }
  }

  function renderStringNode$1 (el, context) {
    var write = context.write;
    var next = context.next;
    if (isUndef(el.children) || el.children.length === 0) {
      write(el.open + (el.close || ''), next);
    } else {
      var children = el.children;
      context.renderStates.push({
        type: 'Element',
        children: children,
        rendered: 0,
        total: children.length,
        endTag: el.close
      });
      write(el.open, next);
    }
  }

  function renderElement (el, isRoot, context) {
    var write = context.write;
    var next = context.next;

    if (isTrue(isRoot)) {
      if (!el.data) { el.data = {}; }
      if (!el.data.attrs) { el.data.attrs = {}; }
      el.data.attrs[SSR_ATTR] = 'true';
    }

    if (el.fnOptions) {
      registerComponentForCache(el.fnOptions, write);
    }

    var startTag = renderStartingTag(el, context);
    var endTag = "</" + (el.tag) + ">";
    if (context.isUnaryTag(el.tag)) {
      write(startTag, next);
    } else if (isUndef(el.children) || el.children.length === 0) {
      write(startTag + endTag, next);
    } else {
      var children = el.children;
      context.renderStates.push({
        type: 'Element',
        children: children,
        rendered: 0,
        total: children.length,
        endTag: endTag
      });
      write(startTag, next);
    }
  }

  function hasAncestorData (node) {
    var parentNode = node.parent;
    return isDef(parentNode) && (isDef(parentNode.data) || hasAncestorData(parentNode))
  }

  function getVShowDirectiveInfo (node) {
    var dir;
    var tmp;

    while (isDef(node)) {
      if (node.data && node.data.directives) {
        tmp = node.data.directives.find(function (dir) { return dir.name === 'show'; });
        if (tmp) {
          dir = tmp;
        }
      }
      node = node.parent;
    }
    return dir
  }

  function renderStartingTag (node, context) {
    var markup = "<" + (node.tag);
    var directives = context.directives;
    var modules = context.modules;

    // construct synthetic data for module processing
    // because modules like style also produce code by parent VNode data
    if (isUndef(node.data) && hasAncestorData(node)) {
      node.data = {};
    }
    if (isDef(node.data)) {
      // check directives
      var dirs = node.data.directives;
      if (dirs) {
        for (var i = 0; i < dirs.length; i++) {
          var name = dirs[i].name;
          if (name !== 'show') {
            var dirRenderer = resolveAsset(context, 'directives', name);
            if (dirRenderer) {
              // directives mutate the node's data
              // which then gets rendered by modules
              dirRenderer(node, dirs[i]);
            }
          }
        }
      }

      // v-show directive needs to be merged from parent to child
      var vshowDirectiveInfo = getVShowDirectiveInfo(node);
      if (vshowDirectiveInfo) {
        directives.show(node, vshowDirectiveInfo);
      }

      // apply other modules
      for (var i$1 = 0; i$1 < modules.length; i$1++) {
        var res = modules[i$1](node);
        if (res) {
          markup += res;
        }
      }
    }
    // attach scoped CSS ID
    var scopeId;
    var activeInstance = context.activeInstance;
    if (isDef(activeInstance) &&
      activeInstance !== node.context &&
      isDef(scopeId = activeInstance.$options._scopeId)
    ) {
      markup += " " + ((scopeId));
    }
    if (isDef(node.fnScopeId)) {
      markup += " " + (node.fnScopeId);
    } else {
      while (isDef(node)) {
        if (isDef(scopeId = node.context.$options._scopeId)) {
          markup += " " + scopeId;
        }
        node = node.parent;
      }
    }
    return markup + '>'
  }

  function createRenderFunction (
    modules,
    directives,
    isUnaryTag,
    cache
  ) {
    return function render (
      component,
      write,
      userContext,
      done
    ) {
      warned = Object.create(null);
      var context = new RenderContext({
        activeInstance: component,
        userContext: userContext,
        write: write, done: done, renderNode: renderNode,
        isUnaryTag: isUnaryTag, modules: modules, directives: directives,
        cache: cache
      });
      installSSRHelpers(component);
      normalizeRender(component);

      var resolve = function () {
        renderNode(component._render(), true, context);
      };
      waitForServerPrefetch(component, resolve, done);
    }
  }

  /*  */


  function createBasicRenderer (ref) {
    if ( ref === void 0 ) ref = {};
    var modules = ref.modules; if ( modules === void 0 ) modules = [];
    var directives = ref.directives; if ( directives === void 0 ) directives = {};
    var isUnaryTag = ref.isUnaryTag; if ( isUnaryTag === void 0 ) isUnaryTag = (function () { return false; });
    var cache = ref.cache;

    var render = createRenderFunction(modules, directives, isUnaryTag, cache);

    return function renderToString (
      component,
      context,
      done
    ) {
      if (typeof context === 'function') {
        done = context;
        context = {};
      }
      var result = '';
      var write = createWriteFunction(function (text) {
        result += text;
        return false
      }, done);
      try {
        render(component, write, context, function () {
          done(null, result);
        });
      } catch (e) {
        done(e);
      }
    }
  }

  /*  */

  var entryServerBasicRenderer = createBasicRenderer({
    modules: modules,
    directives: directives,
    isUnaryTag: isUnaryTag,
    canBeLeftOpenTag: canBeLeftOpenTag
  });

  return entryServerBasicRenderer;

})));
