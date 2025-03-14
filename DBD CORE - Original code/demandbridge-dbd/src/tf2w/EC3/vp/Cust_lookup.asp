<%@ Language=VBScript %>
<!-- #include file="include/db.inc" -->
<%
'----------------------------
'
'Date: 02/01/2000
'
'Author: Tyler Downs
'
'Description:
'This page displays the product thumbnail images and asks for the users
'Email address
'Need to Pass the Product ID and the Customer ID
'
'---------------------------


'Process the Varriables
productid= request("productid")
customerid = request("customerid")

'This is the Form Processing
if request("email") <> "" then
	email = request("email")
	productid = request("productid")
	companyid = request("companyid")
	Set rspeople = server.createobject("adodb.recordset")
	str = "SELECT Tbl_People.Email, Tbl_People.peopleid FROM Tbl_People WHERE Tbl_People.Email ='" & email & "' and tbl_people.tfcustid ='" & customerid & "'"
	rspeople.open str, dbc, 3, 3

	'If the person was found move onto the verify page
	'If the person was NOT Found move to the Add New User Page
	if rspeople.recordcount > 0 then
		response.redirect "Verify.asp?customerid=" & customerid &"&productid=" & productid & "&peopleid=" & rspeople("peopleid")
	else
		response.redirect "User_Add.asp?customerid=" & customerid &"&productid=" & productid & "&Email=" & email
	end if
	set rspeople = nothing
	response.end
end if
'End of Form Processing

%>
<HTML>
<HEAD>
<SCRIPT LANGUAGE="JavaScript">
<!--
function validemail(form) {
  var email = form.Email.value;   
  if (!email) {
    alert("Please enter an Email Address.");
    return false;
  } else {
        return true;
      }
}
// -->
</SCRIPT>
</HEAD>
<body>
<form method="POST" action="Cust_Lookup.asp" name=form onsubmit="return validemail(this)"> 
<div align="center">
<table cellspacing="0" cellpadding="2" border="0" width="100%" style="border-collapse: collapse" bordercolor="#111111">
<tr>
<td valign="top" bordercolor="#FFFFFF" bgcolor="#F0F0F0" align="center">
<br>
<img border=0 src="templates/<%=productid%>.jpg">    
<br>
  &nbsp;
</td>
</tr>
  <tr>
    <td bordercolor="#C0C0C0" bgcolor="#FFFFFF" align="center">
<font face="Trebuchet MS" size="2">
 Enter the e-mail address of the person you are ordering for below:	
</font>
    </td>
  </tr>
</table>
 <table border="0" cellpadding="3" cellspacing="0" width="100%" style="border-collapse: collapse" bordercolor="#111111" align="center">
  <tbody>
    <tr>
      <td bgcolor="#F0F0F0" align="center">
        <p><input type="text" name="Email" size="25" value="">&nbsp;<input type="submit" value="Submit" tabindex="0"></td>
    </tr>
    <tr>
      <td bgcolor="#FFFFFF" align="center">
        &nbsp;</td>
    </tr>
  <tr>
    <td bgcolor="#F0F0F0" align="center">
      <font face="Trebuchet MS" size="2">If you do not have an E-mail address, <a href = "Verify.asp?customerid=<%=customerid%>&productid=<%=productid%>">click here</a> to continue.</font></td>
  </tr>
  </tbody>
  </table>
</table>
</div>
<input type="hidden" name="productid" value="<%=productid%>">
<input type="hidden" name="customerid" value="<%=customerid%>">
</form>
</body>
</HTML>
<% set dbc = nothing %>