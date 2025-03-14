# Send test file to URL and print result back
# Test file received via standard in
# File is first argument URL is second argument, optional proxy server is third argument

use LWP::UserAgent;


# Read file contents into $file
open ( INPUT, "< $ARGV[0]")
	or die "Couldn't open $ARGV[0] for reading: $!\n";

while (<INPUT>) {
	$file .= $_;
}

# Setup user agent
$ua = LWP::UserAgent->new;

# set proxy if needed
if ($ARGV[2]) {
	$ua->proxy(http  => $ARGV[2] );
}

#build POST request
  my $req = HTTP::Request->new(POST => $ARGV[1] );
  $req->content_type('application/x-www-form-urlencoded');
  $req->content($file);

#get response & print
  my $res = $ua->request($req);
  print $res->as_string;

