/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

#ifndef HOST_HOOK_H_
#define HOST_HOOK_H_

#include <vector>
#include <string>

#include "Hook.h"
#include "Host.h"

using namespace std;

/**
 *  This class is general Host Allocate Hook that executes a command when the
 *  Host is inserted in the database. The Host object is looked
 */
class HostAllocateHook : public AllocateHook
{
public:
    HostAllocateHook(const string& name,
                     const string& cmd,
                     const string& args,
                     bool          remote):
        AllocateHook(name, cmd, args, remote){};

    virtual ~HostAllocateHook(){};

private:

    string& remote_host(PoolObjectSQL *obj, string& hostname)
    {
        Host * host = static_cast<Host *>(obj);
        hostname    = host->get_name();

        return hostname;
    }
};

/**
 *  This class is general Host Remove Hook that executes a command when the
 *  Host is dropped from the database. The Host object is looked
 */
class HostRemoveHook : public RemoveHook
{
public:
    HostRemoveHook(const string&   name,
                     const string& cmd,
                     const string& args,
                     bool          remote):
        RemoveHook(name, cmd, args, remote){};

    virtual ~HostRemoveHook(){};

private:

    string& remote_host(PoolObjectSQL *obj, string& hostname)
    {
        Host * host = static_cast<Host *>(obj);
        hostname    = host->get_name();

        return hostname;
    }
};

/**
 *  This class provides basic functionality to store Hook states for state Hooks.
 *  The state Map is shared by all the State hooks. A maintenance hook that
 *  updates the map should be added.
 */
class HostStateMapHook: public Hook
{
public:
    virtual void do_hook(void *arg) = 0;

protected:
    // -------------------------------------------------------------------------
    // Init the Map
    // -------------------------------------------------------------------------
    HostStateMapHook(const string& name,
                     const string& cmd,
                     const string& args,
                     bool          remote):
        Hook(name, cmd, args, Hook::UPDATE | Hook::ALLOCATE, remote){};

    virtual ~HostStateMapHook(){};

    // -------------------------------------------------------------------------
    // Functions to handle the VM state map
    // -------------------------------------------------------------------------
    /**
     *  Gets the state associated to the Host
     *    @param id of the Host
     *    @param state (previous) of the Host
     *    @return 0 if the previous state for the Host has been recorded
     */
    int get_state(int id, Host::HostState &state);

    /**
     *  Updates the state associated to the Host
     *    @param id of the Host
     *    @param state (current) of the Host
     */
    void update_state (int id, Host::HostState state);

    /**
     *  Frees the resources associated with a host
     *    @param id of the Host
     */
    void remove_host (int id);

private:

    /**
     *  The state Map for the Hosts
     */
    static map<int,Host::HostState> host_states;
};

/**
 *  This class is a general Host State Hook that executes a command locally or
 *  remotelly when the Host gets into a given state (one shot). The Host
 *  object is looked when the hook is invoked.
 */
class HostStateHook : public HostStateMapHook
{
public:
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    /**
     *  Creates a HostStateHook
     *    @param name of the hook
     *    @param cmd for the hook
     *    @param args for the hook
     *    @param remote the hook will be executed on the target resource
     *    @param _state the hook will be executed when the Host enters this
     *    state
     */
    HostStateHook(const string&   name,
                  const string&   cmd,
                  const string&   args,
                  bool            remote,
                  Host::HostState _state):
        HostStateMapHook(name,cmd,args,remote), state(_state){};

    ~HostStateHook(){};

    // -------------------------------------------------------------------------
    // Hook methods
    // -------------------------------------------------------------------------
    void do_hook(void *arg);

private:
    /**
     *  The target Host state
     */
    Host::HostState state;
};

/**
 *  This class implements a state Map updater, one hook of this type should be
 *  added in order to mantain the VM state map.
 */
class HostUpdateStateHook : public HostStateMapHook
{
public:
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    HostUpdateStateHook():
        HostStateMapHook("","","",false){};

    ~HostUpdateStateHook(){};

    // -------------------------------------------------------------------------
    // Hook methods
    // -------------------------------------------------------------------------
    void do_hook(void *arg);
};

#endif
