/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef TRANSFER_MANAGER_H_
#define TRANSFER_MANAGER_H_

#include "MadManager.h"
#include "ActionManager.h"
#include "VirtualMachinePool.h"
#include "LifeCycleManager.h"
#include "TransferManagerDriver.h"

using namespace std;

extern "C" void * tm_action_loop(void *arg);

class TransferManager : public MadManager, public ActionListener
{
public:

    TransferManager(
    	VirtualMachinePool *      	_vmpool,
        HostPool *                	_hpool,
        vector<const Attribute*>&   _mads):
            MadManager(_mads),
            vmpool(_vmpool),
            hpool(_hpool)
    {
        am.addListener(this);
    };

    ~TransferManager(){};

    enum Actions
    {
        PROLOG,
        PROLOG_MIGR,
        PROLOG_RESUME,
        EPILOG,
        EPILOG_STOP,
        EPILOG_DELETE,
        EPILOG_DELETE_PREVIOUS,
        CHECKPOINT,
        DRIVER_CANCEL,
        FINALIZE
    };

    /**
     *  Triggers specific actions to the Information Manager. This function
     *  wraps the ActionManager trigger function.
     *    @param action the IM action
     *    @param vid VM unique id. This is the argument of the passed to the 
     *    invoked action.
     */
    virtual void trigger(
        Actions action,
        int     vid);
        
    /**
     *  This functions starts the associated listener thread, and creates a 
     *  new thread for the Information Manager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Loads Virtual Machine Manager Mads defined in configuration file
     *   @param uid of the user executing the driver. When uid is 0 the nebula 
     *   identity will be used. Otherwise the Mad will be loaded through the
     *   sudo application. 
     */
    void load_mads(int uid);
        
    /**
     *  Gets the thread identification.
     *    @return pthread_t for the manager thread (that in the action loop).
     */
    pthread_t get_thread_id() const
    {
        return tm_thread;
    };

private:    
    /**
     *  Thread id for the Transfer Manager
     */
    pthread_t               tm_thread;

    /**
     *  Pointer to the Virtual Machine Pool, to access VMs
     */
    VirtualMachinePool *    vmpool;

    /**
     *  Pointer to the Host Pool, to access hosts
     */
    HostPool *              hpool;
     
    /**
     *  Action engine for the Manager
     */
    ActionManager   		am;

    /**
     *  Generic name for the TransferManager driver
     */
     static const char *  transfer_driver_name;

    /**
     *  Returns a pointer to a Transfer Manager driver.
     *    @param name of an attribute of the driver (e.g. its type)
     *    @param value of the attribute
     *    @return the TM driver owned by uid with attribute name equal to value
     *    or 0 in not found
     */
    const TransferManagerDriver * get(
        const string&   name,
        const string&   value)
    {
        return static_cast<const TransferManagerDriver *>
               (MadManager::get(0,name,value));
    };

    /**
     *  Returns a pointer to a Transfer Manager driver. The driver is 
     *  searched by its name.
     *    @param name the name of the driver
     *    @return the TM driver owned by uid with attribute name equal to value
     *    or 0 in not found
     */
    const TransferManagerDriver * get(
        const string&   name)
    {
        string _name("NAME");
        return static_cast<const TransferManagerDriver *>
               (MadManager::get(0,_name,name));
    };
        
    /**
     *  Returns a pointer to a Transfer Manager driver. The driver is 
     *  searched by its name.
     *    @return the TM driver for the Transfer Manager
     */
    const TransferManagerDriver * get()
    {
        string _name("NAME");
        return static_cast<const TransferManagerDriver *>
               (MadManager::get(0,_name,transfer_driver_name));
    };

    /**
     *  Function to execute the Manager action loop method within a new pthread 
     * (requires C linkage)
     */
    friend void * tm_action_loop(void *arg);    
        
    /**
     *  The action function executed when an action is triggered.
     *    @param action the name of the action
     *    @param arg arguments for the action function
     */
    void do_action(
        const string &  action,
        void *          arg);

    /**
     *  This function starts the prolog sequence 
     */
    void prolog_action(int vid);

    /**
     *  This function starts the prolog migration sequence 
     */
    void prolog_migr_action(int vid);

    /**
     *  This function starts the prolog resume sequence 
     */
    void prolog_resume_action(int vid);
    
    /**
     *  This function starts the epilog sequence
     */
    void epilog_action(int vid);

    /**
     *  This function starts the epilog_stop sequence
     */
    void epilog_stop_action(int vid);
    
    /**
     *  This function starts the epilog_delete sequence
     */
    void epilog_delete_action(int vid);

    /**
     *  This function starts the epilog_delete sequence on the previous host
     */
    void epilog_delete_previous_action(int vid);

    /**
     *  This function starts the epilog sequence
     */
    void checkpoint_action(int vid);

    /**
     * This function cancels the operation being performed by the driver
     */
    void driver_cancel_action(int vid);
};

#endif /*TRANSFER_MANAGER_H*/

