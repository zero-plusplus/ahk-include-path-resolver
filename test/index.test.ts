import * as assert from 'assert';
import * as path from 'path';
import Resolver from '../src/index';
import evalBuiltinVariableAhk from './lib/evalBuiltinVariableAhk';

const supportVariableNames = [
  'A_AhkPath',
  'A_AppData',
  'A_AppDataCommon',
  'A_ComputerName',
  'A_ComSpec',
  'A_Desktop',
  'A_DesktopCommon',
  'A_LineFile',
  'A_MyDocuments',
  'A_ProgramFiles',
  'A_Programs',
  'A_ProgramsCommon',
  'A_ScriptDir',
  'A_ScriptFullPath',
  'A_ScriptName',
  'A_Space',
  'A_StartMenu',
  'A_StartMenuCommon',
  'A_Startup',
  'A_StartupCommon',
  'A_Tab',
  'A_Temp',
  'A_UserName',
  'A_WinDir',
  'A_WorkingDir',
];

const ahkV1RuntimePath = path.resolve('./bin/AutoHotkey_V1_30_01_U64.exe');
const ahkV2RuntimePath = path.resolve('./bin/AutoHotkey_V2_a108_a2fa0498_U64.exe');
const evalBuiltinVariableAhk_v1 = (variableName): string => evalBuiltinVariableAhk(ahkV1RuntimePath, 1, variableName);
const evalBuiltinVariableAhk_v2 = (variableName): string => evalBuiltinVariableAhk(ahkV2RuntimePath, 2, variableName);
const targetPath = path.resolve('./*'); // standard input


suite('Dereference variable', (): void => {
  const resolver_v1 = new Resolver({
    runtimePath: ahkV1RuntimePath,
    rootPath: targetPath,
    version: 1,
  });
  const resolver_v2 = new Resolver({
    runtimePath: ahkV2RuntimePath,
    rootPath: targetPath,
    version: 2,
  });
  test('For AutoHotkey v1', () => {
    for (const variableName of supportVariableNames) {
      const actual = resolver_v1.dereference(variableName);
      const expected = evalBuiltinVariableAhk_v1(variableName);
      assert.equal(actual, expected, `${variableName}`);
    }
  });
  test('For AutoHotkey v2', () => {
    for (const variableName of supportVariableNames) {
      if ([ 'A_LineFile', 'A_ScriptFullPath' ].includes(variableName)) {
        // Probably AutoHotkey bug. Unlike v1, these two variables return only "*" without the directory path.
        continue;
      }
      const actual = resolver_v2.dereference(variableName);
      const expected = evalBuiltinVariableAhk_v2(variableName);
      assert.equal(actual, expected, `${variableName}`);
    }
  });
});

suite('Parse include line', () => {
  suite('For AutoHotkey v1', () => {
    const resolver_v1 = new Resolver({
      runtimePath: `${String(process.env.ProgramFiles)}/AutoHotkey/AutoHotkey.exe`,
      rootPath: `${__dirname}/test-a/ahk/LibrariesOfFunction.ahk`,
      version: 1,
    });
    test('include line', () => {
      const includeLine = '#Include %A_LineFile%\\..\\otherscript.ahk';
      const parsedInclude = resolver_v1.parseInclude(includeLine);
      if (parsedInclude === null) {
        assert.fail('Failed parse.');
      }

      assert.equal(parsedInclude.path, '%A_LineFile%\\..\\otherscript.ahk');
      assert.equal(parsedInclude.isAgainMode, false);
      assert.equal(parsedInclude.isOptional, false);
    });
    test('Optional include line', () => {
      const includeLine = '#Include *i %A_LineFile%\\..\\otherscript.ahk';
      const parsedInclude = resolver_v1.parseInclude(includeLine);
      if (parsedInclude === null) {
        assert.fail('Failed parse.');
      }

      assert.equal(parsedInclude.path, '%A_LineFile%\\..\\otherscript.ahk');
      assert.equal(parsedInclude.isAgainMode, false);
      assert.equal(parsedInclude.isOptional, true);
    });
    test('Include again line', () => {
      const includeLine = '#IncludeAgain %A_LineFile%\\..\\otherscript.ahk';
      const parsedInclude = resolver_v1.parseInclude(includeLine);
      if (parsedInclude === null) {
        assert.fail('Failed parse.');
      }

      assert.equal(parsedInclude.path, '%A_LineFile%\\..\\otherscript.ahk');
      assert.equal(parsedInclude.isAgainMode, true);
      assert.equal(parsedInclude.isOptional, false);
    });
    test('Optional include again line', () => {
      const includeLine = '#IncludeAgain *i %A_LineFile%\\..\\otherscript.ahk';
      const parsedInclude = resolver_v1.parseInclude(includeLine);
      if (parsedInclude === null) {
        assert.fail('Failed parse.');
      }

      assert.equal(parsedInclude.path, '%A_LineFile%\\..\\otherscript.ahk');
      assert.equal(parsedInclude.isAgainMode, true);
      assert.equal(parsedInclude.isOptional, true);
    });
    test('Library include line', () => {
      const includeLine = '#IncludeAgain <libscript>';
      const parsedInclude = resolver_v1.parseInclude(includeLine);
      if (parsedInclude === null) {
        assert.fail('Failed parse.');
      }

      assert.equal(parsedInclude.path, `${resolver_v1.getLibraryDir('local')}/libscript.ahk`);
      assert.equal(parsedInclude.isAgainMode, true);
      assert.equal(parsedInclude.isOptional, false);
    });
    test('Library include again line', () => {
      const includeLine = '#IncludeAgain <libscript>';
      const parsedInclude = resolver_v1.parseInclude(includeLine);
      if (parsedInclude === null) {
        assert.fail('Failed parse.');
      }

      assert.equal(parsedInclude.path, `${resolver_v1.getLibraryDir('local')}/libscript.ahk`);
      assert.equal(parsedInclude.isAgainMode, true);
      assert.equal(parsedInclude.isOptional, false);
    });
    test('Optional library include again line', () => {
      const includeLine = '#IncludeAgain *i <libscript>';
      const parsedInclude = resolver_v1.parseInclude(includeLine);
      if (parsedInclude === null) {
        assert.fail('Failed parse.');
      }

      assert.equal(parsedInclude.path, `${resolver_v1.getLibraryDir('local')}/libscript.ahk`);
      assert.equal(parsedInclude.isAgainMode, true);
      assert.equal(parsedInclude.isOptional, true);
    });
  });

  suite('extractAllIncludePath', () => {
    test('v1', () => {
      const resolver_v1 = new Resolver({
        runtimePath: `${String(process.env.ProgramFiles)}/AutoHotkey/AutoHotkey.exe`,
        rootPath: `${__dirname}/ahk/test-a/main.ahk`,
        version: 1,
      });

      const sortCallback = (a: string, b: string): number => a.localeCompare(b);
      const actual = resolver_v1.extractAllIncludePath([ 'local' ]).sort(sortCallback);
      const expected = [
        path.resolve(`${__dirname}/ahk/test-a/lib/LocalLib.ahk`),
        path.resolve(`${__dirname}/ahk/test-a/lib/LocalLibClass.ahk`),
        path.resolve(`${__dirname}/ahk/test-a/lib/nestlib/NestFolderLib.ahk`),
        path.resolve(`${__dirname}/ahk/test-a/lib/nestlib/NestFolderLib2.ahk`),
        path.resolve(`${__dirname}/ahk/test-a/lib/NestLib.ahk`),
        path.resolve(`${__dirname}/ahk/test-a/otherscript.ahk`),
        path.resolve(`${__dirname}/ahk/test-a/otherscript2.ahk`),
      ].sort(sortCallback);
      assert.deepEqual(actual, expected);
    });
    test('v1 pattern 2', () => {
      const resolver_v1 = new Resolver({
        runtimePath: `${String(process.env.ProgramFiles)}/AutoHotkey/AutoHotkey.exe`,
        rootPath: `${__dirname}/ahk/test-b/main.ahk`,
        version: 1,
      });

      const sortCallback = (a: string, b: string): number => a.localeCompare(b);
      const actual = resolver_v1.extractAllIncludePath([ 'local' ]).sort(sortCallback);
      const expected = [
        path.resolve(`${__dirname}/ahk/test-b/lib/c.ahk`),
        path.resolve(`${__dirname}/ahk/test-b/module/a.ahk`),
        path.resolve(`${__dirname}/ahk/test-b/module/b.ahk`),
      ].sort(sortCallback);
      assert.deepEqual(actual, expected);
    });
  });
});
