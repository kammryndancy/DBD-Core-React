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
'This page alows the user to select which
'phone numbers and what addresses
'will be used to generate the proof
'
'---------------------------

peopleid = request("peopleid")
productid = request("productid")
customerid = request("customerid")
nopeople=false

if peopleid <> "" then

	Set rsgetinfo = server.createobject("adodb.recordset")
	str = "SELECT * FROM Tbl_People WHERE PeopleID = " & peopleid
	rsgetinfo.open str, dbc, 3, 3
	firstname = rsgetinfo("firstname")
	middlename = left(rsgetinfo("middlename"),1)
	lastname = rsgetinfo("lastname")
	email = rsgetinfo("email")
	department = rsgetinfo("department")
	title = rsgetinfo("title")
	homearea = rsgetinfo("homearea")
	homecity = rsgetinfo("homecity")
	homephone = rsgetinfo("homephone")
	homeext = rsgetinfo("homeext")
	workarea = rsgetinfo("workarea")
	workcity = rsgetinfo("workcity")
	workphone = rsgetinfo("workphone")
	workext = rsgetinfo("workext")
	mobilearea = rsgetinfo("mobilearea")
	mobilecity = rsgetinfo("mobilecity")
	mobilephone = rsgetinfo("mobilephone")
	mobileext = rsgetinfo("mobileext")
	faxarea = rsgetinfo("faxarea")
	faxcity = rsgetinfo("faxcity")
	faxphone = rsgetinfo("faxphone")
	faxext = rsgetinfo("faxext")
	address1 = rsgetinfo("address1")
	address2 = rsgetinfo("address2")
	city = rsgetinfo("city")
	state = rsgetinfo("state")
	zip = rsgetinfo("zip")
	country = rsgetinfo("country")
	shipppingaddress1 = rsgetinfo("shippingaddress1")
	shipppingaddress2 = rsgetinfo("shippingaddress2")
	shippingcity = rsgetinfo("shippingcity")
	shippingstate = rsgetinfo("shippingstate")
	shippingzip = rsgetinfo("shippingzip")

end if    
%>
<HTML>
<HEAD>
<%
if peopleid <> "" then
%>
<SCRIPT LANGUAGE="JavaScript">
<!--
function FillAddress(theform) {
var num= theform.addresstype.selectedIndex;
if (num=="1") {
	document.order.rqaddress1.value="<%=rsgetinfo("ShippingAddress1")%>";
	document.order.address2.value="<%=rsgetinfo("ShippingAddress2")%>";
	document.order.rqcity.value="<%=rsgetinfo("ShippingCity")%>";
	document.order.rqstate.value="<%=rsgetinfo("ShippingState")%>";
	document.order.rqzip.value="<%=rsgetinfo("ShippingZip")%>";
	document.order.country.value="<%=rsgetinfo("ShippingCountry")%>";
}if (num=="2") {
	document.order.rqaddress1.value="<%=rsgetinfo("Address1")%>";
	document.order.address2.value="<%=rsgetinfo("Address2")%>";
	document.order.rqcity.value="<%=rsgetinfo("City")%>";
	document.order.rqstate.value="<%=rsgetinfo("State")%>";
	document.order.rqzip.value="<%=rsgetinfo("Zip")%>";
	document.order.country.value="<%=rsgetinfo("Country")%>";
}if (num=="0") {
	document.order.rqaddress1.value="";
	document.order.address2.value="";
	document.order.rqcity.value="";
	document.order.rqstate.value="";
	document.order.rqzip.value="";
	document.order.country.value="";
}
}
//-->
</SCRIPT>
<%
end if
%>
<SCRIPT LANGUAGE="JavaScript">
<!-- Begin
function checkrequired(which) {
var pass=true;
if (document.images) {
for (i=0;i<which.length;i++) {
var tempobj=which.elements[i];
if (tempobj.name.substring(0,2)=="rq") {
if (((tempobj.type=="text"||tempobj.type=="textarea")&&
tempobj.value=='')||(tempobj.type.toString().charAt(0)=="s"&&
tempobj.selectedIndex==0)) {
pass=false;
break;
         }
      }
   }
}
if (!pass) {
shortFieldName=tempobj.name.substring(2,30).toUpperCase();
if (shortFieldName == "WORKAREA") {
shortFieldName ="Area Code"}
if (shortFieldName == "WORKCITY") {
shortFieldName ="Phone Number"}
if (shortFieldName == "WORKPHONE") {
shortFieldName ="Phone Number"}
alert("Please make sure the "+shortFieldName+" field was properly completed.");
return false;
}
else
return true;
}
//  End -->
</script>
</head>
<body>
<form NAME=order onSubmit="return checkrequired(this)" method=POST action=printing_process.asp>
  <div align="center">
    <center>
    <table border=0 cellpadding=3 cellspacing=0 width=471 style="border-collapse: collapse" bordercolor="#111111"><tr>
  <td align=center><p align=center>
  <p align="center">&nbsp;</p>
  </p></td>
  <td align=center>
  <p align=center nowrap>
  <font face=Trebuchet MS size=2><b>Please verify the information that&nbsp; will 
  appear on your order and click the &quot;Proof&quot; button below to see your 
  sample.&nbsp; Please read everything carefully, this is the way your printed 
  item will look.</b></font></td>
  <td align=center><p align=center>
<br>
</td></tr><tr>
<td width=212 bgcolor=#F0F0F0 align=right>
<b><font face=Trebuchet MS size=1>Salutation</font></b>
</td>
<td width=211 bgcolor=#F0F0F0 align="left" colspan="2">
<select size=1 name=sal  onchange="if (document.order.sal.selectedIndex!=0){document.order.psal.checked=true}else{document.order.psal.checked=false}">
<option selected>None</option>
<option value="Mr.">Mr.</option>
<option value="Ms.">Ms.</option>
<option value="Mrs.">Mrs.</option>
<option value="Miss">Miss</option>
<option value="Dr.">Dr.</option>
<option value="Rev.">Rev.</option>
</select><input type=checkbox name="psal" value="1" >Print</td></tr>
<tr>
<td width=100 bgcolor=#F0F0F0 align=right>
<b><font face=Trebuchet MS size=1>Name:</font></b></td>
<td width=300 bgcolor=#F0F0F0 align=left colspan="2" nowrap><input type="text" name="rqFirstName" size="15" value="<%=FirstName%>"><input type="text" name="Middlename" size="1" value="<%=middlename%>" ><input type="text" name="rqLastName" size="20" value="<%=lastname%>">
</td></tr>
<tr>
<td width=212 bgcolor=#F0F0F0 align=right>
<b><font face=Trebuchet MS size=1>Email:</font></b>
</td>
<td width=211 bgcolor=#F0F0F0 align=left colspan="2">
<p align=left><input type=text name=Email size=30 value="<%=Email%>">
</td>
<tr>
<td width=212 bgcolor=#FFFFFF align=right>
<p align=right><b><font face=Trebuchet MS size=1>Title:</font></b></p>
</td>
<td width=211 bgcolor=#FFFFFF align=left colspan="2">
<p align=left><input type=text name=Title size=30 value="<%=Title%>"></td>
</tr>
      <tr>
<td width=110 align=right bgcolor=#F0F0F0>
<p align=right><font size=1 face=Trebuchet MS><b>Work Number:</b> 
</td>
<td width=400 align=left bgcolor=#F0F0F0>
<input type=text name=rqworkarea size=3 maxlength="3" value="<%=Workarea%>" >&nbsp<input type=text name=rqworkcity size=3 maxlength="3" value="<%=Workcity%>" ><input type=text name=rqworkphone size="4" maxlength="4" value="<%=Workphone%>" > <b>x</b><input type=text name=workext size="6" maxlength="6" value="<%=workext%>" ></font></b>
</td>
      </tr>
      <tr>
<td width=110 align=right bgcolor=#FFFFFF>
<p align=right><b><font face="Trebuchet" size="1">Fax</font></b><font size=1 face=Trebuchet MS><b> 
Number:</b> 
</td>
<td width=400 align=left bgcolor=#FFFFFF >
<input type=text name=faxarea size=3 maxlength="3" value="<%=faxarea%>" > <input type=text name=faxcity size=3 maxlength="3" value="<%=faxcity%>" ><input type=text name=faxphone size="4" maxlength="4" value="<%=faxphone%>" > <b>x</b><input type=text name=faxext size="6" maxlength="6" value="<%=faxext%>" ><input type=checkbox name=pfax value="1" checked>Print</td></tr>
<tr>
<td width=110 align=right bgcolor=#F0F0F0>
<p align=right><font size=1 face=Trebuchet MS><b>Mobile Number:</b> 
</td>
<td width=400 align=left bgcolor=#F0F0F0 >
<input type=text name=mobilearea size=3 maxlength="3" value="<%=mobilearea%>" >&nbsp<input type=text name=mobilecity size=3 maxlength="3" value="<%=mobilecity%>" ><input type=text name=mobilephone size="4" maxlength="4" value="<%=mobilephone%>" > <b>x</b><input type=text name=mobileext size="6" maxlength="6" value="<%=mobileext%>" ><input type=checkbox name=pmobile value="1" checked>Print</font></b>
</td></tr>
<tr><td width=110 align=right bgcolor=#FFFFFF>
<p align=right><font size=1 face=Trebuchet MS><b>Direct Fax Number:</b> 
</td>
<td width=400 align=left bgcolor=#FFFFFF>
<input type=text name=homearea size=3 maxlength="3" value="<%=homearea%>" > <input type=text name=homecity size=3 maxlength="3" value="<%=homecity%>" ><input type=text name=homephone size="4" maxlength="4" value="<%=homephone%>" ><b> x</b><input type=text name=homeext size="6" maxlength="6" value="<%=homeext%>" ><input type=checkbox name=phome value="1" checked>Print</font></b>
</td></tr>
<%
if nopeople = true then
%>
<tr><td width=212 align=right bgcolor=#F0F0F0>
<p align=right><font face=Trebuchet MS size=1><b>Address Type:</b></font></p>
</td>
<td width=211 align=left bgcolor=#F0F0F0 colspan="2" nowrap>
<select name=addresstype ONCHANGE="FillAddress(this.form)" size=1 >
<OPTION value="">Select One</option>
<OPTION value=0><%=ShippingCity &  ", " & ShippingState & " " & ShippingZip %></OPTION>
<OPTION selected value=1><%=City & ", " & State & " " & Zip %></OPTION>
</select></td>
</tr>
<%
end if 
%>
<tr>
<td width=212 align=right bgcolor=#FFFFFF>
<p align=right><font size=1 face=Trebuchet MS><b>Address1:</b></font></td>
<td width=211 align=right bgcolor=#FFFFFF colspan="2">
<p align=left><input type=text name="rqaddress1" size=50 value="<%=address1%>" ></td>
</tr>
<tr>
<td width=212 align=right bgcolor=#F0F0F0>
<p align=right><font size=1 face=Trebuchet MS><b>Address2:</b></font></p>
</td>
<td width=211 align=right bgcolor=#F0F0F0 colspan="2">
<p align=left><input type=text name=address2 size=50 value="<%=address2%>" ></td>
</tr>
<tr>
<td width=120 align=right bgcolor=#FFFFFF>
<p align=right><font size=1 face=Trebuchet MS><b>City, State Zip:</b></font></p>
</td>
<td width=350 align=left bgcolor=#FFFFFF colspan="2">
<input type=text name=rqcity size=30  value="<%=city%>"><input type=text name=rqstate size=2 value="<%=state%>"><input type=text name=rqzip size=10 value="<%=zip%>"></td>
</tr>
<tr>
<td width=120 align=right bgcolor=#F0F0F0>
<p align=right><font size=1 face=Trebuchet MS><b>Country:</b></font></p>
</td><td width=350 align=left bgcolor=#F0F0F0 colspan="2">
<input type=text name=country size=20 value="<%=country%>"></p></td>
</tr>
<tr>
<td width=423 bgcolor=#FFFFFF align=right colspan=3 nowrap>
<input type=button value=" Edit " name=button style="font-family:'Trebuchet MS'; font-weight: bold" onclick="window.location='User_Edit.asp?Customerid=<%=customerid%>&Productid=<%=productid%>&peopleid=<%=peopleid%>'"></font>&nbsp;
<input type=submit value=Proof name=button style="font-family:'Trebuchet MS'; font-weight: bold"></font>
</td></tr>
</table></center>
</div>
<input type=hidden name=productid value="<%=productid%>" >
<input type=hidden name=customerid value="<%=customerid%>" >
<input type=hidden name=peopleid value="<%=peopleid%>" >
<input type=hidden name=nopeople value="<%=nopeople%>">
</form>
</body>
</HTML>