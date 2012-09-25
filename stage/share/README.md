
# Requirements

* OpenNebula source code
* Requirements for OpenNebula context package creation. Those can be found in <one source code>/share/scripts/context-packages/README.md

# Usage

First we need to set the environment variable ONE_SOURCE to the place where OpenNebula source code resides.

  $ export ONE_SOURCE=<some path>

We should edit ''gen_package.sh'' script to change the package version. Then we can execute ''gen_package.sh'': We can also select ''deb'' or ''rpm'' as the package to generate:

  $ ./PACKAGE_TYPE=rpm ./gen_package.sh

After the successful package creation the command tells us where the package is located.

  $ ./gen_package.sh 
  rm: app-context_3.6.0.deb: No such file or directory
  Created deb package {"path":"/Users/jfontan/tmp/borrar/git/one2/share/scripts/context-packages/app-context_3.6.0.deb"}
  app-context_3.6.0.deb

Now we can update the packages located in the directory packages. Remember to use ''git rm'' to delete the old packages and ''git add'' to add the new one. Example:

    $ ./gen_package.sh 
    rm: app-context_3.6.1.deb: No such file or directory
    Created deb package {"path":"/Users/jfontan/tmp/borrar/git/one2/share/scripts/context-packages/app-context_3.6.1.deb"}
    app-context_3.6.1.deb

    $ git rm packages/app-context_3.6.0.deb
    $ cp /Users/jfontan/tmp/borrar/git/one2/share/scripts/context-packages/app-context_3.6.1.deb packages/
    $ git add packages/app-context_3.6.1.deb 
    $ git commit -m'appstage: added context package version 3.6.1'
    $ git push

These packages will be used for the oneapps package generation.


