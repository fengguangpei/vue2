/**
 * Not type-checking this file because it's mostly vendor code.
 */

/*!
 * HTML Parser By John Resig (ejohn.org)
 * Modified by Juriy "kangax" Zaytsev
 * Original code by Erik Arvidsson (MPL-1.1 OR Apache-2.0 OR GPL-2.0-or-later)
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 */
// 陈规HTML标签解析器
import { makeMap, no } from "shared/util";
import { isNonPhrasingTag } from "web/compiler/util";
import { unicodeRegExp } from "core/util/lang";

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
const attribute =
  /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
const dynamicArgAttribute =
  /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+?\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`;
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTagOpen = new RegExp(`^<${qnameCapture}`);
const startTagClose = /^\s*(\/?)>/;
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);
const doctype = /^<!DOCTYPE [^>]+>/i;
// #7298: escape - to avoid being passed as HTML comment when inlined in page
// HTML注释正则表达式
const comment = /^<!\--/;
// HTML降级条件注释
const conditionalComment = /^<!\[/;

// Special Elements (can contain anything)
export const isPlainTextElement = makeMap("script,style,textarea", true);
const reCache = {};

const decodingMap = {
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&amp;": "&",
  "&#10;": "\n",
  "&#9;": "\t",
  "&#39;": "'",
};
const encodedAttr = /&(?:lt|gt|quot|amp|#39);/g;
const encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g;

// #5992
const isIgnoreNewlineTag = makeMap("pre,textarea", true);
const shouldIgnoreFirstNewline = (tag, html) =>
  tag && isIgnoreNewlineTag(tag) && html[0] === "\n";

function decodeAttr(value, shouldDecodeNewlines) {
  const re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr;
  return value.replace(re, (match) => decodingMap[match]);
}

export function parseHTML(html, options) {
  const stack = []; // 维护AST节点层级的栈
  const expectHTML = options.expectHTML;
  const isUnaryTag = options.isUnaryTag || no;
  const canBeLeftOpenTag = options.canBeLeftOpenTag || no; // 用来检测一个标签是否是可以省略闭合标签的非自闭合标签
  let index = 0; // 解析游标
  let last, // 存储剩余还未解析的模版字符串
    lastTag; // 存储位于stack栈顶的元素
  while (html) {
    last = html;
    // Make sure we're not in a plaintext content element like script/style
    // 确保即将parse的内容不是在纯文本标签里面（script、style、textarea）
    if (!lastTag || !isPlainTextElement(lastTag)) {
      let textEnd = html.indexOf("<");
      // textEnd代表文本的结束位置
      if (textEnd === 0) {
        // Comment: 普通注释
        if (comment.test(html)) {
          const commentEnd = html.indexOf("-->");

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
          const conditionalEnd = html.indexOf("]>");

          if (conditionalEnd >= 0) {
            advance(conditionalEnd + 2);
            continue;
          }
        }

        // Doctype:
        const doctypeMatch = html.match(doctype);
        if (doctypeMatch) {
          advance(doctypeMatch[0].length);
          continue;
        }

        // End tag: 结束标签
        const endTagMatch = html.match(endTag);
        if (endTagMatch) {
          const curIndex = index;
          // 比如当前html为：'</p></div>'
          // endTagMatch[0]: '</p>'
          // endTagMatch[1]: 'p'
          advance(endTagMatch[0].length);
          parseEndTag(endTagMatch[1], curIndex, index);
          continue;
        }

        // Start tag: 开始标签
        const startTagMatch = parseStartTag();
        if (startTagMatch) {
          handleStartTag(startTagMatch);
          if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
            advance(1);
          }
          continue;
        }
      }
      // 文本标签
      let text, rest, next;
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
          if (next < 0) break;
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
      let endTagLength = 0;
      const stackedTag = lastTag.toLowerCase();
      const reStackedTag =
        reCache[stackedTag] ||
        (reCache[stackedTag] = new RegExp(
          "([\\s\\S]*?)(</" + stackedTag + "[^>]*>)",
          "i"
        ));
      const rest = html.replace(reStackedTag, function (all, text, endTag) {
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
      index += html.length - rest.length;
      html = rest;
      parseEndTag(stackedTag, index - endTagLength, index);
    }
    // 将整个字符串作为文本对待
    if (html === last) {
      options.chars && options.chars(html);
      if (
        process.env.NODE_ENV !== "production" &&
        !stack.length &&
        options.warn
      ) {
        options.warn(`Mal-formatted tag at end of template: "${html}"`, {
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
    const start = html.match(startTagOpen);
    if (start) {
      const match = {
        tagName: start[1],
        attrs: [],
        start: index,
      };
      advance(start[0].length);
      let end, attr;
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
    const tagName = match.tagName;
    const unarySlash = match.unarySlash;

    if (expectHTML) {
      if (lastTag === "p" && isNonPhrasingTag(tagName)) {
        parseEndTag(lastTag);
      }
      if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
        parseEndTag(tagName);
      }
    }

    const unary = isUnaryTag(tagName) || !!unarySlash;

    const l = match.attrs.length;
    const attrs = new Array(l);
    for (let i = 0; i < l; i++) {
      const args = match.attrs[i];
      const value = args[3] || args[4] || args[5] || "";
      const shouldDecodeNewlines =
        tagName === "a" && args[1] === "href"
          ? options.shouldDecodeNewlinesForHref
          : options.shouldDecodeNewlines;
      attrs[i] = {
        name: args[1],
        value: decodeAttr(value, shouldDecodeNewlines),
      };
      if (process.env.NODE_ENV !== "production" && options.outputSourceRange) {
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
    let pos, lowerCasedTagName;
    if (start == null) start = index;
    if (end == null) end = index;

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
      for (let i = stack.length - 1; i >= pos; i--) {
        if (
          process.env.NODE_ENV !== "production" &&
          (i > pos || !tagName) &&
          options.warn
        ) {
          options.warn(`tag <${stack[i].tag}> has no matching end tag.`, {
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
