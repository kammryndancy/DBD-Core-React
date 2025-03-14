<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

<xsl:template match="INVOICE">
<style>
table, tr, td { font-family: Arial; font-size: 11px }
</style>
<table width="700" border="1" cellpadding="0" cellspacing="0">
<tr style="font-weight:bold;color:blue">
<td>Broker Order Number</td>
<td>Customer Order Number</td>
<td>Invoice Number</td>
<td>Ship Method</td>
<td>Freight</td>
<td></td><td></td><td></td> 
</tr>
<tr style="font-weight:bold;color:blue">
<td>Cust Line Number</td>
<td>Supplier Item code</td>
<td>Item desc</td>
<td>UOM</td>
<td>Qty Shipped</td>
<td>Price/Unit</td>
<td>Ext Price</td>
<td>Entered UOM</td>
</tr>
<xsl:apply-templates />
</table>
</xsl:template>

<xsl:template match="ORDER">
<tr style="font-weight: bold">
<td><xsl:value-of select="ORDER_NUMBER" /></td>
<td><xsl:value-of select="CUST_ORDER_NUM" /></td>
<td><xsl:value-of select="DOCUMENT" /></td>
<td><xsl:value-of select="MODE_TRANSPORT" /></td>
<td><xsl:value-of select='format-number(concat(substring(format-number(SHIP_CHARGE,"00000000"),1,4),".",substring(format-number(SHIP_CHARGE,"00000000"),5,4)),"##0.0000")' /></td>
<td></td><td></td><td></td> 
</tr>
<xsl:apply-templates />
</xsl:template>

<xsl:template match="ORDER_LINE">
<tr>
<td><xsl:value-of select="CUST_LINE_NUM" /></td>
<td><xsl:value-of select="SUPPLIER_ITEM_CODE" /></td>
<td><xsl:value-of select="ITEM_DESCRIPTION" /></td>
<td><xsl:value-of select="UNIT_OF_MEASURE" /></td>
<td><xsl:value-of select="QUANTITY_SHIPPED" /></td>
<td><xsl:value-of select='format-number(concat(substring(format-number(PRICE_PER_UNIT,"00000000"),1,4),".",substring(format-number(PRICE_PER_UNIT,"00000000"),5,4)),"##0.0000")' /></td>
<td><xsl:value-of select='format-number(concat(substring(format-number(EXTENDED_PRICE,"000000"),1,4),".",substring(format-number(EXTENDED_PRICE,"000000"),5,2)),"##0.00")' /></td>
<td><xsl:value-of select="ENTERED_UOM" /></td>
</tr>
</xsl:template>

<xsl:template match="*" />

</xsl:stylesheet>
