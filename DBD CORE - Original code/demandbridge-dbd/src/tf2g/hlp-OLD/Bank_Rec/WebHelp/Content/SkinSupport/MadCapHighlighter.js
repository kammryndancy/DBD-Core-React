// {{MadCap}} //////////////////////////////////////////////////////////////////
// Copyright: MadCap Software, Inc - www.madcapsoftware.com ////////////////////
////////////////////////////////////////////////////////////////////////////////
// <version>2.0.0.0</version>
////////////////////////////////////////////////////////////////////////////////

var gColorTable		= new Array( "#ffff66,#000000",
                                 "#a0ffff,#000000",
                                 "#99ff99,#000000",
                                 "#ff9999,#000000",
                                 "#ff66ff,#000000",
                                 "#880000,#ffffff",
                                 "#00aa00,#ffffff",
                                 "#886800,#ffffff",
                                 "#004699,#ffffff",
                                 "#990099,#ffffff" );
var gColorIndex		= 0;
var gFirstHighlight	= null;

function FMCClearSearch( win )
{
    var highlights	= FMCGetElementsByClassRoot( win.document, "highlight" );
    
    for ( var i = 0; i < highlights.length; i++ )
    {
        var text	= win.document.createTextNode( highlights[i].innerHTML );
        
        highlights[i].parentNode.replaceChild( text, highlights[i] );
    }
    
    gColorIndex = 0;
    gFirstHighlight = null;
    
    // At this point, highlight nodes got replaced by text nodes. This causes nodes that were once single text nodes to
    // become divided into multiple text nodes. Future attempts to highlight multi-character strings may not work
    // because they may have been divided into multiple text nodes. To solve this, we merge adjacent text nodes.
    
    FMCMergeTextNodes( win.document.body );
}

function FMCMergeTextNodes( node )
{
    for ( var i = node.childNodes.length - 1; i >= 1; i-- )
    {
        var currNode	= node.childNodes[i];
        var prevNode	= currNode.previousSibling;
        
        if ( currNode.nodeType == 3 && prevNode.nodeType == 3 )
        {
            prevNode.nodeValue = prevNode.nodeValue + currNode.nodeValue;
            node.removeChild( currNode );
        }
    }
    
    for ( var i = 0; i < node.childNodes.length; i++ )
    {
        FMCMergeTextNodes( node.childNodes[i] );
    }
}

function FMCApplyHighlight( win, root, term, color, caseSensitive )
{
    var term2   = caseSensitive ? term : term.toLowerCase();
    
    for ( var i = root.childNodes.length - 1; i >= 0; i-- )
    {
        var node    = root.childNodes[i];
        
        FMCApplyHighlight( win, node, term, color, caseSensitive );
        
        if ( node.nodeType != 3 || node.parentNode.nodeName == "SCRIPT" )
        {
            continue;
        }
        
        var currNode    = node;
        var text        = currNode.nodeValue;
        var text2       = caseSensitive ? text : text.toLowerCase();
        
        for ( var pos = text2.indexOf( term2 ); pos >= 0; pos = text2.indexOf( term2 ) )
        {
            var span    = win.document.createElement( "span" );
            
            span.className = "highlight";
            span.style.fontWeight = "bold";
            span.style.backgroundColor = color.split( "," )[0];
            span.style.color = color.split( "," )[1];
            span.appendChild( win.document.createTextNode( text.substring( pos, pos + term.length ) ) );
            
            currNode.nodeValue = text.substring( 0, pos );
            currNode.parentNode.insertBefore( span, currNode.nextSibling );
            currNode.parentNode.insertBefore( win.document.createTextNode( text.substring( pos + term.length, text.length ) ), span.nextSibling );
            
            currNode = currNode.nextSibling.nextSibling;
            text = currNode.nodeValue;
            text2 = caseSensitive ? text : text.toLowerCase();
            
            //
            
            if ( !gFirstHighlight )
            {
                gFirstHighlight = span;
            }
            
            //
            
            FMCUnhide( win, span );
        }
    }
}

function FMCHighlight( win, term, color, caseSensitive )
{
    if ( term == "" )
    {
        return;
    }
    
    FMCApplyHighlight( win, win.document.body, term, color, caseSensitive );
    
    // Scroll to first highlighted term
    
    if ( gFirstHighlight && gFirstHighlight.offsetTop > win.document.documentElement.clientHeight )
    {
        win.document.documentElement.scrollTop = gFirstHighlight.offsetTop;
    }
}

function FMCHighlightUrl( win )
{
	gColorIndex = 0;
    gFirstHighlight = null;
	
    var url = win.document.location.search;
    
    if ( url != "" && url.indexOf( "Highlight" ) >= 0 )
    {
        url = decodeURIComponent( url );
        
        var highlight	= url.substring( 1 + url.indexOf( "Highlight" ) + "Highlight".length, url.length );
        var stems		= highlight.split( "||" );
        
        for ( var i = 0; i < stems.length; i++ )
        {
            var phrases	= stems[i].split( "|" );
            
            for ( var j = 0; j < phrases.length; j++ )
            {
                FMCHighlight( win, phrases[j], gColorTable[gColorIndex], false );
            }
            
            gColorIndex = (++gColorIndex) % 10;
        }
    }
}
