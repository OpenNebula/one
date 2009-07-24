#include "VirtualMachinePool.h"
#include <climits>
#include <iostream>
#include <sstream>
#include <string>

int main()
{
    sqlite3 *       db;
    
    sqlite3_open("pool.db", &db);
    
    VirtualMachinePool  thepool(db);
    VirtualMachine *    vm;
    int                 eid;
    string st("MEMORY=345\nCPU=4\nDISK=[FILE=\"img\",TYPE=cd]\nDISK=[FILE=\"../f\"]\n");

    thepool.bootstrap();
    
    thepool.allocate(0,st,&eid);
    cout << eid << endl;

    thepool.allocate(0,st,&eid);
    cout << eid << endl;

    thepool.allocate(0,st,&eid);
    cout << eid << endl;

    vm = static_cast<VirtualMachine *>(thepool.get(444,false));

    if (vm != 0)
    {
        cout << *vm;
    }

    vm = static_cast<VirtualMachine *>(thepool.get(1,true));

    string vmm = "xen";
    string tm  = "gridftp";
    
    //vm->add_history(2,2,vmm,tm);
    
    //thepool.update_history(vm);
    
    if (vm != 0)
    {
        cout << *vm << endl;
        
        vm->unlock();
    }
    else
    {
        cout << "VM es cero!" << endl;
    }

    VirtualMachine * vm2 = static_cast<VirtualMachine *>(thepool.get(2,false));

    if (vm2 != 0)
    {

        cout << *vm2;
    }

    VirtualMachine * vm3 = static_cast<VirtualMachine *>(thepool.get(3,true));

    if (vm3 != 0)
    {
        cout << *vm3;
        
        vm3->unlock();
    }

    sqlite3_close(db);
}
