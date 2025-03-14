<%@ Language=VBScript %>
<%
'----------------------------
'
'Date: 02/01/2000
'
'Author: Tyler Downs
'
'Description: This page checks
'the proof directory for the
'existance of the proof in the
'proof directory. Displays the
'Please wait message to the user
'
'Modified 09/10/2000
'---------------------------

Response.Buffer =true
dim productid
dim sessionid,phoneid,addressid

' Let's now dynamically retrieve the current directory
Dim sScriptDir
sScriptDir = Request.ServerVariables("SCRIPT_NAME")
sScriptDir = StrReverse(sScriptDir)
sScriptDir = Mid(sScriptDir, InStr(1, sScriptDir, "/"))
sScriptDir = StrReverse(sScriptDir)
sPath = Server.MapPath(sScriptDir) & "\"


productid = Request("ProductID")
peopleid = request("peopleid")
customerid = request("customerid")
sessionid = right(Session.SessionID ,5)

if trim(request("done")) = "" then
	Response.Write "<HTML>"
	Response.Write "<HEAD>"
	Response.Write "<meta http-equiv=" & chr(34) & "refresh" & chr(34) & " content=" & chr(34) &"2; url=checkproof.asp?Done=1" & "&ProductID=" & productid & "&peopleid=" & peopleid & "&customerid=" & customerid &  chr(34) & ">"
	Response.Write "</HEAD>"
	Response.Write "<BODY>"
	Response.Write "<p>"
	Response.Write "&nbsp"
	Response.Write "</p>"
	Response.Write "<p>"
	Response.Write "&nbsp"
	Response.Write "</p>"
	Response.Write "<p align=center><img border=0 src=images/please_wait.gif width=250 height=75></p>"
	Response.Write "</BODY>"
	Response.Write "</HTML>"
	response.end
end if

x = reportfilestatus(spath & "proof\" & sessionid & ".pdf")
if x <> 0 then
	Response.Write "<HTML>"
	Response.Write "<HEAD>"
	Response.Write "<meta http-equiv=" & chr(34) & "refresh" & chr(34) & " content=" & chr(34) &"2; url=checkproof.asp?Done=1" & "&ProductID="  & productid & "&peopleid=" & peopleid & "&customerid=" & customerid &  chr(34) & ">"
	Response.Write "</HEAD>"
	Response.Write "<BODY>"
	Response.Write "<p>"
	Response.Write "&nbsp"
	Response.Write "</p>"
	Response.Write "<p>"
	Response.Write "&nbsp"
	Response.Write "</p>"
	Response.Write "<p align=center><img border=0 src=images/please_wait.gif width=250 height=75></p>"
	Response.Write "</BODY>"
	Response.Write "</HTML>"
else
	y = ShowFileAccessInfo( spath & "proof\" & sessionid & ".pdf")
	if y < 1 then
		Response.Write "<HTML>"
		Response.Write "<HEAD>"
		Response.Write "<meta http-equiv=" & chr(34) & "refresh" & chr(34) & " content=" & chr(34) &"2; url=printing_proof.asp?Done=1" & "&ProductID=" & productid & "&peopleid=" & peopleid & "&customerid=" & customerid & chr(34) & ">"
		Response.Write "</HEAD>"
		Response.Write "<BODY>"
		Response.Write "<p>"
		Response.Write "&nbsp"
		Response.Write "</p>"
		Response.Write "<p>"
		Response.Write "&nbsp"
		Response.Write "</p>"
		Response.Write "<p align=center><img border=0 src=images/please_wait.gif width=250 height=75></p>"
		Response.Write "</BODY>"
		Response.Write "</HTML>"
	else
		Response.Redirect "proof.asp?Proof=" & sessionid & "&ProductID="  & productid & "&peopleid=" & peopleid & "&customerid=" & customerid
	end if
end if



Function ReportFileStatus(filespec)
   Dim fso, msg
   Set fso = CreateObject("Scripting.FileSystemObject")
   If (fso.FileExists(filespec)) Then
      msg = 0
   Else
      msg = -1
   End If
   ReportFileStatus = msg
   set fso = nothing
End Function

Function ShowFileAccessInfo(filespec)
   Dim fso, f, s
   Set fso = CreateObject("Scripting.FileSystemObject")
   Set f = fso.GetFile(filespec)
   s = f.size   
   ShowFileAccessInfo = s
   set f = nothing
   set fso = nothing
  
End Function


%>