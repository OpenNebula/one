
#include <stdio.h>

#include "Nebula.h"
#include <sqlite3.h>
#include <exception>
#include "VirtualMachine.h"
#include "VirtualMachineManagerDriver.h"

extern "C" void *test(void *nothing)
{
    VirtualMachineManager *vm_manager;
    InformationManager    *im_manager;
    Nebula&             ne = Nebula::instance();
    string              s_template;
    ostringstream       os;
    
    sleep(20);
    
    Nebula::log("TST", Log::INFO, "Alive!");
    
    vm_manager = ne.get_vmm();
    vm_manager->load_mads(0);
    
    im_manager = ne.get_im();
    im_manager->load_mads(0);
    
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

