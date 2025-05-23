/* @flow */

import { parse } from "./parser/index";
import { optimize } from "./optimizer";
import { generate } from "./codegen/index";
import { createCompilerCreator } from "./create-compiler";

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
function baseCompile(
  template: string,
  options: CompilerOptions
): CompiledResult {
  // 模版解析阶段，生成抽象语法树AST
  const ast = parse(template.trim(), options);
  // 优化阶段，遍历AST，找出静态节点，打上标签
  if (options.optimize !== false) {
    optimize(ast, options);
  }
  // 代码生成阶段，将AST转换为渲染函数
  const code = generate(ast, options);
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns,
  };
}
export const createCompiler = createCompilerCreator(baseCompile);
