# -*- coding: utf-8 -*-
# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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
    cwd+'/src/sam',
    cwd+'/src/schedm'
])

# Compile flags
main_env.Append(CPPFLAGS=[
    "-g",
    "-Wall",
    "-std=c++17",
    "-Wno-overloaded-virtual"
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
vars.Add('parsers', 'Rebuild flex/bison files', 'no')
vars.Add('fireedge', 'Build FireEdge', 'no')
vars.Add('systemd', 'Build with systemd support', 'no')
vars.Add('rubygems', 'Generate Ruby gems', 'no')
vars.Add('svncterm', 'Build VNC support for LXD drivers', 'yes')
vars.Add('context', 'Download guest contextualization packages', 'no')
vars.Add('strict', 'Strict C++ compiler, more warnings, treat warnings as errors', 'no')
vars.Add('download', 'Download 3rdParty tools', 'no')
vars.Add('xmlrpc_pkgconf', 'Use pkg-config for xmlrpc-c libs dependency', 'no')
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

# Download: Download 3rdParty tools
download = ARGUMENTS.get('download', 'no')
if download == 'yes':
    tools = Popen(['find', '.', '-type', 'f', '-executable', '-path', '*/vendor/download'], stdout=PIPE).stdout.readlines()

    for t in tools:
        tool = t.rstrip().decode()
        print("Executing: {}".format(tool))
        Popen(tool)

# Rubygem generation
main_env.Append(rubygems=ARGUMENTS.get('rubygems', 'no'))

# Enterprise Edition
main_env.Append(enterprise=ARGUMENTS.get('enterprise', 'no'))

# FireEdge minified files generation
main_env.Append(fireedge=ARGUMENTS.get('fireedge', 'no'))

# Context packages download
main_env.Append(context=ARGUMENTS.get('context', 'no'))

# Use pkg-config to detect xmlrpc-c libs
main_env.Append(xmlrpc_pkgconf=ARGUMENTS.get('xmlrpc_pkgconf', 'no'))

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

    xmlrpc_pkgconf = ARGUMENTS.get('xmlrpc_pkgconf', 'no')
    # xmlrpc-c-config doesn't work well in el8/9 use pkg-config directly
    if xmlrpc_pkgconf == 'yes':
        try:
            main_env.ParseConfig('pkg-config xmlrpc xmlrpc++ xmlrpc_util xmlrpc_util++ xmlrpc_client xmlrpc_client++ --libs --cflags')
            main_env.ParseConfig('pkg-config xmlrpc_abyss xmlrpc_server_abyss++ xmlrpc_server xmlrpc_server++ xmlrpc_util xmlrpc_util++ xmlrpc_server_pstream --libs --cflags')
        except Exception:
            print("")
            print("pkg-config failed")
            print("")
            exit(-1)
    else:
        try:
            main_env.ParseConfig('xmlrpc-c-config c++2 client --libs --cflags')
            main_env.ParseConfig('xmlrpc-c-config c++2 abyss-server --libs --cflags')

        except Exception:
            print("")
            print("xmlrpc-c-config was not found in the path")
            print("")
            exit(-1)
else:
    main_env.Replace(mysql='yes')

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
    'src/schedm_mad/remotes/rank/SConstruct',
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
    'src/fireedge/SConstruct',
    'share/rubygems/SConstruct',
    'src/client/SConstruct',
    'src/monitor/SConstruct',
    'src/protocol/SConstruct',
    'src/sam/SConstruct',
    'src/schedm/SConstruct',
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
