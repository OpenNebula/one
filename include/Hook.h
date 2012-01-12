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

#ifndef HOOK_H_
#define HOOK_H_

#include <vector>
#include <string>

using namespace std;

//Forward definition of Hookable
class Hookable;

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
