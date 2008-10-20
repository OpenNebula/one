#include "OneClient.h"
#include <iostream>
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

