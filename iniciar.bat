@echo off
cd /d "%~dp0"
echo Subindo Postgres local...
call docker compose up -d
echo Aplicando migrations...
call npm run migrate
echo Iniciando o portal em http://localhost:3000
call npm run dev
pause
