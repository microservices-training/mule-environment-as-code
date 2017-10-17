echo off

echo === Deployment has started ===
set fileName=%1

IF "%fileName%"=="" (
	echo ERROR: Please, pass the filename of the environment descriptor as an argument!
	exit /b 1
)

echo === Invoke anypoint API ===

node .mule/deployment-method/deployment-methods.js %fileName%
IF %ERRORLEVEL% NEQ 0 GOTO ProcessError


echo === Deployment has finished successfully ! ===
exit /b 0

:ProcessError
echo === ERROR: Error during deployment
exit /b 1