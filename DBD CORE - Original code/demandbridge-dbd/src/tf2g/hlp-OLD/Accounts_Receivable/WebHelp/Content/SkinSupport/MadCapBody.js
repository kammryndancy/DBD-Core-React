// {{MadCap}} //////////////////////////////////////////////////////////////////
// Copyright: MadCap Software, Inc - www.madcapsoftware.com ////////////////////
////////////////////////////////////////////////////////////////////////////////
// <version>2.0.0.0</version>
////////////////////////////////////////////////////////////////////////////////

//

var gOnloadFunction = window.onload;

window.onload = function() { gOnloadFunction ? gOnloadFunction() : false; FMCInit(); };

//

function FMCInit()
{
    FMCCheckForBookmark();

    if ( !FMCIsDotNetHelp() )
    {
		FMCRegisterCallback( "TOC", FMCTocLoaded );
    }
    
    var rootFrame	= FMCGetRootFrame();
    
    if ( rootFrame )
    {
		rootFrame.FMCHighlightUrl( window );
    }
    else if ( FMCHighlightUrl )
    {
		FMCHighlightUrl( window );
    }
}

function FMCTocLoaded()
{
	if ( window.name != "body" )
	{
		return;
	}
	
	if ( parent.frames["navigation"].frames["toc"].gSyncTOC )
    {
        FMCSyncTOC();
    }
}

function FMCCheckForBookmark()
{
    var hash	= document.location.hash;
    
    if ( !hash )
    {
        return;
    }
    
    var bookmark	= null;
    
    if ( hash.charAt( 0 ) == "#" )
    {
        hash = hash.substring( 1 );
    }
    
    var currAnchor  = null;
    
    for ( var i = 0; i < document.anchors.length; i++ )
    {
        currAnchor = document.anchors[i];
        
        if ( currAnchor.name == hash )
        {
            bookmark = currAnchor;
            
            break;
        }
    }
    
    if ( currAnchor )
    {
        FMCUnhide( window, currAnchor );
        
        // Mozilla didn't navigate to the bookmark on load since it was inside a hidden node. So, after we ensure it's visible, navigate to the bookmark again.
        
        if ( !document.body.currentStyle )
        {
            document.location.href = document.location.href;
        }
    }
}

function FMCSyncTOC()
{
    if ( !parent.frames["navigation"].frames["toc"] || parent.frames["body"].document != document )
    {
        return;
    }
    
    var tocPath = FMCGetMCAttribute( document.documentElement, "MadCap:tocPath" );
    
    parent.frames["navigation"].frames["toc"].SyncTOC( tocPath );
}

function FMCGlossaryTermHyperlinkOnClick( node )
{
    var navFrame	= parent.frames["navigation"];
    var anchorName	= FMCGetMCAttribute( node, "MadCap:anchor" );
    
    navFrame.SetActiveIFrameByName( "glossary" );
    navFrame.frames["glossary"].DropDownTerm( anchorName );
}
