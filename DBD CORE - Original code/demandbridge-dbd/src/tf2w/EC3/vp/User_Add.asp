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
'This Page Adds a user to the database if they do not exist
'
'
'---------------------------
  



'Get the Varriables
productid = request("productid")
companyid = request("companyid")


'Form Processing
if trim(request("action")) <> "" then
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

	
	strsql = "Insert into TBL_People (tfcustid, firstname, middlename, lastname,email,department," & _
	"title,homearea,homecity,homephone,homeext,workarea,workcity,workphone,workext," & _
	"mobilearea,mobilecity,mobilephone,mobileext,"& _ 
	"faxarea,faxcity,faxphone,faxext,bestmethod,address1,address2,city,state,zip, country," & _
	"shippingaddress1, shippingaddress2, shippingcity, shippingstate, shippingzip, shippingcountry ) values (" & _
	"'" & Session("TfCustomerID") & "'," & _
	"'" & request("fn") & "' ," & _
	"'" & request("mi") & "'," & _
	"'" & request("ln") & "' ," & _	
	"'" & request("Email") & "' ," & _
	"'" & request("dept") & "'," & _
	"'" & request("title") & "' ," & _
	"'" & request("harea") & "' ," & _
	"'" & request("hcity") & "' ," & _
	"'" & request("hphone") & "' ," & _
	"'" & request("hext") & "' ," & _
	"'" & request("warea") & "' ," & _
	"'" & request("wcity") & "' ," & _
	"'" & request("wphone") & "' ," & _
	"'" & request("wext") & "' ," & _
	"'" & request("marea") & "' ," & _
	"'" & request("mcity") & "' ," & _
	"'" & request("mphone") & "' ," & _
	"'" & request("mext") & "' ," & _
	"'" & request("farea") & "' ," & _
	"'" & request("fcity") & "' ," & _
	"'" & request("fphone") & "' ," & _
	"'" & request("fext") & "' ," & _
	"'" &  bestmethod & "' ," & _
	"'" &  request("add1") & "' ," & _
	"'" &  request("add2") & "' ," & _
	"'" &  request("city") & "' ," & _
	"'" &  request("state") & "' ," & _
	"'" &  request("zip") & "' ," & _
	"'" &  request("Country") & "' ," & _
	"'" &  request("sadd1") & "' ," & _
	"'" &  request("sadd2") & "' ," & _
	"'" &  request("scity") & "' ," & _
	"'" &  request("sstate") & "' ," & _
	"'" &  request("szip") & "' ," & _
	"'" &  request("sCountry") & "')"

	dbc.execute(strsql)
	set ident = dbc.execute("SELECT @@IDENTITY FROM TBL_People")
	response.redirect "Verify.asp?ProductID=" & request("productid") &"&CompanyID=" & request("companyid") &"&PeopleID=" & Ident(0) 
	set ident = nothing : set dbc = nothing	
	response.end 
end if
'End of Form Processing


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
<form name=form method=post action="User_Add.asp">
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
<input type=text size="20" name="fn">&nbsp;&nbsp;&nbsp;&nbsp;
</td>
<td width="115"><b>Middle In.:</b></td><td width="202">
<input type=text size="3" name="mi" value="">
</td>
</tr>
<tr>
<td width="105"><b>Last Name:</b></td>
<td width="160">
<input type=text size="20" name="ln">
</td>
<td width="115"><b>Department:</b>
</td>
<td width="202">
<input type=text size="20" name="dept" value="">
</td>
</tr>


<tr>
<td width="105"><b>Email:</b></td><td width="160">
<input type=text size="20" name="email" value="<%=request("EMAIL")%>">
</td>
<td width="115"><b>Title:</b>
</td>
<td width="202">
<input type=text size="20" name="title" value="">
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
<p>

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
<table border=0 cellspacing=0 cellpadding=4 width="715">
<tr>
<td width="81" nowrap><b>Work:</b></td>
<td width="246" nowrap>
<input type=text size="3" name="warea" value="" maxlength="3"><b><font size="5">-</font></b>
<input type=text size="3" name="wcity" value="" maxlength="3"><b><font size="5">-</font></b><input type=text size="4" name="wphone" value="" maxlength="4"><b> Ext:</b><input type=text size="3" name="wext" value=""></td>
<td width="102" nowrap>&nbsp;<b>Mobile:</b>
</td>
<td width="254" nowrap>
<input type=text size="3" name="marea" value="" maxlength="3"><b><font size="5">-</font></b><input type=text size="3" name="mcity" value="" maxlength="3"><b><font size="5">-</font></b><input type=text size="4" name="mphone" value="" maxlength="4"><b> Ext:</b><input type=text size="3" name="mext" value=""></td>
</tr>
<tr>
<td width="81"><b>Fax:</b>
</td>
<td width="246">
<input type=text size="3" name="farea" value="" maxlength="3"> <b><font size="5">-</font></b><input type=text size="3" name="fcity" value="" maxlength="3"><b><font size="5">-</font></b><input type=text size="4" name="fphone" value="" maxlength="4"><b> Ext:</b><input type=text size="3" name="fext" value=""></td>
<td width="102" nowrap><b>Direct Fax:</b></td>
<td width="254">
<input type=text size="3" name="harea" value="" maxlength="3"><b><font size="5">-</font></b><input type=text size="3" name="hcity" value="" maxlength="3"><b><font size="5">-</font></b><input type=text size="4" name="hphone" value="" maxlength="4"><b> Ext:</b><input type=text size="3" name="hext" value=""></td>
</tr>
<tr>
<td width="622" colspan="4"><b>Primary Location:</b>&nbsp;  
<input type=radio name="primary" value="1" checked>
 Work  
<input type=radio name="primary" value="2"> Mobile  
<input type=radio name="primary" value="3"> Fax
<input type=radio name="primary" value="0"> Direct Fax</td>
</tr>
<tr>
<td width="81">&nbsp;</td>
<td width="246">
&nbsp;</td>
<td width="102">&nbsp;</td>
<td width="254">
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
<input type=text size="27" name="add1" ></td></tr>
<tr>
<td><b>Address Line 2:</b></td>
<td colspan="2">
<input type=text size="27" name="add2" ></td>
<td>
&nbsp;</td>
</tr>
<tr>
<td><b>City:</b>
</td>
<td>
<input type=text size="20" name="city" >
</td>
<td><b>State/Province:</b>
</td>
<td>
<input type=text size="20" name="state" >
</td>
</tr>
<tr>
<td><b>ZIP/Postal Code:</b>
</td>
<td>
<input type=text size="20" name="zip">
</td>
<td><b>Country:</b>
</td>
<td>
<input type=text size="20" name="country">
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
<tr><td align=left bgcolor=dcdcdc>
<font face="Arial,Helvetica">
<b>Shipping Information:</b></font>
&nbsp;<font face="Arial,Helvetica" size="1"><b>(Same as address: &nbsp;<input type=checkbox name=sameadd value="sameadd" onclick="FillAddress()">)</b>
</font></td></tr><tr><td bgcolor=eeeeee>
<table border=0 cellspacing=0 cellpadding=4 width="100%">
<tr>
<td><b>Address Line 1:</b>
</td>
<td colspan=3>
<input type=text size="27" name="sadd1"></td></tr>
<tr>
<td><b>Address Line 2:</b></td>
<td colspan="2">
<input type=text size="27" name="sadd2"></td>
<td>
&nbsp;</td>
</tr>
<tr>
<td><b>City:</b>
</td>
<td>
<input type=text size="20" name="scity">
</td>
<td><b>State/Province:</b>
</td>
<td>
<input type=text size="20" name="sstate">
</td>
</tr>
<tr>
<td><b>ZIP/Postal Code:</b>
</td>
<td>
<input type=text size="20" name="szip" >
</td>
<td><b>Country:</b>
</td>
<td>
<input type=text size="20" name="scountry" >
</td>
</tr>
</table>
</td></tr>
</table>
</table>
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
<input type=submit name="action" VALUE="Save">
<input type="button"  value="Cancel" onClick="history.go(-1);">
</font>
</td>
</tr></table>
</td></tr></table>
</td></tr></table>
</td></tr></table>
</table>
<input type=hidden name="productid" value="<%=productid%>">
<input type=hidden name="customerid" value="<%=customerid%>">
</form>
</body>
</HTML>
<% set rsadmin = nothing : set rsadd = nothing : set dbc = nothing %>