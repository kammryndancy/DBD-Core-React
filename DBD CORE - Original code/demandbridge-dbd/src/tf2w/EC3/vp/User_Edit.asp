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
'This Page is called from the verfiy page
'it is used to edit a users information
'where the user already exists in the system
'
'---------------------------

productid = request("productid")
companyid = request("companyid")
peopleid = request("peopleid")
if trim(request("act")) <> "" then
Select Case Ucase(Left(Trim(request("act")),3))
	case "SAV"
	'update info
	if request("primary") <> "" then
		Select Case request("primary")
			case 0 
				bestmethod = "HomePhone"
			case 1
				bestmethod = "WorkPhone"
			case 2
				bestmethod = "MobilePhone"
			case 3
				bestmethod = "FaxPhone"
		end select
	end if

	set rsup = server.createobject("adodb.recordset")
	strsql = "UPDATE Tbl_People SET TFCustID= '" & Session("TfCustomerID") & "'," & _
	" Email= '" & request("Email") & "' ," & _	
	" FirstName= '" & request("fn") & "' ," & _
	" MiddleName= '" & request("mi") & "'," & _
	" LastName= '" & request("ln") & "' ," & _	
	" Department= '" & request("dept") & "'," & _
	" title= '" & request("title") & "' ," & _
	" HomeArea= '" & request("harea") & "' ," & _
	" HomeCity= '" & request("hcity") & "' ," & _
	" HomePhone= '" & request("hphone") & "' ," & _
	" HomeExt= '" & request("hext") & "' ," & _
	" WorkArea= '" & request("warea") & "' ," & _
	" WorkCity= '" & request("wcity") & "' ," & _
	" WorkPhone= '" & request("wphone") & "' ," & _
	" WorkExt= '" & request("wext") & "' ," & _
	" MobileArea= '" & request("marea") & "' ," & _
	" Mobilecity= '" & request("mcity") & "' ," & _
	" Mobilephone= '" & request("mphone") & "' ," & _
	" Mobileext= '" & request("mext") & "' ," & _
	" FaxArea= '" & request("farea") & "' ," & _
	" Faxcity= '" & request("fcity") & "' ," & _
	" Faxphone= '" & request("fphone") & "' ," & _
	" Faxext= '" & request("fext") & "' ," & _
	" Bestmethod= '" &  bestmethod & "' ," & _
	" Address1= '" &  request("add1") & "' ," & _
	" Address2= '" &  request("add2") & "' ," & _
	" City= '" &  request("city") & "' ," & _
	" State= '" &  request("state") & "' ," & _
	" Zip= '" &  request("zip") & "' ," & _
	" Country= '" &  request("Country") & "' ," & _
	" ShippingAddress1= '" &  request("sadd1") & "' ," & _
	" ShippingAddress2= '" &  request("sadd2") & "' ," & _
	" ShippingCity= '" &  request("scity") & "' ," & _
	" ShippingState= '" &  request("sstate") & "' ," & _
	" ShippingZip= '" &  request("szip") & "' ," & _
	" ShippingCountry= '" &  request("sCountry") & "'" & _
	" WHERE (((Tbl_People.PeopleID)=" & request("peopleid") & "));"

	rsup.open strsql, dbc, 3, 3
	response.redirect "Verify.asp?ProductID=" & request("productid") &"&CompanyID=" & request("companyid") &"&PeopleID=" & request("peopleid")
	case "CAN"
	' redirect to the previous page
	'Response.redirect "Verify.asp?companyid=" & request("companyid") &"&Productid=" & request("productid") &"&peopleid=" & request("peopleid")
end select
	set rsup = nothing : set dbc = nothing	
	response.end
end if

set rspeople = server.createobject("adodb.recordset")
strsql = "Select * from tbl_people where peopleid=" & peopleid
rspeople.open strsql,dbc,3,3
%>

<HTML>
<HEAD>
<script language="javascript">
<!--Begin
function FillAddress(){
varadd = document.form.add1.value;
varadd2 = document.form.add2.value;
varcity = document.form.city.value;
varstate = document.form.state.value;
varzip = document.form.zip.value;
varcountry = document.form.country.value;

if (document.form.sameadd.checked == false) {
document.form.sadd1.value = '';
document.form.sadd2.value = '';
document.form.scity.value = '';
document.form.sstate.value = '';
document.form.szip.value = '';
document.form.scountry.value = '';
}
else 
{
if (varadd != '') {
document.form.sadd1.value = document.form.add1.value;
	}
if (varadd2 != '') {
document.form.sadd2.value = document.form.add2.value;
	}
if (varcity != '') {
document.form.scity.value = document.form.city.value;
	}
if (varstate != '') {
document.form.sstate.value = document.form.state.value;
	}
if (varcountry != '') {
document.form.scountry.value = document.form.country.value;
	}
if (varzip != '') {
document.form.szip.value = document.form.zip.value;
	}
	}
}
//End-->
</script>
</HEAD>
<body>
<form name=form method=post action="User_Edit.asp">
<table cellpadding=0 cellspacing=0 border=0 align=center width=600>
<tr><td valign=top>
<p>
<table cellpadding=0 cellspacing=0 border=0 width="100%">
<tr bgcolor=999999><td>
<table cellpadding=3 cellspacing=1 border=0 width="100%">
<tr><td align=left bgcolor=dcdcdc>
<font face="Arial,Helvetica">
<b>
Contact Person:
</b></font>
</td></tr><tr><td bgcolor=eeeeee>
<table border=0 cellspacing=0 cellpadding=4 width="614">
<tr>
<td width="105"><b>First Name:</b></td><td width="160">
<input type=text size="20" name="fn" value="<%=rspeople("firstname")%>">&nbsp;&nbsp;&nbsp;&nbsp;
</td>
<td width="115"><b>Middle In.:</b></td><td width="202">
<input type=text size="3" name="mi" value="<%=rspeople("middlename")%>">
</td>
</tr>
<tr>
<td width="105"><b>Last Name:</b></td>
<td width="160">
<input type=text size="20" name="ln" value="<%=rspeople("lastname")%>">
</td>
<td width="115"><b>Department:</b>
</td>
<td width="202">
<input type=text size="20" name="dept" value="<%=rspeople("department")%>">
</td>
</tr>


<tr>
<td width="105"><b>Email:</b></td><td width="160">
<input type=text size="20" name="email" value="<%=rspeople("EMAIL")%>">
</td>
<td width="115"><b>Title:</b>
</td>
<td width="202">
<input type=text size="20" name="title" value="<%=rspeople("title")%>">
</td>
</tr>
<tr>
</td>
</tr>
<tr>
<td width="105">&nbsp;</td>
<td width="160">
&nbsp;</td>
<td width="115">&nbsp;</td>
<td width="202">
&nbsp;</td>
</tr>
</table>
</td></tr></table>
</td></tr>
</table>
<table cellpadding=0 cellspacing=0 border=0 width="100%">
<tr bgcolor=999999><td>
<table cellpadding=3 cellspacing=1 border=0 width="100%">
<tr>
  <td align=left bgcolor=dcdcdc>
<font face="Arial,Helvetica">
<b>Phone Numbers:</b></font></td>
</tr>
<tr>
  <td bgcolor=eeeeee nowrap>
<table border=0 cellspacing=0 cellpadding=4 width="686">
<tr>
<td width="81" nowrap><b>Work:</b>&nbsp;
</td>
<td width="224" nowrap>
<input type=text size="3" name="warea" value="<%=rspeople("workarea")%>" maxlength="3"><b><font size="5">-</font></b>
<input type=text size="3" name="wcity" value="<%=rspeople("workcity")%>" maxlength="3"><b><font size="5">-</font></b><input type=text size="4" name="wphone" value="<%=rspeople("workphone")%>" maxlength="4"><b> Ext:</b><input type=text size="3" name="wext" value="<%=rspeople("workext")%>"></td>
<td width="77" nowrap><b>Mobile:</b>
</td>
<td width="272" nowrap>
<input type=text size="3" name="marea" value="<%=rspeople("mobilearea")%>" maxlength="3"><b><font size="5">-</font></b><input type=text size="3" name="mcity" value="<%=rspeople("mobilecity")%>" maxlength="3"><b><font size="5">-</font></b><input type=text size="4" name="mphone" value="<%=rspeople("mobilephone")%>" maxlength="4"><b> Ext:</b><input type=text size="3" name="mext" value="<%=rspeople("mobileext")%>"></td>
</tr>
<tr>
<td width="81"><b>Fax:</b>
</td>
<td width="224">
<input type=text size="3" name="farea" value="<%=rspeople("faxarea")%>" maxlength="3"> <b><font size="5">-</font></b><input type=text size="3" name="fcity" value="<%=rspeople("faxcity")%>" maxlength="3"><b><font size="5">-</font></b><input type=text size="4" name="fphone" value="<%=rspeople("faxphone")%>" maxlength="4"><b> Ext:</b><input type=text size="3" name="fext" value="<%=rspeople("faxext")%>"></td>
<td width="77"><b>Direct Fax:</b>
</td>
<td width="272">
<input type=text size="3" name="harea" value="<%=rspeople("homearea")%>" maxlength="3"><b><font size="5">-</font></b><input type=text size="3" name="hcity" value="<%=rspeople("homecity")%>" maxlength="3"><b><font size="5">-</font></b><input type=text size="4" name="hphone" value="<%=rspeople("homephone")%>" maxlength="4"><b> Ext:</b><input type=text size="3" name="hext" value="<%=rspeople("homeext")%>"></td>
</tr>
<tr>
<td width="622" colspan="4"><b>Primary Location:</b>
<% 
if rspeople("bestmethod") = "WorkPhone" then %>
<input type=radio name="primary" value="1" checked>
 Work 
<% else %>
<input type=radio name="primary" value="1">
 Work 
<% end if 
if rspeople("bestmethod") = "MobilePhone" then %>
<input type="radio" name="primary" value="2" checked> Mobile
<% else %>
<input type="radio" name="primary" value="2"> Mobile
<% end if 
if rspeople("bestmethod") = "FaxPhone" then %>
<input type="radio" name="primary" value="3"> Fax
<% else %>
<input type="radio" name="primary" value="3"> Fax
<% end if %>
<% if rspeople("bestmethod") = "HomePhone" then %>
<input type=radio name="primary" value="0" checked>
 J-Fax  
<% else %>
<input type=radio name="primary" value="0">
 J-Fax  
<% end if%></td>
</tr>
<tr>
<td width="81">&nbsp;</td>
<td width="224">
&nbsp;</td>
<td width="77">&nbsp;</td>
<td width="272">
&nbsp;</td></tr></table>
</td></tr>
</table>
</td></tr></table>
<p>
<table cellpadding=0 cellspacing=0 border=0 width="100%">
<tr bgcolor=999999><td>
<table cellpadding=3 cellspacing=1 border=0 width="100%">
<tr><td align=left bgcolor=dcdcdc>
<font face="Arial,Helvetica">
<b>Address Information:</b></font></td>
</tr><tr><td bgcolor=eeeeee>
<table border=0 cellspacing=0 cellpadding=4 width="100%">
<tr>
<td><b>Address Line 1:</b>
</td>
<td colspan=3>
<input type=text size="27" name="add1" value="<%=rspeople("address1")%>"></td></tr>
<tr>
<td><b>Address Line 2:</b></td>
<td colspan="2">
<input type=text size="27" name="add2" value="<%=rspeople("address2")%>"></td>
<td>
&nbsp;</td>
</tr>
<tr>
<td><b>City:</b>
</td>
<td>
<input type=text size="20" name="city" value="<%=rspeople("city")%>">
</td>
<td><b>State/Province:</b>
</td>
<td>
<input type=text size="20" name="state" value="<%=rspeople("state")%>">
</td>
</tr>
<tr>
<td><b>ZIP/Postal Code:</b>
</td>
<td>
<input type=text size="20" name="zip" value="<%=rspeople("zip")%>">
</td>
<td><b>Country:</b>
</td>
<td>
<input type=text size="20" name="country" value="<%=rspeople("country")%>">
</td>
</tr>
</table>
</td></tr>
</table>
</td></tr></table>
<p>
<table cellpadding=0 cellspacing=0 border=0 width="100%">
<tr bgcolor=999999><td>
<table cellpadding=3 cellspacing=1 border=0 width="100%">
<tr><td align=left bgcolor=#EEEEEE>
&nbsp;</td></tr>
<tr><td align=left bgcolor=dcdcdc>
<font face="Arial,Helvetica">
<b>Shipping Information:</b></font>
&nbsp;<font face="Arial,Helvetica" size="1"><b>(Same as address: &nbsp;<input type=checkbox name=sameadd value="sameadd" onclick="FillAddress()">)</b></font></td></tr><tr><td bgcolor=eeeeee>
<table border=0 cellspacing=0 cellpadding=4 width="100%">
<tr>
<td><b>Address Line 1:</b>
</td>
<td colspan=3>
<input type=text size="26" name="sadd1" value="<%=rspeople("shippingaddress1")%>"></td>
</tr>
<tr>
<td><b>Address Line 2:</b></td>
<td colspan="2">
<input type=text size="26" name="sadd2" value="<%=rspeople("shippingaddress2")%>"></td>
<td>
&nbsp;</td>
</tr>
<tr>
<td><b>City:</b>
</td>
<td>
<input type=text size="20" name="scity" value="<%=rspeople("shippingcity")%>">
</td>
<td><b>State/Province:</b>
</td>
<td>
<input type=text size="20" name="sstate" value="<%=rspeople("shippingstate")%>">
</td>
</tr>
<tr>
<td><b>ZIP/Postal Code:</b>
</td>
<td>
<input type=text size="20" name="szip" value="<%=rspeople("shippingzip")%>">
</td>
<td><b>Country:</b></td>
<td>
<input type=text size="20" name="scountry" value="<%=rspeople("shippingcountry")%>">
</td>
</tr>
</table>
</td></tr>
</table>
</td></tr></table>
<P>
<table cellpadding=0 cellspacing=0 border=0 width="100%">
<tr bgcolor=999999><td>
&nbsp;</td></tr></table>
<P>
<table cellpadding=0 cellspacing=0 border=0 width="100%">
<tr bgcolor=999999><td>
<table cellpadding=3 cellspacing=1 border=0 width="100%">
<tr bgcolor="#f4f5e1"><td>
<table cellpadding=0 cellspacing=0 border=0 width="100%">
<tr><td>
<font face="Arial,Helvetica" size=-1>
<input type=submit name="act" VALUE="Save">
<input type=submit name="act" value="Cancel">
</font>
</td>
</tr></table>
</td></tr></table>
</td></tr></table>
</td></tr></table>
</table>
<input type=hidden name="productid" value="<%=productid%>">
<input type=hidden name="customerid" value="<%=customerid%>">
<input type=hidden name="peopleid" value="<%=peopleid%>">
</form>
</body>
</HTML>
