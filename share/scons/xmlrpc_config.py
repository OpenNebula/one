# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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

import copy
import SCons

xmlrpc_test_program='''
#include <xmlrpc-c/base.hpp>
#include <xmlrpc-c/registry.hpp>

int main(int argc, char *argv[])
{
    xmlrpc_c::registry RequestManagerRegistry;
    return 0;
}
'''

xmlrpc_config_configurations=[
    ['pkg-config xmlrpc_server_abyss++ --static --libs', 'pkg-config xmlrpc_client++ --static --libs'],
    ['pkg-config xmlrpc_server_abyss++ --static --libs', 'pkg-config xmlrpc_client++ --libs ; pkg-config libcurl --libs'],
    ['pkg-config xmlrpc_server_abyss++ --static --libs', 'xmlrpc-c-config client c++ --libs'],
    [r'xmlrpc-c-config abyss-server c++ --libs | tr "\n" " " ; echo -lxmlrpc_server_abyss++ -lxmlrpc++ -lxmlrpc_server++', 
        r'xmlrpc-c-config abyss-server c++ --libs | tr "\n" " " ; echo -lxmlrpc_server_abyss++ -lxmlrpc++ -lxmlrpc_server++'],
    ['false', 'false']
]

good_xmlrpc_config=''
good_xmlrpc_client=''
good_xmlrpc_server=''

def CheckXMLRPCConfig(env, conf):
    #old_env=env.env.Clone()
    env.Message('Checking XMLRPC linking with: "'+conf[0]+'"... ')
    try:
        env.env.ParseConfig(conf[0])
        #env.env.ParseConfig(conf[1])
        result=env.TryLink(xmlrpc_test_program, '.cc')
        env.Result(result)
        print "chejou ao final"
    except:
        print conf[0]+": vaiserquenon"
        result=False
    print conf[0]+": parecequefuncionnou"
    print result
    #env.env=old_env
    
    # Set configuration variables
    good_xmlrpc_server=conf[0]
    good_xmlrpc_client=conf[1]
    
    env.env['XMLRPC_SERVER']=conf[0]
    env.env['XMLRPC_CLIENT']=conf[1]
    
    return result

def CheckXMLRPC(env):
    for i in xmlrpc_config_configurations:
        res=CheckXMLRPCConfig(env, i)
        print "Result:"
        print res
        if res!=False:
            env.env['XMLRPC_SERVER']=good_xmlrpc_server
            env.env['XMLRPC_CLIENT']=good_xmlrpc_client
            
            print "funsionou"
            return res
    return False
    
def ConfigureXMLRPC(env):
    # Check XMLRPC
    xmlrpc_conf=Configure(env, custom_tests={'CheckXMLRPC' : CheckXMLRPC})
    if not xmlrpc_conf.CheckXMLRPC():
        print 'Can not link to XMLRPC libraries.'
        Exit(1)
    
    env['XMLRPC_SERVER']=good_xmlrpc_server
    env['XMLRPC_CLIENT']=good_xmlrpc_client
    
    xmlrpc_conf=xmlrpc_conf.Finish()


