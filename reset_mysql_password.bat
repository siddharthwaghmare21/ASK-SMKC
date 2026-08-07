@echo off
echo =======================================
echo MySQL Root Password Reset Script
echo =======================================
echo.
echo Stopping MySQL Service...
net stop MySQL84

echo Creating initialization file...
echo ALTER USER 'root'@'localhost' IDENTIFIED BY 'siddharth_21A'; > "C:\mysql-init.txt"

echo Resetting Password (this will take about 10 seconds)...
start /B "" "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --defaults-file="C:\ProgramData\MySQL\MySQL Server 8.4\my.ini" --init-file="C:\mysql-init.txt"

:: Wait for 10 seconds to allow mysqld to process the file
ping 127.0.0.1 -n 12 > nul

echo Stopping temporary MySQL process...
taskkill /F /IM mysqld.exe > nul 2>&1

echo Starting MySQL Service normally...
net start MySQL84

echo Cleaning up...
del "C:\mysql-init.txt"

echo.
echo =======================================
echo DONE! Password is now: siddharth_21A
echo =======================================
pause
