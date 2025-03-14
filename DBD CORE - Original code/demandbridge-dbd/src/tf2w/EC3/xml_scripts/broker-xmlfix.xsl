<?xml version="1.0"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
<xsl:template match="@*|node()">
<xsl:copy><xsl:apply-templates select="@*|node()"/></xsl:copy>
</xsl:template>

<xsl:template match="PROCESS_FEE"><xsl:if test="string(node())"><PROCESS_FEE><xsl:value-of select="node()"/></PROCESS_FEE></xsl:if></xsl:template>

</xsl:stylesheet>


