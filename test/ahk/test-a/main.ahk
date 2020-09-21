; #Include <Comment>
#Include <LocalLibClass>
#Include ./otherscript.ahk
#Include ./otherscript2.ahk
#Include %A_LineFile%\..\lib\nestlib
#Include NestFolderLib.ahk
#Include NestFolderLib2.ahk
LocalLib_MsgBox(StrSplit(A_ScriptName, ".")[1])