@echo off
REM scripts/neo4j.bat - thin wrapper over D:\prerequisite\neo4j
setlocal
set "JAVA_HOME=D:\prerequisite\jdk-21"
set "NEO4J_HOME=D:\prerequisite\neo4j"
set "NEO4J_BAT=%NEO4J_HOME%\bin\neo4j.bat"
set "CYPHER_SHELL=%NEO4J_HOME%\bin\cypher-shell.bat"
set "NEO4J_USER=neo4j"
set "NEO4J_PASS=reposcope"

if not exist "%NEO4J_BAT%" (
  echo [ERROR] Neo4j not found at %NEO4J_BAT%
  echo Install it under D:\prerequisite\neo4j\bin\neo4j.bat first.
  exit /b 1
)

if "%1"=="" goto usage
if /I "%1"=="start"   goto start
if /I "%1"=="stop"    goto stop
if /I "%1"=="status"  goto status
if /I "%1"=="console" goto console
if /I "%1"=="schema"  goto schema
goto usage

:start
"%NEO4J_BAT%" start
goto end
:stop
"%NEO4J_BAT%" stop
goto end
:status
"%NEO4J_BAT%" status
goto end
:console
"%NEO4J_BAT%" console
goto end
:schema
REM Apply uniqueness constraints from scripts/kg/schema.cypher.
REM %~dp0 is the directory containing this .bat (i.e. scripts\)
set "PATH=%JAVA_HOME%\bin;%PATH%"
if not exist "%JAVA_HOME%\bin\java.exe" (
  echo [ERROR] java.exe not found at %JAVA_HOME%\bin\java.exe
  echo Fix JAVA_HOME in this file, or install Temurin JDK 21 at D:\prerequisite\jdk-21
  exit /b 1
)
"%CYPHER_SHELL%" -u "%NEO4J_USER%" -p "%NEO4J_PASS%" -f "%~dp0kg\schema.cypher"
goto end
:usage
echo Usage: scripts\neo4j.bat {start^|stop^|status^|console^|schema}
exit /b 1
:end
endlocal