# -*- coding: utf-8 -*-
# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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
# -------------------------------------------------------------------------- #

import os
import sys
import shutil
from subprocess import Popen, PIPE

import SCons
from SCons.Environment import Environment
from SCons.Script import ARGUMENTS, SConscript

sys.path.append("./share/scons")
from lex_bison import *


# Get git version
try:
    out = Popen(["git", "describe", "--dirty", "--always", "--abbrev=8"],
                stdout=PIPE)
    git_version = out.communicate()[0].rstrip().decode('utf-8')
except OSError:
    git_version = ARGUMENTS.get('gitversion', 'not known')

# This is the absolute path where the project is located
cwd = os.getcwd()

# Environment that will be applied to each scons child
main_env = Environment()
main_env['ENV']['PATH'] = os.environ['PATH']

main_env['CXXFLAGS'] = " -DGITVERSION=\'\"" + git_version + "\"\'"

# snippet borrowed from http://dev.gentoo.org/~vapier/scons-blows.txt
# makes scons aware of build related environment variables
if 'CC' in os.environ:
    main_env['CC'] = os.environ['CC']
if 'CFLAGS' in os.environ:
    main_env['CCFLAGS'] += SCons.Util.CLVar(os.environ['CFLAGS'])
if 'CXX' in os.environ:
    main_env['CXX'] = os.environ['CXX']
if 'CXXFLAGS' in os.environ:
    main_env['CXXFLAGS'] += SCons.Util.CLVar(os.environ['CXXFLAGS'])
if 'LDFLAGS' in os.environ:
    main_env['LINKFLAGS'] += SCons.Util.CLVar(os.environ['LDFLAGS'])
else:
    os.environ['LDFLAGS'] = ""

# Add builders for flex and bison
add_lex(main_env)
add_bison(main_env)

# Include dirs
main_env.Append(CPPPATH=[
    cwd+'/include',
    cwd+'/src/monitor/include',
    cwd+'/src/parsers'
])

# Library dirs
main_env.Append(LIBPATH=[
    cwd+'/src/parsers',
    cwd+'/src/common',
    cwd+'/src/log',
    cwd+'/src/raft',
    cwd+'/src/sql',
    cwd+'/src/host',
    cwd+'/src/cluster',
    cwd+'/src/datastore',
    cwd+'/src/group',
    cwd+'/src/nebula',
    cwd+'/src/pool',
    cwd+'/src/template',
    cwd+'/src/vm',
    cwd+'/src/vm_group',
    cwd+'/src/vm_template',
    cwd+'/src/vmm',
    cwd+'/src/lcm',
    cwd+'/src/tm',
    cwd+'/src/dm',
    cwd+'/src/im',
    cwd+'/src/image',
    cwd+'/src/rm',
    cwd+'/src/vnm',
    cwd+'/src/vn_template',
    cwd+'/src/hm',
    cwd+'/src/um',
    cwd+'/src/authm',
    cwd+'/src/acl',
    cwd+'/src/xml',
    cwd+'/src/document',
    cwd+'/src/zone',
    cwd+'/src/client',
    cwd+'/src/secgroup',
    cwd+'/src/vdc',
    cwd+'/src/vrouter',
    cwd+'/src/market',
    cwd+'/src/ipamm',
    cwd+'/src/data_model',
    cwd+'/src/protocol',
    cwd+'/src/sam'
])

# Compile flags
main_env.Append(CPPFLAGS=[
    "-g",
    "-Wall",
    "-std=c++17"
])

# Linking flags & common libraries
main_env.Append(LINKFLAGS=['-g', '-pthread'])
main_env.Append(LIBS=['z'])

#######################
# EXTRA CONFIGURATION #
#######################

# Generate help text
vars = Variables('custom.py')
vars.Add('sqlite_dir', 'Path to sqlite directory', '')
vars.Add('sqlite', 'Build with SQLite support', 'yes')
vars.Add('mysql', 'Build with MySQL support', 'no')
vars.Add('postgresql', 'Build with PostgreSQL support', 'no')
vars.Add('parsers', 'Obsolete. Rebuild flex/bison files', 'no')
vars.Add('xmlrpc', 'Path to xmlrpc directory', '')
vars.Add('new_xmlrpc', 'Use xmlrpc-c version >=1.31', 'no')
vars.Add('sunstone', 'Build Sunstone', 'no')
vars.Add('fireedge', 'Build FireEdge', 'no')
vars.Add('systemd', 'Build with systemd support', 'no')
vars.Add('docker_machine', 'Build Docker machine driver', 'no')
vars.Add('rubygems', 'Generate Ruby gems', 'no')
vars.Add('svncterm', 'Build VNC support for LXD drivers', 'yes')
vars.Add('context', 'Download guest contextualization packages', 'no')
vars.Add('strict', 'Strict C++ compiler, more warnings, treat warnings as errors', 'no')
env = Environment(variables = vars)
Help(vars.GenerateHelpText(env))

# SQLITE
sqlite_dir = ARGUMENTS.get('sqlite_dir', "none")
if sqlite_dir != 'none':
    main_env.Append(LIBPATH=[sqlite_dir+"/lib", sqlite_dir+"/lib64"])
    main_env.Append(CPPPATH=[sqlite_dir+"/include"])

sqlite = ARGUMENTS.get('sqlite', 'yes')
if sqlite == 'yes':
    main_env.Append(sqlite='yes')
    main_env.Append(CPPFLAGS=["-DSQLITE_DB"])
    main_env.Append(LIBS=['sqlite3'])
else:
    main_env.Append(sqlite='no')

# MySQL
mysql = ARGUMENTS.get('mysql', 'no')
if mysql == 'yes':
    main_env.Append(mysql='yes')
    main_env.Append(CPPFLAGS=["-DMYSQL_DB"])
    main_env.Append(LIBS=['mysqlclient'])
else:
    main_env.Append(mysql='no')

# PostgreSql
postgresql = ARGUMENTS.get('postgresql', 'no')
if postgresql == 'yes':
    main_env.Append(postgresql='yes')
    main_env.Append(CPPPATH=['/usr/include/postgresql'])
    main_env.Append(CPPFLAGS=["-DPOSTGRESQL_DB"])
    main_env.Append(LIBS=['libpq'])
else:
    main_env.Append(postgresql='no')

# Flag to compile with xmlrpc-c versions prior to 1.31 (September 2012)
new_xmlrpc = ARGUMENTS.get('new_xmlrpc', 'no')
if new_xmlrpc == 'yes':
    main_env.Append(new_xmlrpc='yes')
else:
    main_env.Append(new_xmlrpc='no')
    main_env.Append(CPPFLAGS=["-DOLD_XMLRPC"])

# xmlrpc
xmlrpc_dir = ARGUMENTS.get('xmlrpc', 'none')
if xmlrpc_dir != 'none':
    main_env.Append(LIBPATH=[xmlrpc_dir+"/lib", xmlrpc_dir+"/lib64"])
    main_env.Append(CPPPATH=[xmlrpc_dir+"/include"])

# systemd
systemd = ARGUMENTS.get('systemd', 'no')
if systemd == 'yes':
    main_env.Append(systemd='yes')
    main_env.Append(CPPFLAGS=["-DSYSTEMD"])
    main_env.Append(LIBS=['systemd'])
else:
    main_env.Append(systemd='no')

# build lex/bison
build_parsers = ARGUMENTS.get('parsers', 'no')
if build_parsers == 'yes':
    main_env.Append(parsers='yes')
else:
    main_env.Append(parsers='no')

# strict: Add more warnings add treat warnings as errors
strict = ARGUMENTS.get('strict', 'no')
if strict == 'yes':
    main_env.Append(CPPFLAGS=[
        "-Wextra",
        "-Werror",
        "-Wno-error=deprecated-declarations",
        "-Wno-unused-parameter",
        "-Wno-unused-result"
    ])


# Rubygem generation
main_env.Append(rubygems=ARGUMENTS.get('rubygems', 'no'))

# Enterprise Edition
main_env.Append(enterprise=ARGUMENTS.get('enterprise', 'no'))

# Sunstone minified files generation
main_env.Append(sunstone=ARGUMENTS.get('sunstone', 'no'))

# FireEdge minified files generation
main_env.Append(fireedge=ARGUMENTS.get('fireedge', 'no'))

# TODO this should be aligned with one-ee-tools workflows
# Onedb Marshal files generation
main_env.Append(marshal=ARGUMENTS.get('marshal', 'no'))

# Docker-machine addon generation
main_env.Append(docker_machine=ARGUMENTS.get('docker_machine', 'no'))

# Context packages download
main_env.Append(context=ARGUMENTS.get('context', 'no'))

if not main_env.GetOption('clean'):
    try:
        if mysql == 'yes':
            main_env.ParseConfig('mysql_config --cflags --libs')
    except Exception:
        print("")
        print("mysql_config was not found in the path")
        print("")
        print("Check that mysql development package is installed and")
        print("mysql_config is in the path. If your mysql config tool")
        print("is called mysql5_config make a symlink as mysql_config")
        print("to a directory in the path.")
        print("")
        exit(-1)

    try:
        env_xmlrpc_flags = "LDFLAGS='%s' CXXFLAGS='%s' CPPFLAGS='%s'" % (
                           os.environ.get('LDFLAGS', ''),
                           os.environ.get('CXXFLAGS', ''),
                           os.environ.get('CPPFLAGS', ''))

        main_env.ParseConfig("%s share/scons/get_xmlrpc_config server" % (
                             env_xmlrpc_flags,))
        main_env.ParseConfig("%s share/scons/get_xmlrpc_config client" % (
                             env_xmlrpc_flags,))

    except Exception:
        print("")
        print("Error searching for xmlrpc-c libraries. Please check this "
              "things:")
        print("")
        print(" * You have installed development libraries for xmlrpc-c."
              "One way to check")
        print("   this is calling xmlrpc-c-config that is provided with the "
              "development")
        print("   package.")
        print(" * Check that the version of xmlrpc-c is at least 1.06. You "
              "can do this also")
        print("   calling:")
        print("   $ xmlrpc-c-config --version")
        print(" * If all this requirements are already met please send log") +\
            (" files located in")
        print("   .xmlrpc_test to the mailing list.")
        print("")
        exit(-1)
else:
    main_env.Replace(mysql='yes')
    shutil.rmtree('.xmlrpc_test', True)
    shutil.rmtree('src/nebula/.xmlrpc_test', True)
    shutil.rmtree('src/scheduler/.xmlrpc_test', True)


# libxml2
main_env.ParseConfig('xml2-config --libs --cflags')

svncterm_path = 'src/svncterm_server/SConstruct'

# SCONS scripts to build
build_scripts = [
    'src/parsers/SConstruct',
    'src/sql/SConstruct',
    'src/log/SConstruct',
    'src/raft/SConstruct',
    'src/common/SConstruct',
    'src/template/SConstruct',
    'src/host/SConstruct',
    'src/cluster/SConstruct',
    'src/datastore/SConstruct',
    'src/group/SConstruct',
    'src/nebula/SConstruct',
    'src/pool/SConstruct',
    'src/vm/SConstruct',
    'src/vm_group/SConstruct',
    'src/vm_template/SConstruct',
    'src/vmm/SConstruct',
    'src/lcm/SConstruct',
    'src/rm/SConstruct',
    'src/tm/SConstruct',
    'src/im/SConstruct',
    'src/image/SConstruct',
    'src/dm/SConstruct',
    'src/scheduler/SConstruct',
    'src/vnm/SConstruct',
    'src/vn_template/SConstruct',
    'src/hm/SConstruct',
    'src/um/SConstruct',
    'src/authm/SConstruct',
    'src/acl/SConstruct',
    'src/xml/SConstruct',
    'src/document/SConstruct',
    'src/zone/SConstruct',
    'src/secgroup/SConstruct',
    'src/vdc/SConstruct',
    'src/vrouter/SConstruct',
    'src/market/SConstruct',
    'src/ipamm/SConstruct',
    'src/sunstone/public/locale/languages/SConstruct',
    'src/sunstone/public/SConstruct',
    'src/fireedge/SConstruct',
    'share/rubygems/SConstruct',
    'src/client/SConstruct',
    'src/docker_machine/SConstruct',
    'src/monitor/SConstruct',
    'src/onedb/SConstruct',
    'src/protocol/SConstruct',
    'src/sam/SConstruct',
    svncterm_path,
    'share/context/SConstruct'
]

# disable svncterm
svncterm = ARGUMENTS.get('svncterm', 'yes')
if svncterm == 'no':
    build_scripts.remove(svncterm_path)
else:
    pass

for script in build_scripts:
    env = main_env.Clone()
    SConscript(script, exports='env')
