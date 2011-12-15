#!/usr/bin/python
# Some autorun patches before we build our code
# - replace the domains in ./chrome/content/privacy-utils.js with the latest

# libs
import getopt
import re
import sys
import urllib

# params
url_domain = 'http://data.iana.org/TLD/tlds-alpha-by-domain.txt' # the url to download domain
file_utils = './chrome/content/privacy-utils.js'
file_server = './chrome/content/privacy-server.js'
file_about = './chrome/content/About.xul'
file_install = './install.rdf'

def main():

  ###############################
  # Parse the command line
  ###############################
  try:
    opts, args = getopt.getopt(sys.argv[1:], "v:n:", ["version", "version number"])
  except getopt.GetoptError, err:
    print args[0] + " -v [version] -n [version number]"
    sys.exit(0) 
  version = opts[0][1]
  version_number = opts[1][1]

  ###############################
  # Autoset the version and version number
  ###############################
  # Set on the server module (./chrome/content/privacy-server.js)
  f = file(file_server, 'r')
  content = f.read()
  re_version = re.compile(r'version : "[a-z]{0,15}"')
  re_version_number = re.compile(r'piigeonVersion : ".{0,15}"')
  content = re.sub(re_version, 'version : "' + version + 'xxx"', content)
  content = re.sub(re_version_number, 'piigeonVersion : "' + version_number + '"', content)
  f.close()
  f = file(file_server, 'w')
  f.write(content)
  f.close()

  # Set on the install.rdf file
  f = file(file_install, 'r')
  content = f.read()
  re_version = re.compile(r'em:version=".{0,15}"')
  content = re.sub(re_version, 'em:version="' + version_number + '"', content)
  f.close()
  f = file(file_install, 'w')
  f.write(content)
  f.close()

  ###############################
  # Update domains according to iana.org web page
  ###############################

  # Get a file-like object for the Python Web site's home page.
  f = urllib.urlopen(url_domain)

  # Read from the object, storing the page's contents in 's'.
  s = f.read()
  f.close()

  # Count num of domain suffix
  num = 0
  set_domain = set([])
  output = "domainSuffix: new Array("

  # Split each line downloaded from the page and construct the string to be replaced
  arr_domain = s.split("\n")
  for element in arr_domain:
    # Skip length == 0
    if (len(element) == 0):
      continue
    # Skip strings starting with '#'
    if (element[0] == '#'):
      continue

    # Only get domain before '--'
    element = element.split('--')[0]
    set_domain.add(element)

  arr_domain = list(set_domain)
  arr_domain.sort()
  for element in arr_domain:
    # Increment num
    num = num + 1
    if element == arr_domain[len(arr_domain) - 1]:
      output = output + "'" + element.lower() + "'"
    else:
      output = output + "'" + element.lower() + "', "
  output = output + "),"

  # Replace the downloaded strings from the source code
  f = file(file_utils, 'r')
  content = f.read()
  re_domain = re.compile(r'domainSuffix: new Array\(.*\)\,')
  content = re.sub(re_domain, output, content)
  f.close()
  f = file(file_utils, 'w')
  f.write(content)
  f.close()

  print "We got " + str(num) + " domains."


if __name__ == "__main__":
  main()
