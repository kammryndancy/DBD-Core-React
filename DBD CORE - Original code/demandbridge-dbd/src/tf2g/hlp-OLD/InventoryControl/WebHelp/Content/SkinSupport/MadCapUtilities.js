// {{MadCap}} //////////////////////////////////////////////////////////////////
// Copyright: MadCap Software, Inc - www.madcapsoftware.com ////////////////////
////////////////////////////////////////////////////////////////////////////////
// <version>2.0.0.0</version>
////////////////////////////////////////////////////////////////////////////////

//
//    Helper functions
//

var gImages	= new Array();

function FMCIsDotNetHelp()
{
	return FMCGetRootFrame() == null;
}

function FMCInPreviewMode()
{
	return FMCGetRootFrame() == null;
}

function FMCIsIE55()
{
	return navigator.appVersion.indexOf( "MSIE 5.5" ) != -1;
}

function FMCGetHref( currLocation )
{
	var href	= currLocation.protocol + "//" + currLocation.host + currLocation.pathname;

	href = href.replace( /\\/g, "/" );
	href = href.replace( /%20/g, " " );
	href = href.replace( /;/g, "%3B" );	// For Safari

	return href;
}

function FMCGetRootFolder( currLocation )
{
	var href		= FMCGetHref( currLocation );
	var rootFolder	= href.substring( 0, href.lastIndexOf( "/" ) + 1 );

	return rootFolder;
}

function FMCGetRootFrame()
{
	var currWindow	= window;
	
	while ( currWindow )
	{
		if ( currWindow.gRootFolder )
		{
			break;
		}
		else if ( currWindow == top )
		{
			currWindow = null;
			
			break;
		}
		
		currWindow = currWindow.parent;
	}
	
	return currWindow;
}

function FMCPreloadImage( imgPath )
{
	var index	= gImages.length;
	
    gImages[index] = new Image();
    gImages[index].src = imgPath;
}

function FMCTrim( str )
{
    return FMCLTrim( FMCRTrim( str ) );
}

function FMCLTrim( str )
{
    for ( var i = 0; i < str.length && str.charAt( i ) == " "; i++ );
    
    return str.substring( i, str.length );
}

function FMCRTrim( str )
{
    for ( var i = str.length - 1; i >= 0 && str.charAt( i ) == " "; i-- );
    
    return str.substring( 0, i + 1 );
}

function FMCContainsClassRoot( className )
{
    var ret = null;
    
    for ( var i = 1; i < FMCContainsClassRoot.arguments.length; i++ )
    {
        var classRoot = arguments[i];
        
        if ( className && (className == classRoot || className.indexOf( classRoot + "_" ) == 0) )
        {
            ret = classRoot;
            
            break;
        }
    }
    
    return ret;
}

function FMCGetChildNodeByTagName( node, tagName, index )
{
    var foundNode   = null;
    var numFound    = -1;
    
    for ( var currNode = node.firstChild; currNode != null; currNode = currNode.nextSibling )
    {
        if ( currNode.nodeName == tagName )
        {
            numFound++;
            
            if ( numFound == index )
            {
                foundNode = currNode;
                
                break;
            }
        }
    }
    
    return foundNode;
}

function FMCGetChildNodesByTagName( node, tagName )
{
    var nodes   = new Array();
    
    for ( var i = 0; i < node.childNodes.length; i++ )
    {
        if ( node.childNodes[i].nodeName == tagName )
        {
            nodes[nodes.length] = node.childNodes[i];
        }
    }
    
    return nodes;
}

function FMCStringToBool( stringValue )
{
	var boolValue		= false;
	var stringValLower	= stringValue.toLowerCase();

	boolValue = stringValLower == "true" || stringValLower == "1" || stringValLower == "yes";

	return boolValue;
}

function FMCGetAttributeBool( node, attributeName, defaultValue )
{
	var boolValue	= defaultValue;
	var value		= FMCGetAttribute( node, attributeName );
	
	if ( value )
	{
		boolValue = FMCStringToBool( value );
	}
	
	return boolValue;
}

function FMCGetAttributeInt( node, attributeName, defaultValue )
{
	var intValue	= defaultValue;
	var value		= FMCGetAttribute( node, attributeName );
	
	if ( value )
	{
		intValue = parseInt( value );
	}
	
	return intValue;
}

function FMCGetAttribute( node, attribute )
{
    var value   = null;
    
    if ( node.getAttribute( attribute ) )
    {
        value = node.getAttribute( attribute );
    }
    else if ( node.getAttribute( attribute.toLowerCase() ) )
    {
        value = node.getAttribute( attribute.toLowerCase() );
    }
    
    return value;
}

function FMCGetMCAttribute( node, attribute )
{
	var value	= null;
	
    if ( node.getAttribute( attribute ) != null )
    {
        value = node.getAttribute( attribute );
    }
    else if ( node.getAttribute( attribute.substring( "MadCap:".length, attribute.length ) ) )
    {
        value = node.getAttribute( attribute.substring( "MadCap:".length, attribute.length ) );
    }
    
    return value;
}

function FMCRemoveMCAttribute( node, attribute )
{
	var value	= null;
	
    if ( node.getAttribute( attribute ) != null )
    {
        value = node.removeAttribute( attribute );
    }
    else if ( node.getAttribute( attribute.substring( "MadCap:".length, attribute.length ) ) )
    {
        value = node.removeAttribute( attribute.substring( "MadCap:".length, attribute.length ) );
    }
    
    return value;
}

function FMCGetClientWidth( winNode, includeScrollbars )
{
    var clientWidth = null;
    
    if ( winNode.innerWidth )
    {
        clientWidth = winNode.innerWidth;
        
        if ( !includeScrollbars && FMCGetScrollHeight( winNode ) > winNode.innerHeight )
        {
            clientWidth -= 19;
        }
    }
    else if ( FMCIsIE55() || (winNode.document.compatMode && winNode.document.compatMode == "BackCompat") )
    {
        clientWidth = winNode.document.body.clientWidth;
    }
    else if ( winNode.document.documentElement )
    {
        clientWidth = winNode.document.documentElement.clientWidth;
    }
    
    return clientWidth;
}

function FMCGetClientHeight( winNode, includeScrollbars )
{
    var clientHeight    = null;
    
    if ( winNode.innerHeight )
    {
        clientHeight = winNode.innerHeight;
        
        if ( !includeScrollbars && FMCGetScrollWidth( winNode ) > winNode.innerWidth )
        {
            clientHeight -= 19;
        }
    }
    else if ( FMCIsIE55() || (winNode.document.compatMode && winNode.document.compatMode == "BackCompat") )
    {
        clientHeight = winNode.document.body.clientHeight;
    }
    else if ( winNode.document.documentElement )
    {
        clientHeight = winNode.document.documentElement.clientHeight;
    }
    
    return clientHeight;
}

function FMCGetScrollHeight( winNode )
{
    var scrollHeight    = null;
    
    if ( winNode.document.scrollHeight )
    {
        scrollHeight = winNode.document.scrollHeight;
    }
    else if ( FMCIsIE55() || (winNode.document.compatMode && winNode.document.compatMode == "BackCompat") )
    {
        scrollHeight = winNode.document.body.scrollHeight;
    }
    else if ( winNode.document.documentElement )
    {
        scrollHeight = winNode.document.documentElement.scrollHeight;
    }
    
    return scrollHeight;
}

function FMCGetScrollWidth( winNode )
{
    var scrollWidth = null;
    
    if ( winNode.document.scrollWidth )
    {
        scrollWidth = winNode.document.scrollWidth;
    }
    else if ( FMCIsIE55() || (winNode.document.compatMode && winNode.document.compatMode == "BackCompat") )
    {
        scrollWidth = winNode.document.body.scrollWidth;
    }
    else if ( winNode.document.documentElement )
    {
        scrollWidth = winNode.document.documentElement.scrollWidth;
    }
    
    return scrollWidth;
}

function FMCGetScrollTop( winNode )
{
    var scrollTop   = null;
    
    if ( winNode.document.clientHeight )
    {
        scrollTop = winNode.document.body.scrollTop;
    }
    else if ( FMCIsIE55() || (winNode.document.compatMode && winNode.document.compatMode == "BackCompat") )
    {
        scrollTop = winNode.document.body.scrollTop;
    }
    else if ( winNode.document.documentElement )
    {
        scrollTop = winNode.document.documentElement.scrollTop;
    }
    
    return scrollTop;
}

function FMCSetScrollTop( winNode, value )
{
    if ( winNode.document.clientHeight )
    {
        winNode.document.body.scrollTop = value;
    }
    else if ( FMCIsIE55() || (winNode.document.compatMode && winNode.document.compatMode == "BackCompat") )
    {
        winNode.document.body.scrollTop = value;
    }
    else if ( winNode.document.documentElement )
    {
        winNode.document.documentElement.scrollTop = value;
    }
}

function FMCGetScrollLeft( winNode )
{
    var scrollLeft  = null;
    
    if ( winNode.document.clientHeight )
    {
        scrollLeft = winNode.document.body.scrollLeft;
    }
    else if ( FMCIsIE55() || (winNode.document.compatMode && winNode.document.compatMode == "BackCompat") )
    {
        scrollLeft = winNode.document.body.scrollLeft;
    }
    else if ( winNode.document.documentElement )
    {
        scrollLeft = winNode.document.documentElement.scrollLeft;
    }
    
    return scrollLeft;
}

function FMCSetScrollLeft( winNode, value )
{
    if ( winNode.document.clientHeight )
    {
        winNode.document.body.scrollLeft = value;
    }
    else if ( FMCIsIE55() || (winNode.document.compatMode && winNode.document.compatMode == "BackCompat") )
    {
        winNode.document.body.scrollLeft = value;
    }
    else if ( winNode.document.documentElement )
    {
        winNode.document.documentElement.scrollLeft = value;
    }
}

function FMCGetClientX( winNode, e )
{
    var clientX;
    
    if ( e.pageX )
    {
        clientX = e.pageX - FMCGetScrollLeft( winNode );
    }
    else if ( e.clientX )
    {
        clientX = e.clientX;
    }
    
    return clientX;
}

function FMCGetClientY( winNode, e )
{
    var clientY;
    
    if ( e.pageY )
    {
        clientY = e.pageY - FMCGetScrollTop( winNode );
    }
    else if ( e.clientY )
    {
        clientY = e.clientY;
    }
    
    return clientY;
}

function FMCGetPageX( winNode, e )
{
    var pageX;
    
    if ( e.pageX )
    {
        pageX = e.pageX;
    }
    else if ( e.clientX )
    {
        pageX = e.clientX + FMCGetScrollLeft( winNode );
    }
    
    return pageX;
}

function FMCGetPageY( winNode, e )
{
    var pageY;
    
    if ( e.pageY )
    {
        pageY = e.pageY;
    }
    else if ( e.clientY )
    {
        pageY = e.clientY + FMCGetScrollTop( winNode );
    }
    
    return pageY;
}

function FMCGetPosition( node )
{
	var topPos	= 0;
	var leftPos	= 0;
	
	if ( node.offsetParent )
	{
		topPos = node.offsetTop;
		leftPos = node.offsetLeft;
		
		while ( node = node.offsetParent )
		{
			topPos += node.offsetTop;
			leftPos += node.offsetLeft;
		}
	}
	
	return [topPos, leftPos];
}

function FMCScrollToVisible( win, node )
{
	var offset			= 0;
    
    if ( window.innerWidth && !document.clientHeight )
    {
		offset = 19;
    }
    
    var scrollTop		= FMCGetScrollTop( win );
    var scrollBottom	= scrollTop + FMCGetClientHeight( win, false ) - offset;
    var scrollLeft		= FMCGetScrollLeft( win );
    var scrollRight		= scrollLeft + FMCGetClientWidth( win, false ) - offset;
    
    var nodePos			= FMCGetPosition( node );
    var nodeTop			= nodePos[0];
    var nodeLeft		= parseInt( node.style.textIndent ) + nodePos[1];
    var nodeHeight		= node.offsetHeight;
    var nodeWidth		= node.getElementsByTagName( "a" )[0].offsetWidth;
    
    if ( nodeTop < scrollTop )
    {
        FMCSetScrollTop( win, nodeTop );
    }
    else if ( nodeTop + nodeHeight > scrollBottom )
    {
        FMCSetScrollTop( win, Math.min( nodeTop, nodeTop + nodeHeight - FMCGetClientHeight( win, false ) + offset ) );
    }
    
    if ( nodeLeft < scrollLeft )
    {
        FMCSetScrollLeft( win, nodeLeft );
    }
    else if ( nodeLeft + nodeWidth > scrollRight )
    {
		FMCSetScrollLeft( win, Math.min( nodeLeft, nodeLeft + nodeWidth - FMCGetClientWidth( win, false ) + offset ) );
    }
}

function FMCGetComputedStyle( node, style )
{
    var value   = null;
    
    if ( node.currentStyle )
    {
        value = node.currentStyle[style];
    }
    else if ( document.defaultView && document.defaultView.getComputedStyle )
    {
		var computedStyle	= document.defaultView.getComputedStyle( node, null );
		
		if ( computedStyle )
		{
			value = computedStyle[style];
		}
    }
    
    return value;
}

function FMCConvertToPx( doc, str, dimension, defaultValue )
{
    if ( !str || str.charAt( 0 ) == "-" )
    {
        return defaultValue;
    }
    
    if ( str.charAt( str.length - 1 ) == "\%" )
    {
        switch (dimension)
        {
            case "Width":
                return parseInt( str ) * screen.width / 100;
                
                break;
            case "Height":
                return parseInt( str ) * screen.height / 100;
                
                break;
        }
    }
    else
    {
		if ( parseInt( str ).toString() == str )
		{
			str += "px";
		}
    }
    
    try
    {
        var div	= doc.createElement( "div" );
    }
    catch ( err )
    {
        return defaultValue;
    }
    
    doc.body.appendChild( div );
    
    var value	= defaultValue;
    
    try
    {
        div.style.width = str;
        
        if ( div.currentStyle )
		{
			value = div.offsetWidth;
		}
		else if ( document.defaultView && document.defaultView.getComputedStyle )
		{
			value = parseInt( FMCGetComputedStyle( div, "width" ) );
		}
    }
    catch ( err )
    {
    }
    
    doc.body.removeChild( div );
    
    return value;
}

function FMCStripCssUrl( url )
{
	if ( !url )
	{
		return null;
	}
	
	var regex	= /url\(\s*(['\"]?)([^'\"\s]*)\1\s*\)/;
	var match	= regex.exec( url );
	
	if ( match )
	{
		return match[2];
	}
	
	return null;
}

function FMCGetPropertyValue( propertyNode, defaultValue )
{
	var propValue	= defaultValue;
	var valueNode	= propertyNode.firstChild;
	
	if ( valueNode )
	{
		propValue = valueNode.nodeValue;
	}
	
	return propValue;
}

function FMCParseInt( str, defaultValue )
{
	var num	= parseInt( str );

	if ( num.toString() == "NaN" )
	{
		num = defaultValue;
	}
	
	return num;
}

function FMCConvertBorderToPx( doc, value )
{
	var newValue	= "";
	var valueParts	= value.split( " " );

	for ( var i = 0; i < valueParts.length; i++ )
	{
		var currPart	= valueParts[i];
		
		if ( i == 1 )
		{
			currPart = FMCConvertToPx( doc, currPart, null, currPart );
			
			if ( parseInt( currPart ).toString() == currPart )
			{
				currPart += "px";
			}
		}

		newValue += (((i > 0) ? " " : "") + currPart);
	}
	
	return newValue;
}

function FMCUnhide( win, node )
{
    for ( var currNode = node.parentNode; currNode.nodeName != "BODY"; currNode = currNode.parentNode )
    {
        if ( currNode.style.display == "none" )
        {
            var classRoot   = FMCContainsClassRoot( currNode.className, "MCExpandingBody", "MCDropDownBody", "MCTextPopupBody" );
            
            if ( classRoot == "MCExpandingBody" )
            {
                win.FMCExpand( currNode.parentNode.getElementsByTagName("a")[0] );
            }
            else if ( classRoot == "MCDropDownBody" )
            {
                var dropDownBodyID  = currNode.id.substring( "MCDropDownBody".length + 1, currNode.id.length );
                var aNodes          = currNode.parentNode.getElementsByTagName( "a" );
                
                for ( var i = 0; i < aNodes.length; i++ )
                {
                    var aNode   = aNodes[i];
                    
                    if ( aNode.id.substring( "MCDropDownHotSpot".length + 1, aNode.id.length ) == dropDownBodyID )
                    {
                        win.FMCDropDown( aNode );
                    }
                }
            }
            else if ( FMCGetMCAttribute( currNode, "MadCap:targetName" ) )
            {
                var targetName      = FMCGetMCAttribute( currNode, "MadCap:targetName" );
                var togglerNodes    = FMCGetElementsByClassRoot( document.body, "MCToggler" );
                
                for ( var i = 0; i < togglerNodes.length; i++ )
                {
                    var targets = FMCGetMCAttribute( togglerNodes[i], "MadCap:targets" ).split( ";" );
                    var found   = false;
                    
                    for ( var j = 0; j < targets.length; j++ )
                    {
                        if ( targets[j] == targetName )
                        {
                            found = true;
                            
                            break;
                        }
                    }
                    
                    if ( !found )
                    {
                        continue;
                    }
                    
                    win.FMCToggler( togglerNodes[i] );
                    
                    break;
                }
            }
            else if ( classRoot == "MCTextPopupBody" )
            {
                continue;
            }
            else
            {
                currNode.style.display = "";
            }
        }
    }
}

function StartLoading( win, parentElement, loadingLabel, loadingAltText, fadeElement )
{
	if ( !win.MCLoadingCount )
	{
		win.MCLoadingCount = 0;
	}
	
	win.MCLoadingCount++;
	
	if ( win.MCLoadingCount > 1 )
	{
		return;
	}
	
	//
	
	if ( fadeElement )
	{
		// IE bug: This causes the tab outline not to show and also causes the TOC entry fonts to look bold.
		//	if ( fadeElement.filters )
		//	{
		//		fadeElement.style.filter = "alpha( opacity = 10 )";
		//	}
		/*else*/ if ( fadeElement.style.MozOpacity != null )
		{
			fadeElement.style.MozOpacity = "0.1";
		}
	}

	var span		= win.document.createElement( "span" );
	var img			= win.document.createElement( "img" );
	var midPointX	= FMCGetScrollLeft( win ) + FMCGetClientWidth( win, false ) / 2;
	var spacing		= 3;

	parentElement.appendChild( span );

	span.id = "LoadingText";
	span.appendChild( win.document.createTextNode( loadingLabel ) );
	span.style.fontFamily = "Tahoma, Sans-Serif";
	span.style.fontSize = "9px";
	span.style.fontWeight = "bold";
	span.style.position = "absolute";
	span.style.left = (midPointX - (span.offsetWidth / 2)) + "px";

	var rootFrame	= FMCGetRootFrame();
	
	img.id = "LoadingImage";
	img.src = rootFrame.gRootFolder + "Skin/Images/Loading.gif";
	img.alt = loadingAltText;
	img.style.width = "70px";
	img.style.height = "13px";
	img.style.position = "absolute";
	img.style.left = (midPointX - (70/2)) + "px";

	var totalHeight	= span.offsetHeight + spacing + parseInt( img.style.height );
	var spanTop		= (FMCGetScrollTop( win ) + (FMCGetClientHeight( win, false ) - totalHeight)) / 2;

	span.style.top = spanTop + "px";
	img.style.top = spanTop + span.offsetHeight + spacing + "px";

	parentElement.appendChild( img );
}

function EndLoading( win, fadeElement )
{
	win.MCLoadingCount--;
	
	if ( win.MCLoadingCount > 0 )
	{
		return;
	}
	
	//
	
	var span	= win.document.getElementById( "LoadingText" );
	var img		= win.document.getElementById( "LoadingImage" );

	span.parentNode.removeChild( span );
	img.parentNode.removeChild( img );

	if ( fadeElement )
	{
		// IE bug: This causes the tab outline not to show and also causes the TOC entry fonts to look bold.
		//	if ( fadeElement.filters )
		//	{
		//		fadeElement.style.filter = "alpha( opacity = 100 )";
		//	}
		/*else*/ if ( fadeElement.style.MozOpacity != null )
		{
			fadeElement.style.MozOpacity = "1.0";
		}
	}
}

var gCallbacks	= new Array();

function FMCRegisterCallback( frameName, CallbackFunc )
{
	var numCallbacks	= gCallbacks.length;
	var funcName		= null;

	gCallbacks[numCallbacks] = CallbackFunc;
	
	switch ( frameName )
	{
		case "TOC":
			funcName = "FMCCheckTocLoaded";
			
			break;
	}
	
	if ( funcName )
	{
		setTimeout( funcName + "( " + numCallbacks + " );", 1 );
	}
}

function FMCCheckTocLoaded( index )
{
	var rootFrame	= FMCGetRootFrame();
	
	if ( rootFrame.frames["navigation"].frames["toc"].gInit )
	{
		gCallbacks[index]();
	}
	else
	{
		setTimeout( "FMCCheckTocLoaded( " + index + " );" , 1 );
	}
}

function FMCSortStringArray( stringArray )
{
	stringArray.sort( FMCCompareStrings );
}

function FMCCompareStrings( a, b )
{
	var ret;

	if ( a.toLowerCase() < b.toLowerCase() )
	{
		ret = -1;
	}
	else if ( a.toLowerCase() == b.toLowerCase() )
	{
		ret = 0;
	}
	else if ( a.toLowerCase() > b.toLowerCase() )
	{
		ret = 1;
	}

	return ret;
}

//
//    End helper functions
//

//
//    Class CMCXmlParser
//

function CMCXmlParser( args, LoadFunc )
{
	// Private member variables and functions
	
	var mSelf		= this;
    this.mXmlDoc	= null;
    this.mXmlHttp	= null;
    this.mArgs		= args;
    this.mLoadFunc	= LoadFunc;
    
    this.OnreadystatechangeLocal	= function()
	{
		if ( mSelf.mXmlDoc.readyState == 4 )
		{
			mSelf.mLoadFunc( mSelf.mXmlDoc, mSelf.mArgs );
		}
	};
	
	this.OnreadystatechangeRemote	= function()
	{
		if ( mSelf.mXmlHttp.readyState == 4 )
		{
			mSelf.mLoadFunc( mSelf.mXmlHttp.responseXML, mSelf.mArgs );
		}
	};
}

CMCXmlParser.prototype.LoadLocal	= function( xmlFile, async )
{
	if ( window.ActiveXObject )
    {
        this.mXmlDoc = new ActiveXObject( "Microsoft.XMLDOM" );
        this.mXmlDoc.async = async;
        
        if ( this.mLoadFunc )
        {
			this.mXmlDoc.onreadystatechange = this.OnreadystatechangeLocal;
        }
        
        try
        {
            if ( !this.mXmlDoc.load( xmlFile ) )
            {
                this.mXmlDoc = null;
            }
        }
        catch ( err )
        {
			this.mXmlDoc = null;
        }
    }
    else if ( window.XMLHttpRequest )
    {
        this.LoadRemote( xmlFile, async ); // window.XMLHttpRequest also works on local files
    }

    return this.mXmlDoc;
};

CMCXmlParser.prototype.LoadRemote	= function( xmlFile, async )
{
	if ( window.ActiveXObject )
    {
        this.mXmlHttp = new ActiveXObject( "Msxml2.XMLHTTP" );
    }
    else if ( window.XMLHttpRequest )
    {
        xmlFile = xmlFile.replace( /;/g, "%3B" );   // For Safari
        this.mXmlHttp = new XMLHttpRequest();
    }
    
    if ( this.mLoadFunc )
    {
		this.mXmlHttp.onreadystatechange = this.OnreadystatechangeRemote;
    }
    
    this.mXmlHttp.open( "GET", xmlFile, async );
    
    try
    {
        this.mXmlHttp.send( null );
    }
    catch ( err )
    {
		this.mXmlHttp.abort();
    }
    
    if ( !async && (this.mXmlHttp.status == 0 || this.mXmlHttp.status == 200) )
    {
		this.mXmlDoc = this.mXmlHttp.responseXML;
    }
    
    return this.mXmlDoc;
};

// Public member functions

CMCXmlParser.prototype.Load	= function( xmlFile, async )
{
	var xmlDoc			= null;
	var protocolType	= document.location.protocol;
	
	if ( protocolType == "file:" )
	{
		xmlDoc = this.LoadLocal( xmlFile, async );
	}
	else if ( protocolType == "http:" || protocolType == "https:" )
	{
		xmlDoc = this.LoadRemote( xmlFile, async );
	}
	
	return xmlDoc;
};

// Static member functions

CMCXmlParser.GetXmlDoc	= function( xmlFile, async, LoadFunc, args )
{
	var xmlParser	= new CMCXmlParser( args, LoadFunc );
    var xmlDoc		= xmlParser.Load( xmlFile, async );
    
    return xmlDoc;
}

//
//    End class CMCXmlParser
//

//
//    Class CMCDictionary
//

function CMCDictionary()
{
    // Public properties
    
    this.mMap	= new Array();
    this.mKeys	= new Array();
}

CMCDictionary.prototype.GetItem		= function( key )
{
	var item	= this.mMap["_" + key];

	if ( typeof( item ) == "undefined" )
	{
		item = null;
	}

    return item;
};

CMCDictionary.prototype.GetKeys		= function()
{
	return this.mKeys;
};

CMCDictionary.prototype.RemoveItem	= function( key )
{
	delete( this.mMap["_" + key] );
	delete( this.mKeys[key] );
}

CMCDictionary.prototype.SetItem		= function( key, value )
{
    this.mMap["_" + key] = value;
    this.mKeys[key] = true;
};

//
//    End class CMCDictionary
//

//
//    DOM traversal functions
//

function FMCGetElementsByClassRoot( node, classRoot )
{
    var nodes   = new Array();
    var args    = new Array();
    
    args[0] = nodes;
    args[1] = classRoot;
    
    FMCTraverseDOM( "post", node, FMCGetByClassRoot, args );
                         
    return nodes;
}

function FMCGetByClassRoot( node, args )
{
    var nodes       = args[0];
    var classRoot   = args[1];
    
    if ( node.nodeType == 1 && FMCContainsClassRoot( node.className, classRoot ) )
    {
        nodes[nodes.length] = node;
    }
}

function FMCGetElementsByAttribute( node, attribute, value )
{
    var nodes   = new Array();
    var args    = new Array();
    
    args[0] = nodes;
    args[1] = attribute;
    args[2] = value;
    
    FMCTraverseDOM( "post", node, FMCGetByAttribute, args );
                         
    return nodes;
}

function FMCGetByAttribute( node, args )
{
    var nodes       = args[0];
    var attribute   = args[1];
    var value       = args[2];
    
    try
    {
        if ( node.nodeType == 1 && (FMCGetMCAttribute( node, attribute ) == value || (value == "*" && FMCGetMCAttribute( node, attribute ))) )
        {
            nodes[nodes.length] = node;
        }
    }
    catch( err )
    {
        node.setAttribute( attribute, null );
    }
}

function FMCTraverseDOM( type, root, Func, args )
{
    if ( type == "pre" )
    {
        Func( root, args );
    }
    
    if ( root.childNodes.length != 0 )
    {
        for ( var i = 0; i < root.childNodes.length; i++ )
        {
            FMCTraverseDOM( type, root.childNodes[i], Func, args );
        }
    }
    
    if ( type == "post" )
    {
        Func( root, args );
    }
}

//
//    End DOM traversal functions
//

//
//    Button effects
//

var gButton		= null;
var gTabIndex	= 1;

function MakeButton( td, title, outImagePath, overImagePath, selectedImagePath, width, height, text )
{
	var div	= document.createElement( "div" );
	
	div.tabIndex = gTabIndex++;
	
    title ? div.title = title : false;
    div.setAttribute( "MadCap:outImage", outImagePath );
    div.setAttribute( "MadCap:overImage", overImagePath );
    div.setAttribute( "MadCap:selectedImage", selectedImagePath );
    div.setAttribute( "MadCap:width", width );
    div.setAttribute( "MadCap:height", height );
    
    FMCPreloadImage( outImagePath );
    FMCPreloadImage( overImagePath );
    FMCPreloadImage( selectedImagePath );
    
    div.appendChild( document.createTextNode( text ) );
    td.appendChild( div );
    
    InitButton( div );
}

function InitButton( button )
{
	var width	= parseInt( FMCGetMCAttribute( button, "MadCap:width" ) ) + "px";
	var height	= parseInt( FMCGetMCAttribute( button, "MadCap:height" ) ) + "px";

	button.style.backgroundImage = "url('" + FMCGetMCAttribute( button, "MadCap:outImage" ) + "')";
	button.style.cursor = "default";
	button.style.width = width;
	button.style.height = height;
	button.onmouseover = function() { this.style.backgroundImage = "url('" + FMCGetMCAttribute( this, "MadCap:overImage" ) + "')"; };
	button.onmouseout = function() { this.style.backgroundImage = "url('" + FMCGetMCAttribute( this, "MadCap:outImage" ) + "')"; };
	button.onmousedown = function() { StartPress( this ); return false; };

	button.parentNode.style.width = width;
	button.parentNode.style.height = height;
}

function StartPress( node )
{
    // Debug
    //window.status += "s";
    
    gButton = node;
    
    if ( document.body.setCapture )
    {
        document.body.setCapture();
        
        document.body.onmousemove = Press;
        document.body.onmouseup = EndPress;
    }
    else if ( document.addEventListener )
    {
        document.addEventListener( "mousemove", Press, true );
        document.addEventListener( "mouseup", EndPress, true );
    }
    
    gButton.style.backgroundImage = "url('" + FMCGetMCAttribute( gButton, "MadCap:selectedImage" ) + "')";
    gButton.onmouseover = function() { this.style.backgroundImage = "url('" + FMCGetMCAttribute( this, "MadCap:selectedImage" ); + "')" };
}

function Press( e )
{
    // Debug
    //window.status += "p";
    
    if ( !e )
    {
        e = window.event;
        target = e.srcElement;
    }
    else if ( e.target )
    {
        target = e.target;
    }
    
    if ( target == gButton )
    {
        gButton.style.backgroundImage = "url('" + FMCGetMCAttribute( gButton, "MadCap:selectedImage" ) + "')";
    }
    else
    {
        gButton.style.backgroundImage = "url('" + FMCGetMCAttribute( gButton, "MadCap:outImage" ) + "')";
    }
}

function EndPress( e )
{
    // Debug
    //window.status += "e";
    
    var target  = null;
    
    if ( !e )
    {
        e = window.event;
        target = e.srcElement;
    }
    else if ( e.target )
    {
        target = e.target;
    }
    
    if ( target == gButton )
    {
        // Debug
        //window.status += "c";
        
        gButton.style.backgroundImage = "url('" + FMCGetMCAttribute( gButton, "MadCap:overImage" ) + "')";
    }
    
    gButton.onmouseover = function() { this.style.backgroundImage = "url('" + FMCGetMCAttribute( this, "MadCap:overImage" ) + "')"; };
    
    if ( document.body.releaseCapture )
    {
        document.body.releaseCapture();
        
        document.body.onmousemove = null;
        document.body.onmouseup = null;
    }
    else if ( document.removeEventListener )
    {
        document.removeEventListener( "mousemove", Press, true );
        document.removeEventListener( "mouseup", EndPress, true );
    }
    
    gButton = null;
}

//
//    End button effects
//
