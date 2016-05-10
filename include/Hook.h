/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#ifndef HOOK_H_
#define HOOK_H_

#include <vector>
#include <string>

using namespace std;

//Forward definition of Hookable
class Hookable;

class PoolObjectSQL;

/**
 *  This class is an abstract representation of a hook, provides a method to
 *  check if the hook has to be executed, and a method to invoke the hook. The
 *  hook is a program that can be executed locally or in a remote host when a
 *  condition is satisfied
 */
class Hook
{
public:

    /**
     *  Defines the hook type, so a whole hook class can be masked
     */
    enum HookType
    {
        ALLOCATE = 0x1,
        UPDATE   = 0x2,
        REMOVE   = 0x4
    };

    //--------------------------------------------------------------------------
    // Constructor and Destructor
    //--------------------------------------------------------------------------
    Hook(const string &_name,
         const string &_cmd,
         const string &_args,
         int           _ht,
         bool         _remote):
        name(_name), cmd(_cmd), args(_args), hook_type(_ht), remote(_remote){};

    virtual ~Hook(){};

    //--------------------------------------------------------------------------
    // Hook methods
    //--------------------------------------------------------------------------
    /**
     *  Returns the hook_type
     */
     int type() const
     {
        return hook_type;
     }

    /**
     *  Executes the hook it self (usually with the aid of the ExecutionManager)
     *    @param arg additional arguments for the hook
     */
    virtual void do_hook(void *arg) = 0;

    /**
     *  Parses the arguments of the hook using a generic $ID identifier, and
     *  the target object.  $TEMPLATE will be the base64 encoding of the
     *  template and $ID the oid of the object.
     *    @param obj pointer to the object executing the hook for
     *    @param the resulting parser arguments
     */
    void parse_hook_arguments(PoolObjectSQL * obj,
                              string&         parsed);
protected:
    /**
     *  Name of the Hook
     */
    string   name;

    /**
     *  The command to be executed
     */
    string   cmd;

    /**
     *  The arguments for the command
     */
    string   args;

    /**
     *  The Hook Type
     */
    int      hook_type;

    /**
     *  True if the command is to be executed remotely
     */
    bool     remote;
};

/**
 *  This class is general ObjectSQL Hook for allocation and removal.
 *  The object is looked when the hook is executed
 */
class AllocateRemoveHook : public Hook
{
protected:
    AllocateRemoveHook(const string& name,
                       const string& cmd,
                       const string& args,
                       int           hook_type,
                       bool          remote):
        Hook(name, cmd, args, hook_type, remote){};

    virtual ~AllocateRemoveHook(){};

    // -------------------------------------------------------------------------
    // Hook methods
    // -------------------------------------------------------------------------

    void do_hook(void *arg);

    virtual string& remote_host(PoolObjectSQL *obj, string& hostname)
    {
        hostname.clear();

        return hostname;
    };
};

/**
 *  This class is general ObjectSQL Allocate Hook that executes a command
 *  when the ObjectSQL is inserted in the database. The object is looked when
 *  the hook is executed
 */
class AllocateHook : public AllocateRemoveHook
{
public:
    // -------------------------------------------------------------------------
    // Init a hook of ALLOCATE type
    // -------------------------------------------------------------------------
    AllocateHook(const string& name,
                 const string& cmd,
                 const string& args,
                 bool          remote):
        AllocateRemoveHook(name, cmd, args, Hook::ALLOCATE, remote){};

    virtual ~AllocateHook(){};
};

/**
 *  This class is general ObjectSQL Remove Hook that executes a command
 *  when the ObjectSQL is inserted in the database.
 */
class RemoveHook : public AllocateRemoveHook
{
public:
    // -------------------------------------------------------------------------
    // Init a hook of ALLOCATE type
    // -------------------------------------------------------------------------
    RemoveHook(const string& name,
               const string& cmd,
               const string& args,
               bool          remote):
        AllocateRemoveHook(name, cmd, args, Hook::REMOVE, remote){};

    virtual ~RemoveHook(){};
};

/**
 *  Objects that inherits from hookable will allow others to hook into it. The
 *  Hookable interface handles the list of hooks and provide a method to invoke
 *  the hooks.
 */
class Hookable
{
public:
    //--------------------------------------------------------------------------
    // Constructor and Destructor Methods
    //--------------------------------------------------------------------------
    Hookable(){};

    virtual ~Hookable()
    {
        int sz = static_cast<int>(hooks.size());

        for (int i=0; i<sz ; i++)
        {
            delete hooks[i];
        }
    };

    //--------------------------------------------------------------------------
    // Hook Operations
    //--------------------------------------------------------------------------
    /**
     *  Hook in to the object
     *    @param hk pointer to the hook, MUST be allocated in the HEAP
     */
    void add_hook(Hook *hk)
    {
        hooks.push_back(hk);
    };

    /**
     *  Removes all hooks from the object
     */
    void clear_hooks()
    {
        int sz = static_cast<int>(hooks.size());

        for (int i=0; i<sz ; i++)
        {
            delete hooks[i];
        }

        hooks.clear();
    };

    /**
     *  Iterates through the hooks, checking if they have to be executed and
     *  invokes them.
     *    @param arg additional arguments for the hook
     */
    void do_hooks(void *arg = 0, int hook_mask = 0xFF)
    {
        int sz = static_cast<int>(hooks.size());

        for (int i=0; i<sz ; i++)
        {
            if ( hooks[i]->type() & hook_mask )
            {
                hooks[i]->do_hook(arg);
            }
        }
    };

private:
    /**
     *  Those that hooked in the object
     */
    vector<Hook *> hooks;
};

#endif
