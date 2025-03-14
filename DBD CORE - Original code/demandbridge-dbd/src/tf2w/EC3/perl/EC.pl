#!/usr/bin/perl
#
# Establish communcition with WebEC server
# Send information and the receive information back for return
#
#
# Version 2.0 
#	If no parameters are passed, then we will return an html page giving information about us
#	Delay connection to server so we can return page even if not connected
#

use IO::Socket;
use CGI;

##########
# Initilization section
##########
$ec_ver = "2.0";
$ec_date = "January 21, 2002";
$dir = "C:/PVX/www_interface/";
$suffix = ".ec";


###########
###########


# Gather info from CGI call first, then open connection to the 
# server to print it out

# Get CGI info
$in = new CGI;


#
# If no values then print About info
#

if ( $in->param == 0 ) {
	print $in->header (), $in->start_html( -title => 'ecclient version: ' . $ec_ver ) ;
	print $in->h1( "ecclient by TopForm Software, Inc" );
	print $in->h1( "Version: ", $ec_ver );
	print $in->h1( "Date: ",$ec_date );
	print $in->h1( "Put files into: ", $dir );
	print $in->h1( "Suffix to use: ",$suffix );
	print $in->end_html;
	exit;
}



do 
{
	$outfile = $dir . int( rand( 99999 ) ) . $suffix;
	$infile = $outfile . ".o";
} until ( !( -e $outfile ) );


# Write out values to file for server to process to tmp file 
$tmpout = $outfile . "tmp";
open (WIP, "> $tmpout" );


foreach $key ($in->param) {              
        @values = $in->param($key);
        print WIP "$key=",join(", ",@values),"\n";   
}       

close ( WIP );
rename $tmpout, $outfile;



# Wait until we see the file coming back
until ( -e "$infile" )
	{
	sleep 1;
	};

#open it and send it
sleep 1;
open( RESP, "< $infile" );

#set to flush after every print
$|=1;


while( <RESP> )
	{
	print ();
	};
close( RESP );
unlink $infile;

exit;
