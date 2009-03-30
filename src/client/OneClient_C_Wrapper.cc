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

#include "OneClient.h"
#include <iostream>
#include <string.h>
using namespace std;

/* ************************************************************************** */
#define ONED_PORT 60222
OneClient* client=0;
/* ************************************************************************** */


void c_oneStart()
{
#ifdef ONED_PORT
    client=new OneClient("localhost",ONED_PORT);
#else
    client=new OneClient("localhost");
#endif
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void c_oneFree()
{
    if(client)
        delete client;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int c_oneDeploy(int vmid, int hid)
{
	string info;
	
    if(!client)
        return -1;
    
    if(client->deploy(vmid,hid,info) <0)
    {
        cerr<<info<<endl;
        return -1;
    }
    
    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int c_oneMigrate(int vmid, int hid, int flag)
{
	string info;
	
    if (!client)
        return -1;
    
    if(client->migrate(vmid,hid,(bool)flag,info) <0)
    {
        cerr<<info<<endl;
        return -1;
    }
    
    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int c_oneAllocate(char* vm_template)
{
	string info;
	int vmid;
	
    if (!client)
        return -1;
        
    if( (client->allocate(vm_template,vmid, info)) <0)
    {
        cerr<<info<<endl;
        return -1;
    }
    return vmid;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int c_oneAllocateTemplate(char* vm_template)
{
	string info;
	int vmid;
	
    if (!client)
        return -1;
        
    if( (client->allocate_template(vm_template,vmid, info)) <0)
    {
        cerr<<info<<endl;
        return -1;
    }
    return vmid;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int c_oneShutdown(int vmid)
{
	string info;
	
    if (!client)
        return -1;
    
    if(client->shutdown(vmid,info) <0)
    {
        cerr<<info<<endl;
        return  -1;
    }
    
    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int c_oneSuspend(int vmid)
{
	string info;
	
    if (!client)
        return -1;
    
    if (client->suspend(vmid,info) <0)
    {
        cerr<<info<<endl;
        return -1;
    }
    
    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int c_oneStop(int vmid)
{
	string info;
	
    if (!client)
        return -1;
    
    if (client->stop(vmid,info) <0)
    {
        cerr<<info<<endl;
        return -1;
    }
    
    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int c_oneResume(int vmid)
{
	string info;
	
    if (!client)
        return -1;
        
    if( client->resume(vmid,info) <0)
    {
        cerr<<info<<endl;
        return -1;
    }
    
    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int c_oneVmInfo(int vmid, char* ret_info,int leng)
{
    string info;
    string error;

    if (!client || !ret_info)
        return -1;
    
    if(client->info(vmid,info,error) <0)
    {
        cerr<<error<<endl;
        return -1;
    }
    
    strncpy(ret_info,info.c_str(),leng-1);
    
    return 0;
};

