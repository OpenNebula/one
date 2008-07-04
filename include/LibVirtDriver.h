#ifndef LIBVIRT_DRIVER_H_
#define LIBVIRT_DRIVER_H_

#include <map>
#include <string>
#include <sstream>

#include "VirtualMachineManagerDriver.h"

class LibVirtDriver : public VirtualMachineManagerDriver
{
public:

    LibVirtDriver(
        int userid,
        const map<string,string> &attrs,
        bool sudo,
        VirtualMachinePool *    pool,
        const string _emulator):
            VirtualMachineManagerDriver(userid, attrs,sudo,pool),
            emulator(_emulator)
    {};

    ~LibVirtDriver(){};

private:
    int deployment_description(
        const VirtualMachine *  vm, 
        const string&           file_name) const;
        
    const string emulator;
};

#endif /*LIBVIRT_DRIVER_H_*/

