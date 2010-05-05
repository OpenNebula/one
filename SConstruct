# -------------------------------------------------------------------------- #
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

import os
import sys
import shutil
sys.path.append("./share/scons")
from lex_bison import *

# This is the absolute path where the project is located
cwd=os.getcwd()

# Environment that will be applied to each scons child
main_env=Environment()
main_env['ENV']['PATH']=os.environ['PATH']

# Add builders for flex and bison
add_lex(main_env)
add_bison(main_env)

# Include dirs
main_env.Append(CPPPATH=[
    cwd+'/include',
])

# Library dirs
main_env.Append(LIBPATH=[
    cwd+'/src/common',
    cwd+'/src/host',
    cwd+'/src/mad',
    cwd+'/src/nebula',
    cwd+'/src/pool',
    cwd+'/src/template',
    cwd+'/src/vm',
    cwd+'/src/vmm',
    cwd+'/src/lcm',
    cwd+'/src/tm',
    cwd+'/src/dm',
    cwd+'/src/im',
    cwd+'/src/rm',
    cwd+'/src/vnm',
    cwd+'/src/hm',
    cwd+'/src/um',
])

# Compile flags
main_env.Append(CPPFLAGS=[
    "-g",
    "-Wall"
])

# Linking flags
main_env.Append(LDFLAGS=["-g"])

#######################
# EXTRA CONFIGURATION #
#######################

# SQLITE
sqlite_dir=ARGUMENTS.get('sqlite', 'none')
if sqlite_dir!='none':
    main_env.Append(LIBPATH=[sqlite_dir+"/lib"])
    main_env.Append(CPPPATH=[sqlite_dir+"/include"])
    
# MySQL
mysql=ARGUMENTS.get('mysql', 'no')
if mysql=='yes':
    main_env.Append(mysql='yes')
else:
    main_env.Append(mysql='no')

# xmlrpc
xmlrpc_dir=ARGUMENTS.get('xmlrpc', 'none')
if xmlrpc_dir!='none':
    main_env.Append(LIBPATH=[xmlrpc_dir+"/lib"])
    main_env.Append(CPPPATH=[xmlrpc_dir+"/include"])

# build lex/bison
build_parsers=ARGUMENTS.get('parsers', 'no')
if build_parsers=='yes':
    main_env.Append(parsers='yes')
else:
    main_env.Append(parsers='no')

if not main_env.GetOption('clean'):
    try:
        main_env.ParseConfig('share/scons/get_xmlrpc_config server')
        main_env.ParseConfig('share/scons/get_xmlrpc_config client')
        
        if mysql=='yes':
            main_env.ParseConfig('mysql_config5 --cflags --libs')
            
    except Exception, e:
        print ""
        print "Error searching for xmlrpc-c libraries. Please check this"+\
            " things:"
        print ""
        print " * You have installed development libraries for xmlrpc-c. One"+\
            " way to check"
        print "   this is calling xmlrpc-c-config that is provided with the"+\
            " development"
        print "   package."
        print " * Check that the version of xmlrpc-c is at least 1.06. You"+\
            " can do this also"
        print "   calling:"
        print "   $ xmlrpc-c-config --version"
        print " * If all this requirements are already met please send log"+\
            " files located in"
        print "   .xmlrpc_test to the mailing list."
        print ""
        exit(-1)
else:
    shutil.rmtree('.xmlrpc_test', True)
    shutil.rmtree('src/nebula/.xmlrpc_test', True)
    shutil.rmtree('src/scheduler/.xmlrpc_test', True)

# SCONS scripts to build
build_scripts=[
    'src/client/SConstruct',
    'src/common/SConstruct',
    'src/template/SConstruct',
    'src/host/SConstruct',
    'src/mad/SConstruct',
    'src/nebula/SConstruct',
    'src/pool/SConstruct',
    'src/vm/SConstruct',
    'src/vmm/SConstruct',
    'src/lcm/SConstruct',
    'src/rm/SConstruct',
    'src/tm/SConstruct',
    'src/im/SConstruct',
    'src/dm/SConstruct',
    'src/scheduler/SConstruct',
    'src/vnm/SConstruct',
    'src/hm/SConstruct',
    'src/um/SConstruct',
]

for script in build_scripts:
    env=main_env.Clone()
    SConscript(script, exports='env')


