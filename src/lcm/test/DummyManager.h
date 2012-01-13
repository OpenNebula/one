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

#ifndef DUMMY_MANAGER_TEST_H
#define DUMMY_MANAGER_TEST_H


#include "TransferManager.h"
#include "VirtualMachineManager.h"
#include "LifeCycleManager.h"
#include "Nebula.h"

/**
 *  The Dummy Manager will ignore any trigger calls but FINALIZE, unless the lcm
 *  actions are set.
 */
class DummyManager
{
protected:
    DummyManager():index(0){}
    virtual ~DummyManager(){}

    vector<LifeCycleManager::Actions> actions;
    int index;

public:
    void clear_actions()
    {
        index = 0;
        actions.clear();
    }

    void set_actions(vector<LifeCycleManager::Actions>& _actions)
    {
        index   = 0;
        actions = _actions;
    }

    void trigger_lcm_action(int _vid)
    {
        if(index < (int) actions.size())
        {
            (Nebula::instance().get_lcm())->trigger(actions[index], _vid);
            index++;
        }
    }
};


class TransferManagerTest:public TransferManager, public DummyManager
{
public:
    TransferManagerTest(
        VirtualMachinePool *        _vmpool,
        HostPool *                  _hpool,
        vector<const Attribute*>&   _mads):
            TransferManager(_vmpool, _hpool, _mads){}

    void trigger(Actions action, int _vid)
    {
        if( action == FINALIZE )
        {
            TransferManager::trigger(action, _vid);
        }
        else
        {
            trigger_lcm_action(_vid);
        }
    }
};


class VirtualMachineManagerTest:public VirtualMachineManager, public DummyManager
{
public:
    VirtualMachineManagerTest(
        VirtualMachinePool *      _vmpool,
        HostPool *                _hpool,
        time_t                    _timer_period,
        time_t                    _poll_period,        
        vector<const Attribute*>& _mads):
            VirtualMachineManager(  _vmpool, _hpool, _timer_period,
                                    _poll_period, 5, _mads){}

    void trigger(Actions action, int _vid)
    {
        if( action == FINALIZE )
        {
            VirtualMachineManager::trigger(action, _vid);
        }
        else
        {
            trigger_lcm_action(_vid);
        }
    }
};

#endif /* DUMMY_MANAGER_TEST_H */
