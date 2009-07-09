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

void RequestManager::VirtualNetworkDelete::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{ 
    string              session;

    string              name;
    int                 nid;
    int                 uid;

    VirtualNetwork *    vn;
    
    int                 rc;        
    ostringstream       oss;

    /*   -- RPC specific vars --  */
    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    Nebula::log("ReM",Log::DEBUG,"VirtualNetworkDelete method invoked");

    // Get the parameters & host
    session   = xmlrpc_c::value_string(paramList.getString(0));
    nid       = xmlrpc_c::value_int   (paramList.getInt   (1));
    
    // Retrieve VN from the pool 
    vn = vnpool->get(nid,true);    
   
    if ( vn == 0 )                             
    {                                            
        goto error_vn_get;                     
    }

    uid = vn->get_uid();

    // Only oneadmin or the VN owner can perform operations upon the VN
    rc = VirtualNetworkDelete::upool->authenticate(session);
    
    if ( rc != 0 && rc != uid)                             
    {                                            
        goto error_authenticate;                     
    }
   
    rc = vnpool->drop(vn);
   
    // All nice, return the host info to the client  
    arrayData.push_back(xmlrpc_c::value_boolean( rc == 0 )); // SUCCESS
    arrayresult = new xmlrpc_c::value_array(arrayData);
   
    // Copy arrayresult into retval mem space
    *retval = *arrayresult;
    // and get rid of the original
    delete arrayresult;
   
    return;

error_authenticate:
    vn->unlock();
    oss << "User cannot delete VN";
    goto error_common;

error_vn_get:
    oss << "Error getting Virtual Network with NID = " << nid;
    goto error_common;
 
error_common:
    Nebula::log ("Rem",Log::ERROR,oss);
  
    arrayData.push_back(xmlrpc_c::value_boolean(false)); // FAILURE
    arrayData.push_back(xmlrpc_c::value_string(oss.str()));
  
    xmlrpc_c::value_array arrayresult_error(arrayData);
  
    *retval = arrayresult_error;
  
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
