<%@ Language=VBScript %>
<!-- #include file="include/db.inc"-->
<% 
'----------------------------
'
'Date: 02/01/2000
'
'Author: Tyler Downs
'
'Description:
'This page is the entry point for the TopForm System
'WebEC Passes the varibales into this page to be processed
'
'
'Revised 9/7/00
'
'---------------------------


Dim tftypeid, tfclientid, tfqty, tfsession, tftftemplate, tfbasic, tfdesc, tffieldmapping

if Session("count") = "" then
	Session("count") = "0"
else
	Session("count") = cint(session("count")) + 1
end if


if request("TFSession") <> "" then
	
	'Session all of the varriables while in the printing section
	Session("TfTypeID") = request("typeid")
	Session("TfCustomerID") = request("custid")
	Session("TfSession")= request("tfsession")
	Session("Tftemplate")= request("tftemplate")
	Session("TfBasic")= request("tfbasic")
	Session("TfDesc")= request("tfdesc")
	Session("TfWeb") = request("tfweb")
	Session("Tfqty") = request("Quantity")
	Session("TfFieldMapping") = request("tfFieldMapping")

	'Provide Error Handling on each of the required varriables
	msg = "No TopForm Item Code Provided (TypeID)"
	if session("TfTypeID") = "" then Response.Redirect "Error.asp?Error=" & msg
	msg = "No TopForm Customer ID Provided (ClientID)"
	if session("TfCustomerID") = "" then Response.Redirect "Error.asp?Error=" & msg
	msg = "No TopForm SessionID Provided (TFSession)"
	if session("TfSession") = "" then Response.Redirect "Error.asp?Error=" & msg
	msg = "No TopForm Template Provided (TFTemplate)"
	if session("TfTemplate") = "" then Response.Redirect "Error.asp?Error=" & msg
	msg = "No TopForm Basic Varriable Provided (TFBasic)"
	if session("TfBasic") = "" then Response.Redirect "Error.asp?Error=" & msg
	msg = "No TopForm Item Description Provided (TFDesc)"
	if session("TfDesc") = "" then Response.Redirect "Error.asp?Error=" & msg
	msg = "No TopForm Return Web Varriable Provided (TFWeb)"
	if session("TfWeb") = "" then Response.Redirect "Error.asp?Error=" & msg
	msg = "No TopForm Item Quantiy Varriable Provided (TFQty)"
	if session("TfQty") = "" then Response.Redirect "Error.asp?Error=" & msg
	msg = "No Field Mapping Varriable Provided (TFFieldMapping)"
	'if session("Tffieldmapping") = "" then Response.Redirect "Error.asp?Error=" & msg
	
	

	'Lookup Product ID in Database to make sure it exists
	'If it does not error for no product id
	
	strsql = "Select * from tbl_products where TFProductID='" & trim(request("typeid")) & "'" 
	set rsproduct = server.createobject("adodb.recordset")
	rsproduct.open strsql,dbc,3,3
	if rsproduct.recordcount > 0 then
		response.redirect "cust_lookup.asp?Productid=" & rsproduct("productid") & "&customerid=" & request("custid")
	else
		msg = "The product is not setup. TypeID=" & trim(request("typeid"))
		Response.Redirect "Error.asp?Error=" & msg	
	end if
	
else
	msg = "The TopForm Session Variable Was Not Passed"
	Response.Redirect "Error.asp?Error=" & msg

end if

set rsproduct =nothing : set dbc = nothing

%>