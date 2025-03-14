#This script is used to test that Perl is working
#Run from the command line, in response to prompts
#enter name=test<ret>  basic=test<ret> then CTRL-Z
#on unix systems use CTRL-D
#It should print out a list in the form
#name=test
#basic=test
#based on what you typed in

use CGI;

print "Enter lines of the form: name=value\n";
print "Use Ctrl-Z or Ctrl-D at beginning of last line to end\n";
print "You should see a list with each line of the form: name=value\n";
print "  of what you typed in.\n\n";


$in = new CGI;

print "\n\n\n";

foreach $key ($in->param) {              
	print "$key=";
        @values = $in->param($key);
        print join(", ",@values),"\n";   
}       

exit;