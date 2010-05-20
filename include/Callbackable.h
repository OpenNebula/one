/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef CALLBACKABLE_H_
#define CALLBACKABLE_H_

using namespace std;

/**
 * ObjectSQL class. Provides a SQL backend interface, it should be implemented
 * by persistent objects.
 */
class Callbackable
{
public:

    Callbackable():cb(0),arg(0){};

    virtual ~Callbackable(){};

    /**
     *  Datatype for call back pointers
     */
    typedef int (Callbackable::*Callback)(void *, int, char ** ,char **);

    /**
     *  Set the callback function and custom arguments to be executed by the
     *  next SQL command
     *    @param ptr to the callback function
     *    @param arg custom arguments for the callback function
     */
    void set_callback(Callback _cb, void * _arg = 0)
    {
        cb  = _cb;
        arg = _arg;
    };

    /**
     *  Test if the CallBack is set for the object.
     *    @return true if the callback is set
     */
    bool isCallBackSet()
    {
        return (cb != 0);
    };

    /**
     *  Set the callback function and custom arguments to be executed by the
     *  next SQL command
     *    @param ptr to the callback function
     *    @param arg custom arguments for the callback function
     */
    int do_callback(int num, char **values, char **names)
    {
        return (this->*cb)(arg, num, values, names);
    };

private:
    /**
     *  SQL callback to be executed for each row result of an SQL statement
     */
    Callback cb;

    /**
     *  Custom arguments for the callback
     */
    void *   arg;
};

#endif /*CALLBACKABLE_H_*/
