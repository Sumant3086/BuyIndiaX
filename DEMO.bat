@echo off
echo ========================================
echo   BuyIndiaX DevOps Demo
echo   Terraform + Puppet + Nagios
echo ========================================
echo.

echo [1] Showing Terraform Configuration...
echo.
type terraform\buyindiax.tf | findstr /C:"resource" /C:"ami" /C:"instance_type"
echo.
timeout /t 3 /nobreak >nul

echo [2] Showing Puppet Configuration...
echo.
type puppet\buyindiax_deploy.pp | findstr /C:"file" /C:"service" /C:"exec"
echo.
timeout /t 3 /nobreak >nul

echo [3] Showing Nagios Monitoring Config...
echo.
type nagios\buyindiax_monitoring.cfg | findstr /C:"define" /C:"host_name" /C:"service_description"
echo.
timeout /t 3 /nobreak >nul

echo [4] Getting Deployment Status...
echo.
cd terraform
terraform output
cd ..
echo.

echo ========================================
echo   NAGIOS MONITORING LINK
echo ========================================
echo.
echo URL: http://54.221.121.129/nagios4
echo Login: nagiosadmin / nagiosadmin
echo.
echo Application: http://107.21.78.120:3000
echo.
echo ========================================

pause
