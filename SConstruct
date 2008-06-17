
import os
import sys
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


# SCONS scripts to build
build_scripts=[
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
]

for script in build_scripts:
    env=main_env.Clone()
    SConscript(script, exports='env')


