// {{MadCap}} //////////////////////////////////////////////////////////////////
// Copyright: MadCap Software, Inc - www.madcapsoftware.com ////////////////////
////////////////////////////////////////////////////////////////////////////////
// <version>2.0.0.0</version>
////////////////////////////////////////////////////////////////////////////////

var gInit   = false;

function Init()
{
    if ( gInit )
    {
        return;
    }
    
    gInit = true;
    
    //
    
    var masterHS	= parent.parent.GetMasterHelpSystem();
    
    masterHS.LoadGlossary();
    
    // IE 6.0+ bug. When loading the glossary, we replace the document's body with XML. For some reason, this causes
    // the 11th line of the document to not render in IE. This works around that issue.
    
    if ( document.body.currentStyle && masterHS.IsMerged() )
    {
        setTimeout( "SetGlossaryIFrameWidth();", 50 );
    }
}

function SetGlossaryIFrameWidth()
{
    parent.document.getElementById( "glossary" ).style.width = "100%";
}

function DropDownTerm( anchorName )
{
    var anchors = document.getElementsByTagName( "a" );
    
    for ( var i = 0; i < anchors.length; i++ )
    {
        var anchor  = anchors[i];
        
        if ( anchor.name == anchorName )
        {
            if ( FMCGetChildNodesByTagName( anchor.parentNode.parentNode, "DIV" )[1].style.display == "none" )
            {
                FMCDropDown( anchor.parentNode.getElementsByTagName( "a" )[0] );
            }
            
            break;
        }
    }
    
    FMCScrollToVisible( window, anchor.parentNode.parentNode );
}
