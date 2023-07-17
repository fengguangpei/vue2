/* @flow */

import { baseOptions } from "./options";
import { createCompiler } from "compiler/index";

const { compile, compileToFunctions } = createCompiler(baseOptions);
// compileToFunctions: 模版编译成render函数
export { compile, compileToFunctions };
