<%@ Language=VBScript %>
<%

'----------------------------
'
'Date: 02/01/2000
'
'Author: Tyler Downs
'
'Description:
'This is a description of errors by number'
'
'Revised 9/7/00
'
'---------------------------


%>

<HTML>
<HEAD>
<META NAME="GENERATOR" Content="Microsoft FrontPage 4.0">
</HEAD>
<BODY>

<P><img border="0" src="images/error.wmf">&nbsp;</P>

<P>An Error Has Occurred. Please click the back button and try your request
again.</P>

<P>&nbsp;</P>

<P>Error Number:<%=request("ErrorNumber")%></P>

<P><%=request("Message")%>><%=request("Error")%></P>

</BODY>
</HTML>

