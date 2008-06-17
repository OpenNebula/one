/* -------------------------------------------------------------------------- */
/* Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   */
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

#include "VirtualMachine.h"
#include "VirtualMachineManagerDriver.h"
#include "Nebula.h"

#include "InformationManagerDriver.h"
#include "InformationManager.h"
#include "Mad.h"



#include <string>
#include <iostream>

#include <stdlib.h>
#include <stdexcept>

#include <signal.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <pthread.h>

using namespace std;


extern "C" void *test(void *nothing)
{
    sleep(2);

    Nebula& pn = Nebula::instance();
    
    InformationManager * im = pn.get_im();
    HostPool * hostp        = pn.get_hpool();
 
    int * oid;
    int rc;
    
    sleep(2);
    
   /* rc = hostp->allocate(oid,"aquila03","im_test","xen_ssh","dummy",true);

    if ( rc != 0 )
    {
        Nebula::log("TST",Log::ERROR,"Error allocating host!");
        return 0;
    }   
*/
    
    im->load_mads();
    
    sleep(600);
    
    return 0;
}

int main()
{    
    pthread_attr_t  pattr;
    pthread_t       test_thread;
    
    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);
    
    pthread_create(&test_thread,&pattr,test,(void *)0);
    
    try
    {
        Nebula& nd  = Nebula::instance();
        nd.start();    
    }
    catch (exception &e)
    {
        cout << e.what() << endl;
 
        return -1;
    }
    
    
    return 0;
}

