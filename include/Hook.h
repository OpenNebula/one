/* -------------------------------------------------------------------------- */
/* Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
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
    //--------------------------------------------------------------------------
    // Constructor and Destructor
    //--------------------------------------------------------------------------
    Hook(const string &_cmd, const string &_args, bool _remote=false):
        cmd(_cmd),args(_args),remote(_remote){};

    virtual ~Hook(){};

    //--------------------------------------------------------------------------
    // Hook methods
    //--------------------------------------------------------------------------
    /**
     *  Check if the object where we are attached should execute de hook or not
     *    @param hk the object where this hook was registered to
     *    @return true if the hook has to be executed
     */
    virtual bool check_hook(Hookable* hk) =  0;

    /**
     *  Executes the hook it self (usually with the aid of the ExecutionManager)
     *    @param hk the object where this hook was registered to
     */
    virtual void do_hook(Hookable* hk) = 0;

protected:
    /**
     *  The command to be executed
     */
    string cmd;

    /**
     *  The arguments for the command
     */
    string args;

    /**
     *  True if the command is to be executed remotely
     */
    bool   remote;
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
        vector<Hook *>::size_type sz = hooks.size();

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
        vector<Hook *>::size_type sz = hooks.size();

        for (int i=0; i<sz ; i++)
        {
            delete hooks[i];
        }

        hooks.clear();
    };

    /**
     *  Iterates through the hooks, checking if they have to be executed and
     *  invokes them.
     */
    void do_hooks()
    {
        vector<Hook *>::size_type sz = hooks.size();

        for (int i=0; i<sz ; i++)
        {
            if (hooks[i]->check_hook(this) == true)
            {
                hooks[i]->do_hook(this);
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