use CGI;
$creator=CGI::new();
# Inside CGI.pm there is an item called header. It does something specific.
# Look at page 6-4 to see what that is.
# The -> just means it is pointing to that item in the CGI.pm
# This is how you use the givens in the CGI.pm module.


print $creator->header();
print $creator->start_html(
-title=>'Test if Perl Running',
-bgcolor=>'beige');

print "<h1>Perl is working on this server</h1>";

print $creator->end_html();

