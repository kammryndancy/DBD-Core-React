# get_image.pl
# this script is used to get an image, or if the image is
# not found, to post a "not on file" image in its place instead 
# of a broken image link


#
# Version 2.0 
#	If no parameters are passed, then we will return an html page giving information about us
#	Delay connection to server so we can return page even if not connected
#

use CGI;
use LWP::Simple;                                                   
use URI::Escape;                                                   


##########
# Initilization section
##########
$ec_ver = "2.0";
$ec_date = "February 13, 2002";



# Start a new CGI object
	$in = new CGI;


# Gather info from CGI call first, then open connection to the 
#
# If no values then print About info
#

if ( $in->param == 0 ) {
	print $in->header (), $in->start_html( -title => 'get_image version: ' . $ec_ver ) ;
	print $in->h1( "get_image by TopForm Software, Inc" );
	print $in->h1( "Version: ", $ec_ver );
	print $in->h1( "Date: ",$ec_date );

	print $in->end_html;
	exit;
}


# Get the requested image file in '$req_image'
# and the nof image file into 'nof_image'
	$req_image = $in->param('req_image');
	$nof_image = $in->param('nof_image');

# Now try to get the requested file and put it into $content
# If not found the load $content with $nof_image

	if ( defined ($content= get $req_image)  ) {
	} else {                                                            
        $content=get $nof_image;         
 	}

#
# Now return $content as an image file
#

#set to flush after every print                 
	$|=1;   
                                         
# send the header first 
	print $in->header('image/gif');          

	print $content;                                                    
