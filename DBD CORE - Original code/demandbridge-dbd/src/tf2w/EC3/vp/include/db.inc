<!-- #include file="adovbs.inc" -->
<%
'--------------------------------------------------------------------
' 
' Set the Connection to the Sql Sever or access database
' Set the local path to the fontfile and working directories
' Author Tyler Downs
' (c) 2000 E-ZOrder
' <!-- #include file="include/db.inc" -->
' http://www.e-zorder.com
'--------------------------------------------------------------------

Dim dbc
Dim strConn
Dim strpath
Dim fontfile
Dim tempPath

tempPath = "C:\Inetpub\wwwroot\vp\web\Templates\"

'Connection String for SQL SERVER
'strConn = "DSN=cust_serv;DRIVER={SQL Server};UID=sa;PWD=sqlserver"


'Connection String for Access Database
strConn = "DSN=web_vp_db;DRIVER=Microsoft Access Driver (*.mdb);"

Set dbc = Server.CreateObject("ADODB.Connection")
dbc.open strConn
%>