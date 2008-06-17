#include "VirtualMachine.h"
#include "VirtualMachineManagerDriver.h"
#include "Nebula.h"

#include "InformationManagerDriver.h"
#include "InformationManager.h"
#include "Mad.h"

#include "Host.h"
#include "HostPool.h"



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

#include <climits>
#include <sstream>

extern "C" void *test(void *nothing)
{
    ostringstream os;

	sleep(2);
	os.str("");
    
    int             rc;
    
    Nebula & pn = Nebula::instance();
    
    HostPool  * thepool = pn.get_hpool();
    Host *    host;
    int       hid;

    thepool->bootstrap();

    thepool->allocate(&hid,"foo.dacya","mad1","mad2","mad3",true);
    
    os.str("");
    os << "Host " << hid << " allocated";
    Nebula::log("TST", Log::ERROR, os);

    thepool->allocate(&hid,"foo2.dacya","mad1","mad2","mad3",true);
    
    os.str("");
    os << "Host " << hid << " allocated";
    Nebula::log("TST", Log::ERROR, os);

    thepool->allocate(&hid,"foo3.dacya","mad1","mad2","mad3",true);
    
    os.str("");
    os << "Host " << hid << " allocated";
    Nebula::log("TST", Log::ERROR, os);

    host = static_cast<Host *>(thepool->get(3422,false));

    if (host != 0)
    {
        os.str("");
        os << "Test failed. Shouldn't be here.";
        Nebula::log("TST", Log::ERROR, os);
    }

    host = static_cast<Host *>(thepool->get(0,true));
    
    if (host != 0)
    {
        os.str("");
        os << "Going fine. Host " << *host << " retrieved.";
        Nebula::log("TST", Log::ERROR, os);
        
        host->unlock();
    }
    else
    {
        os.str("");
        os << "Test failed!. Not able to retrieve host 0";
        Nebula::log("TST", Log::ERROR, os);
    }


    Host * host2 = static_cast<Host *>(thepool->get(1,false));

    if (host2 != 0)
    {
        os.str("");
        os << "Going fine. Host " << *host2 << " retrieved.";
        Nebula::log("TST", Log::ERROR, os);
    }

    Host * host3 = static_cast<Host *>(thepool->get(2,false));

    if (host3 != 0)
    {
        os.str("");
        os << "Going fine. Host " << *host3 << " retrieved.";
        Nebula::log("TST", Log::ERROR, os);
        
    }
    

    Host * host4 = static_cast<Host *>(thepool->get(32,false));


    if (host4 != 0)
    {
        os.str("");
        os << "Going fine. Host " << *host4 << " retrieved.";
        Nebula::log("TST", Log::ERROR, os);
        
    }    
    
    host3->lock();
     
    string host_info_str("cpuArchitecture=x86_32\nnumberCores=1\ncpuSpeed=2211\ntotalMemory=2046\nfreeMemory=125\nusedMemory=1921\ncpupercentage=50\nnetTX=78516\nnetRX=138612\nnetRX=138612\n");
    rc = host3->update_info(host_info_str);

    host3->touch();
    
    
    os.str("");
    os << "updated host info  with RC = " << rc;
    Nebula::log("TST", Log::ERROR, os);
    
    rc = thepool->update_host(host3);
    
    os.str("");
    os << "updated host into DB with RC = " << rc;
    Nebula::log("TST", Log::ERROR, os);
    
    bool result;
    char * error;
    
    rc = host3->match("numberCores=1  & cpuArchitecture=\"OTRA ARCH\"",result,&error);
    
    os.str("");
    if ( rc == 0)
    { 
        os << "REQ result = " << result;
    }
    else
    {
        os << "REQ error = " << error;
        
        free(error);
    }
    Nebula::log("TST", Log::ERROR, os);

    int resulti;
    
    rc = host3->rank("cpuSpeed + numberCores",resulti,&error);
    
    os.str("");
    if ( rc == 0)
    { 
        os << "RANK result = " << resulti;
    }
    else
    {
        os << "RANK error = " << error;
        
        free(error);
    }
    Nebula::log("TST", Log::ERROR, os);
    
    host3->unlock();

    host3->lock();
     
    string host_info_str2("cpuArchitecture=\"OTRA ARCH\"\n");
    
    rc = host3->update_info(host_info_str2);

    host3->touch();
    
    rc = thepool->update_host(host3);
        
    host3->unlock();
    

    host2->lock();
     
    string host_info_str3("cpuArchitecture=x86_32\nnumberCores=8\ncpuSpeed=2211\ntotalMemory=2046\nfreeMemory=125\nusedMemory=1921\ncpupercentage=50\nnetTX=78516\nnetRX=138612\nnetRX=138612\n");
    
    rc = host2->update_info(host_info_str3);

    host2->touch();
    
    rc = thepool->update_host(host2);
        
    host2->unlock();
    
    map <int, string> test_discover;
    
    rc = thepool->discover(&test_discover);
    
    if(rc!=0)
    {
        os.str("");
        os << "Error discovering hosts.";
        Nebula::log("TST", Log::ERROR, os);
    }
    
    os.str("");
    os << "Discover size:" << test_discover.size();
    Nebula::log("TST", Log::ERROR, os);
    
    map <int, string>::iterator it;
     
     for(it=test_discover.begin();it!=test_discover.end();it++)
     {   
         os.str("");
         os << "IM_MAD:" << it->second << " has to monitor " << it->first;
         Nebula::log("TST", Log::ERROR, os);
    }

    return 0;
}



int main()
{    
    pthread_t       test_thread;

    pthread_create(&test_thread,0,test,(void *)0);

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
