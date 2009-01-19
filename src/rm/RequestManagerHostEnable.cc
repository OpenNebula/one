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

#include "RequestManager.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::HostEnable::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{ 
    string              session;

    int                 hid;
    bool				enable;
    Host *              host;
    ostringstream       oss;

    /*   -- RPC specific vars --  */
    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    Nebula::log("ReM",Log::DEBUG,"HostEnable method invoked");

    // Get the parameters & host
    session = xmlrpc_c::value_string(paramList.getString(0));
    hid     = xmlrpc_c::value_int(paramList.getInt(1));
    enable  = xmlrpc_c::value_boolean(paramList.getBoolean(2));

    host = HostEnable::hpool->get(hid,true);    
                                                 
    if ( host == 0 )                             
    {                                            
        goto error_host_get;                     
    }
    
    if ( enable == true)
    {
    	host->enable();
    }
    else
    {
    	host->disable();
    }

    HostEnable::hpool->update(host);
    
    host->unlock();
  
    //Result
    
    arrayData.push_back(xmlrpc_c::value_boolean(true));
    arrayresult = new xmlrpc_c::value_array(arrayData);
    
    *retval = *arrayresult;

    delete arrayresult;

    return;

error_host_get:
    
    oss << "Error getting host with HID = " << hid;     
    Nebula::log("ReM",Log::ERROR,oss); 

    arrayData.push_back(xmlrpc_c::value_boolean(false));
    arrayData.push_back(xmlrpc_c::value_string(oss.str()));

    xmlrpc_c::value_array arrayresult_error(arrayData);

    *retval = arrayresult_error;
    
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
