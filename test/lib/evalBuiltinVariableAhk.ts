import { resolve } from 'path';
import { spawnSync } from 'child_process';

const createInvaridError = (variableName: string): Error => new Error(`${variableName} is not a built-in variable.`);
/**
 * @param runtimePath
 * @param version
 * @param variableName
 */
const evalBuiltinVariableAhk = function(runtimePath: string, version: 1 | 2, variableName: string): string {
  if (!variableName.match(/^A_[a-zA-Z]+$/ui)) {
    throw createInvaridError(variableName);
  }

  const code = version === 1
    ? `FileAppend, %${variableName}%, *`
    : `variableName := "${variableName}", FileAppend(%variableName%, "*")`;

  const result = spawnSync(resolve(runtimePath), [ '/ErrorStdOut', '*' ], { input: code });
  if (typeof result.error === typeof Error) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw result.error;
  }
  const derefrenceValue = result.stdout.toString();
  if (derefrenceValue === '') {
    throw createInvaridError(variableName);
  }
  return derefrenceValue;
};

export default evalBuiltinVariableAhk;
