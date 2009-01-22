/* -------------------------------------------------------------------------- */
/* Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

#include "EC2Driver.h"
#include <sstream>
#include <fstream>

int EC2Driver::deployment_description(
    const VirtualMachine *  vm,
    const string&           file_name) const
{

    ofstream                    file;
    vector<const Attribute *>   attrs;
    const VectorAttribute *     ec2;

    string aminame   = "";
    string keypair   = "";
    string elasticip = "";
    string a_ports = "";
    string itype     = "";

    // -------------------------------------------------------------------------

    file.open(file_name.c_str(), ios::out);

    if (file.fail() == true)
    {
    	goto error_file;
    }

    // -------------------------------------------------------------------------

    if ( vm->get_template_attribute("EC2",attrs) == 0 )
	{
    	goto error_ec2;
    }

    ec2 = static_cast<const VectorAttribute *>(attrs[0]);

    // ------------------------------------------------------------------------
    //  AMI - Amazon Machine Image
    // ------------------------------------------------------------------------

    aminame = ec2->vector_value("AMI");

    if (aminame.empty())
    {
    	goto error_aminame;
    }

    file << "aminame=" << aminame << "\n" << endl;

    // ------------------------------------------------------------------------
    //  KEY PAIR - IdRsa key pair
    // ------------------------------------------------------------------------

    keypair = ec2->vector_value("KEYPAIR");

    if (keypair.empty())
    {
    	get_default("EC2","KEYPAIR",keypair);

     	if ( keypair.empty() )
        {
        	goto error_keypair;
        }
    }

    file << "keypair=" << keypair << "\n" << endl;

    // ------------------------------------------------------------------------
    //  ELASTIC IP ADDRESS
    // ------------------------------------------------------------------------

    elasticip = ec2->vector_value("ELASTICIP");

    if (!elasticip.empty())
    {
    	file << "elasticip=" << elasticip << "\n" << endl;
    }

    // ------------------------------------------------------------------------
    //  AUTHORIZED PORTS
    // ------------------------------------------------------------------------

    a_ports = ec2->vector_value("AUTHORIZEDPORTS");

    if (a_ports.empty())
    {
    	get_default("EC2","AUTHORIZEDPORTS",a_ports);
    }

    if (!a_ports.empty())
    {
    	file << "authorizedports=" << a_ports << "\n" << endl;
    }

    // ------------------------------------------------------------------------
    //  INSTANCE TYPE
    // ------------------------------------------------------------------------

    itype = ec2->vector_value("INSTANCETYPE");

    if (itype.empty())
    {
    	get_default("EC2","INSTANCETYPE",itype);

     	if ( itype.empty() )
        {
        	goto error_itype;
        }
    }

    file << "instancetype=" << itype << "\n" << endl;

    file.close();

    return 0;

error_file:
   	vm->log("VMM", Log::ERROR, "Could not open EC2 deployment file.");
   	return -1;

error_ec2:
	vm->log("VMM", Log::ERROR, "No EC2 attributes found.");
	file.close();
	return -1;

error_aminame:
	vm->log("VMM", Log::ERROR, "No AMI name attribute defined.");
	file.close();
	return -1;

error_keypair:
	vm->log("VMM", Log::ERROR, "No keypair defined and no default provided.");
	file.close();
	return -1;

error_itype:
	vm->log("VMM", Log::ERROR, "No AMI type defined and no default provided.");
	file.close();
	return -1;
}
