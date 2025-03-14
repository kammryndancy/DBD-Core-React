// {{MadCap}} //////////////////////////////////////////////////////////////////
// Copyright: MadCap Software, Inc - www.madcapsoftware.com ////////////////////
////////////////////////////////////////////////////////////////////////////////
// <version>2.0.0.0</version>
////////////////////////////////////////////////////////////////////////////////

var gRootFolder				= FMCGetRootFolder( document.location );
var gHelpSystem				= null;
var gStartTopic				= gDefaultStartTopic;
var gLoadingLabel			= "LOADING";
var gLoadingAlternateText	= "Loading";

CheckCSH();

window.onresize = WindowOnresize;

function WindowOnresize()
{
	// Firefox on Mac: might trigger this event before everything is finished being loaded.
	
	var indexFrame	= frames["navigation"].frames["index"];
	
	if ( indexFrame )
	{
		indexFrame.RefreshIndex();
	}
}

function CheckCSH()
{
	var hash	= document.location.hash.substring( 1 );
	
	if ( hash != "" )
	{
		var cshParts	= hash.split( "|" );
		
		for ( var i = 0; i < cshParts.length; i++ )
		{
			var pair	= cshParts[i].split( "=" );
			
			if ( pair[0] == "StartTopic" )
			{
				gStartTopic = pair[1];
			}
			else if ( pair[0] == "SkinName" )
			{
				gSkinFolder = "Data/Skin" + pair[1] + "/";
			}
		}
	}
}

function GetMasterHelpSystem()
{
	if ( !gHelpSystem )
	{
		gHelpSystem = new CMCHelpSystem( null, gRootFolder, gRootFolder + gSubsystemFile, null );
	}
	
	return gHelpSystem;
}

function Init()
{
	FMCPreloadImage( "Images/Loading.gif" );
	
	LoadSkin();
}

function LoadSkin()
{
    var xmlDoc		= CMCXmlParser.GetXmlDoc( gRootFolder + gSkinFolder + "Skin.xml", false, null, null );
    var xmlHead		= xmlDoc.getElementsByTagName( "CatapultSkin" )[0];
    var caption		= xmlHead.getAttribute( "Title" );
    
    caption ? document.title = caption : false;
    
    //
    
    LoadWebHelpOptions( xmlDoc );
    
	try
	{
		if ( window.opener && window.opener.gCSHData && window.opener.gCSHData.isJS )
		{
			window.opener.gCSHData.isJS = false;
		}
		else
		{
			LoadSize( xmlDoc );
		}
	}
	catch ( err )
	{
		LoadSize( xmlDoc );
	}
}

function LoadSize( xmlDoc )
{
    try
    {
        var doc = frames["body"].document;
    }
    catch ( err )
    {
        return;
    }
    
    var xmlHead			= xmlDoc.documentElement;
    var useDefaultSize	= xmlHead.getAttribute( "UseBrowserDefaultSize" );
    
    if ( useDefaultSize && useDefaultSize == "True" )
    {
		return;
    }
    
    var topPx		= FMCConvertToPx( frames["body"].document, xmlHead.getAttribute( "Top" ), null, 0 );
    var leftPx		= FMCConvertToPx( frames["body"].document, xmlHead.getAttribute( "Left" ), null, 0 );
    var bottomPx	= FMCConvertToPx( frames["body"].document, xmlHead.getAttribute( "Bottom" ), null, 0 );
    var rightPx		= FMCConvertToPx( frames["body"].document, xmlHead.getAttribute( "Right" ), null, 0 );
    var widthPx		= FMCConvertToPx( frames["body"].document, xmlHead.getAttribute( "Width" ), "Width", 800 );
    var heightPx	= FMCConvertToPx( frames["body"].document, xmlHead.getAttribute( "Height" ), "Height", 600 );
    
    var anchors = xmlHead.getAttribute( "Anchors" );
    
    if ( anchors )
    {
        var aTop    = (anchors.indexOf( "Top" ) > -1)    ? true : false;
        var aLeft   = (anchors.indexOf( "Left" ) > -1)   ? true : false;
        var aBottom = (anchors.indexOf( "Bottom" ) > -1) ? true : false;
        var aRight  = (anchors.indexOf( "Right" ) > -1)  ? true : false;
        var aWidth  = (anchors.indexOf( "Width" ) > -1)  ? true : false;
        var aHeight = (anchors.indexOf( "Height" ) > -1) ? true : false;
    }
    
    if ( aLeft && aRight )
    {
        widthPx = screen.availWidth - (leftPx + rightPx);
    }
    else if ( !aLeft && aRight )
    {
        leftPx = screen.availWidth - (widthPx + rightPx);
    }
    else if ( aWidth )
    {
        leftPx = (screen.availWidth / 2) - (widthPx / 2);
    }
    
    if ( aTop && aBottom )
    {
        heightPx = screen.availHeight - (topPx + bottomPx);
    }
    else if ( !aTop && aBottom )
    {
        topPx = screen.availHeight - (heightPx + bottomPx);
    }
    else if ( aHeight )
    {
        topPx = (screen.availHeight / 2) - (heightPx / 2);
    }
    
	if ( window == top )
	{
		try
		{
			// This is in a try/catch block because there seems to be a bug in IE where if the window loses focus
			// immediately before these statements are executed, IE will produce an "Access is denied" error.
			
			window.resizeTo( widthPx, heightPx );
			window.moveTo( leftPx, topPx );
		}
		catch ( err )
		{
		}
	}
}

function LoadWebHelpOptions( xmlDoc )
{
    var webHelpOptions	= xmlDoc.getElementsByTagName( "WebHelpOptions" )[0];
    var navPosition		= "Left";
    
    if ( webHelpOptions )
    {
		if ( webHelpOptions.getAttribute( "NavigationPanePosition" ) )
		{
			navPosition = webHelpOptions.getAttribute( "NavigationPanePosition" );
		}
		
        if ( webHelpOptions.getAttribute( "NavigationPaneWidth" ) )
        {
            var navWidth    = webHelpOptions.getAttribute( "NavigationPaneWidth" );
            
            if ( navWidth != "0" )
            {
				var hideNavStartup	= false;

				if ( webHelpOptions.getAttribute( "HideNavigationOnStartup" ) )
				{
					hideNavStartup = FMCGetAttributeBool( webHelpOptions, "HideNavigationOnStartup", false );
				}
				
				if ( !hideNavStartup )
				{
					if ( navPosition == "Left" )
					{
						document.getElementsByTagName( "frameset" )[1].cols = navWidth + ", *";
					}
					else if ( navPosition == "Right" )
					{
						document.getElementsByTagName( "frameset" )[1].cols = "*, " + navWidth;
					}
					else if ( navPosition == "Top" )
					{
						var resizeBarHeight = 7;
	                    
						document.getElementsByTagName( "frameset" )[0].rows = navWidth + ", " + resizeBarHeight + ", *";
					}
					else if ( navPosition == "Bottom" )
					{
						document.getElementsByTagName( "frameset" )[0].rows = "*, " + navWidth;
					}
                }
            }
        }
    }
    
    // Safari
    
    if ( document.clientHeight != undefined )
    {
		var frameNodes	= document.getElementsByTagName( "frame" );
		
		for ( var i = 0; i < frameNodes.length; i++ )
        {
            if ( frameNodes[i].name == "navigation" )
            {
				if ( navPosition == "Left" )
				{
					frameNodes[i].style.borderRight = "solid 1px #444444";
					
					break;
				}
				else if ( navPosition == "Right" )
				{
					frameNodes[i].style.borderLeft = "solid 1px #444444";
                    
                    break;
				}
            }
        }
    }
}

//
//    Class CMCResourceManager
//

var gResourceManager	= new function()
{
	// Private member variables and functions
	
	var mInitialized	= false;
	var mResourceMap	= null;
	
    function Initialize()
    {
		mInitialized = true;
		mResourceMap = new CMCDictionary();
		
		var rootFrame		= FMCGetRootFrame();
		var styleDoc		= CMCXmlParser.GetXmlDoc( rootFrame.gRootFolder + rootFrame.gSkinFolder + "Stylesheet.xml", false, null, null );
		var resourcesInfos	= styleDoc.getElementsByTagName( "ResourcesInfo" );

		if ( resourcesInfos.length > 0 )
		{
			var resources	= resourcesInfos[0].getElementsByTagName( "Resource" );

			for ( var i = 0; i < resources.length; i++ )
			{
				var resource	= resources[i];
				var properties	= new CMCDictionary();
				var name		= resource.getAttribute( "Name" );
				
				if ( !name ) { continue; }

				for ( var j = 0; j < resource.attributes.length; j++ )
				{
					var attribute	= resource.attributes[j];
					
					properties.SetItem( attribute.nodeName.toLowerCase(), attribute.nodeValue.toLowerCase() );
				}

				mResourceMap.SetItem( name, properties );
			}
		}
    }
    
    // Public member functions
    
    this.GetResourceProperty	= function( name, property, defaultValue )
	{
		if ( !mInitialized )
		{
			Initialize();
		}
		
		var properties	= mResourceMap.GetItem( name );

		if ( !properties )
		{
			return defaultValue;
		}

		var propValue	= properties.GetItem( property.toLowerCase() );

		if ( !propValue )
		{
			return defaultValue;
		}

		return propValue;
	}
}

//
//    End class CMCResourceManager
//
