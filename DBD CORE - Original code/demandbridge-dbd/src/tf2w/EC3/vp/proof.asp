<%@ Language=VBScript %>
<%
'----------------------------
'
'Date: 02/01/2000
'
'Author: Tyler Downs
'
'Description: 
'This is the final Page in the Loop
'This page releases the proof back to
'TopForm. The Proof Gets moved to the storage Directory 
'and the querystring gets passed back to the TopForm Server
'
'---------------------------
productid = Request("ProductID")
peopleid = request("peopleid")
customerid = request("customerid")
sessionid = right(session.SessionID,5)	

if request("action") <> "" then

	if session("Tfsession") <> "" then
		

		' Let's now dynamically retrieve the current directory
		Dim sScriptDir
		sScriptDir = Request.ServerVariables("SCRIPT_NAME")
		sScriptDir = StrReverse(sScriptDir)
		sScriptDir = Mid(sScriptDir, InStr(1, sScriptDir, "/"))
		sScriptDir = StrReverse(sScriptDir)
		sPath = Server.MapPath(sScriptDir) & "\"
		
		'This Would Zip The File
		'Set Executor = Server.CreateObject("ASPExec.Execute")
		'Executor.Application = sPath & "storage\zipprint.bat"
		'Executor.Parameters = "tf" & sessionid & "-" & session("count")& " " & sessionid
		'Executor.ShowWindow = false
		'strResult = Executor.ExecuteWinApp
		'set executor = nothing
		address = Session("Tfweb")&"?basic=" & Session("TfBasic") & "&session_id=" & Session("TfSession") & "&template=" & Session("Tftemplate") & "&item_key=" & Session("TfTypeID") & "&quantity=" & Session("Tfqty") & "&3p_id=e-zorder" & "&3p_info_1=" & "tf" & sessionid & "-" & session("count")& "&3p_info_2=" & Session("TfCustomerID") 
	
		Response.Redirect (address)
		Session.Abandon
		response.end
	end if
end if
%>
<HTML>
<HEAD>
<script>
browsername=navigator.appName;
platform = navigator.userAgent;
if (browsername.indexOf("Netscape")!=-1) {browsername="NS"}
else
{if (browsername.indexOf("Microsoft")!=-1) 

{browsername="MSIE";
if (platform.indexOf("Mac")!=-1) {browsername="NS"}
}
  else {browsername="N/A"}};
  
function getit() 
{

	if (browsername=="NS"){	pdf=window.open('/proof/<%=request("proof")%>.pdf','pdf','toolbar=no,location=no,status=nomenubar=no,scrollbars=auto,resizable=yes,dependant=yes,width=400,height=345.521885521886,screenX=200,screenY=80,left=200,top=80')}
}

function openpdfwindow() {

if (pdf=="") {pdf=window.open('/proof/<%=request("proof")%>.pdf','pdf','toolbar=no,location=no,status=nomenubar=no,scrollbars=auto,resizable=yes,dependant=yes,width=400,height=345.521885521886,screenX=200,screenY=80,left=200,top=80')}

if (pdf.closed) {pdf=window.open('/proof/<%=request("proof")%>.pdf','pdf','toolbar=no,location=no,status=nomenubar=no,scrollbars=auto,resizable=yes,dependant=yes,width=400,height=345.521885521886,screenX=200,screenY=80,left=200,top=80')}

pdf.focus();

}

</script>
</HEAD>
<body onload="getit()">
<form action="proof.asp" method="POST" id="form1" name="form1">
<div align="center">
<table border="0" cellpadding="3" cellspacing="0" width="721" style="border-collapse: collapse" bordercolor="#111111">
<tr>
<td width="715" bgcolor="#FFFFFF" align="right" colspan="3">
<p align="center"><font face="Trebuchet MS" size="2"><b>If your
proof is correct please click Approve.<br>If you would like to make
changes please click the edit button.</b></font>
<br>
<br>
<font color="#FF0000"> 
<script>
if (browsername=="NS"){document.writeln("Because of the Internet Browser that you are using your proof will appear in another window!")}
</script>
</font></td>
</tr>
<tr>
<td width="715" bgcolor="#F0F0F0" align="center" colspan="3">
<p>
</p>
<object CLASSID="clsid:CA8A9780-280D-11CF-A24D-444553540000" width="555" height="436.161616161616"><PARAM NAME="SRC" VALUE="./proof/<%=request("proof")%>.pdf">
  <param name="_Version" value="65539">
  <param name="_ExtentX" value="14684">
  <param name="_ExtentY" value="11536">
  <param name="_StockProps" value="0">
</object>
<p>&nbsp;</p>
</td>
</tr>
<tr>
<td width="180" bgcolor="#FFFFFF" align="center" nowrap>
</td>
<td width="179" bgcolor="#FFFFFF" align="center">
<input type="submit" value="Approve" name="action" style="font-family: Trebuchet MS; font-weight: bold; float:left">
</td>
<td width="350" bgcolor="#FFFFFF" align="center">
<input type="button" value="   Edit   " name="edit" onClick="window.location='verify.asp?productid=<%=productid%>&peopleid=<%=peopleid%>&customerid=<%=customerid%>'" style="font-family: Trebuchet MS; font-weight: bold">
</td>
</tr>
<tr>
<td width="359" bgcolor="#F0F0F0" align="center" colspan="2">&nbsp;</td>
<td width="350" bgcolor="#F0F0F0" align="center">&nbsp;</td>
</tr>
</table>
</div>
</form>
</body>
</HTML>