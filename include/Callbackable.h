/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#include <pthread.h>
#include <sstream>

using namespace std;

/**
 * ObjectSQL class. Provides a SQL backend interface, it should be implemented
 * by persistent objects.
 */
class Callbackable
{
public:

    Callbackable():cb(0),arg(0)
    {
        pthread_mutex_init(&mutex,0);
    };

    virtual ~Callbackable()
    {
        pthread_mutex_destroy(&mutex);
    };

    /**
     *  Datatype for call back pointers
     */
    typedef int (Callbackable::*Callback)(void *, int, char ** ,char **);

    /**
     *  Set the callback function and custom arguments to be executed by the
     *  next SQL command, and locks the mutex until unset_callback is called.
     *    @param ptr to the callback function
     *    @param arg custom arguments for the callback function
     */
    void set_callback(Callback _cb, void * _arg = 0)
    {
        pthread_mutex_lock(&mutex);

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
     *  Call the callback funcion set. This method must be called only if
     *  isCallBackSet returns true.
     *      @return the callback function return value.
     */
    int do_callback(int num, char **values, char **names)
    {
        return (this->*cb)(arg, num, values, names);
    };

    /**
     *  Unset the callback function.
     */
    void unset_callback()
    {
        cb  = 0;
        arg = 0;

        pthread_mutex_unlock(&mutex);
    }

private:
    /**
     *  SQL callback to be executed for each row result of an SQL statement
     */
    Callback cb;

    /**
     *  Custom arguments for the callback
     */
    void *   arg;

    /**
     *  Mutex for locking the callback function.
     */
    pthread_mutex_t             mutex;
};

/* -------------------------------------------------------------------------- */
/* Classes to obtain values from a DB it support concurrent queries using     */
/* different objects                                                          */
/* -------------------------------------------------------------------------- */

template <class T>
class single_cb : public Callbackable
{
public:
    void set_callback(T * _value)
    {
        value = _value;

        Callbackable::set_callback(
                static_cast<Callbackable::Callback>(&single_cb::callback));
    }

    virtual int callback(void *nil, int num, char **values, char **names)
    {
        if ( values == 0 || values[0] == 0 || num != 1 )
        {
            return -1;
        }

        std::istringstream iss(values[0]);

        iss >> *value;

        return 0;
    }

private:
    T * value;
};

template<>
class single_cb<std::string> : public Callbackable
{
public:
    void set_callback(std::string * _value)
    {
        value = _value;

        Callbackable::set_callback(
                static_cast<Callbackable::Callback>(&single_cb::callback));
    }

    virtual int callback(void *nil, int num, char **values, char **names)
    {
        if ( values == 0 || values[0] == 0 || num != 1 )
        {
            return -1;
        }

        *value = values[0];

        return 0;
    }

private:
    std::string * value;
};

#endif /*CALLBACKABLE_H_*/
