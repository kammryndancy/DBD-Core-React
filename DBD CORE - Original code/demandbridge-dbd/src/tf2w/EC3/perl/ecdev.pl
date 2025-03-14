#!/usr/bin/perl
#
# Establish communcition with WebEC server
# Send information and the receive information back for return
#
#
use IO::Socket;
use CGI;

# Gather info from CGI call first, then open connection to the 
# server to print it out

# Get CGI info
$in = new CGI;


# Start connection to server
$server =  IO::Socket::INET->new(	PeerAddr => "10.6.72.10"
					PeerPort => 4544,
					Proto 	 => "tcp",
					Type	 => SOCK_STREAM)
	or die "Couldn't connect to Web EC Server: $@\n";	

# Set AutoFlush
$server->autoflush(1);


# get version number from server for reference
$version = <$server>;	



#
# Now send values to the server
#	
foreach $key ($in->param) {              
        @values = $in->param($key);
        print $server "$key=",join(", ",@values),"\n";   
}       


while (($ekey, $eval) = each %ENV) {
	if ( $ekey =~ /^REMOTE_/ ) {
		print $server "$ekey=$eval\n";
	}
}

#
# Say we're done now
#
print $server "END\n";

#
# Now get return data until we see an END
#
	while (<$server>) {
		$line = $_;
		chomp($line);	
		# if it is the word END then we are done
		last if ( $line eq "END" or $line eq "END\r" );
		print "$line\n";
	}	


#
# Now close the connection to the server
#
close ( $server );
 
