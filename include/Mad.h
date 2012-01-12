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

#ifndef MAD_H_
#define MAD_H_

#include <pthread.h>
#include <sys/types.h>

#include <map>
#include <string>
#include <sstream>

#include <unistd.h>

#include "Log.h"

using namespace std;

/**
 * Base class to build specific middleware access drivers (MAD).
 * This class provides generic MAD functionality. 
 */
class Mad
{
protected:
    /**
     *  The constructor initialize the class members but DOES NOT start the 
     *  driver. A subsequent call to the start() method is needed.
     *    @param userid user running this MAD
     *    @param attrs configuration attributes for the driver
     *    @param sudo the driver is started through sudo if true 
     */
    Mad(
        int userid,
        const map<string,string> &attrs,
        bool sudo):
            uid(userid),
            attributes(attrs),
            sudo_execution(sudo),
            pid(-1)
    {};
    
    /**
     *  The destructor of the class finalizes the driver process, and all its
     *  associated resources (i.e. pipes)
     */
    virtual ~Mad();
    
    /**
     *  Send a command to the driver
     *    @param os an output string stream with the message, it must be
     *    terminated with the end of line character.
     */
    void write(
        ostringstream&  os) const
    {
        string        str;
        const char *  cstr;
        
        str  = os.str();
        cstr = str.c_str();

        ::write(nebula_mad_pipe, cstr, str.size());
    };

    /**
     *  Send a DRIVER_CANCEL command to the driver
     *    @param oid identifies the action (that associated with oid)
     */
    void driver_cancel (const int oid) const
    {
        ostringstream os;

        os << "DRIVER_CANCEL " << oid << endl;

        write(os);
    };

    /**
     *  Sets the log message type as specify by the driver.
     *    @param first character of the type string
     *    @return the message type
     */
    Log::MessageType log_type(const char r)
    {
        Log::MessageType lt;

        switch (r)
        {
            case 'E':
                lt = Log::ERROR;
                break;
            case 'I':
                lt = Log::INFO;
                break;
            case 'D':
                lt = Log::DEBUG;
                break;
            default:
                lt = Log::INFO;
        }

        return lt;
    }

private:
    friend class MadManager;

    /**
     *  Communication pipe file descriptor. Represents the MAD to nebula 
     *  communication stream (nebula<-mad)
     */
    int                 mad_nebula_pipe;

    /**
     *  Communication pipe file descriptor. Represents the nebula to MAD 
     *  communication stream (nebula->mad)
     */
    int                 nebula_mad_pipe;
        
    /**
     *  User running this MAD as defined in the upool DB
     */
    int                 uid;

    /**
     *  Mad configuration attributes (e.g. executable, attributes...). Attribute
     *  names MUST be lowecase.
     */
    map<string,string>  attributes;

    /**
     *  True if the mad is to be executed through sudo, with the identity of the 
     *  Mad owner (uid).
     */
    bool                sudo_execution;

    /**
     *  Process ID of the running MAD.
     */
    pid_t               pid;
    
    /**
     *  Starts the MAD. This function creates a new process, sets up the 
     *  communication pipes and sends the initialization command to the driver.
     *    @return 0 on success
     */
    int start();

    /**
     *  Reloads the driver: sends the finalize command, "waits" for the 
     *  driver process and closes the communication pipes. Then the driver is
     *  started again by calling the start() function
     *    @return 0 on success
     */
    int reload();

    /**
     *  Implements the driver specific protocol, this function should trigger
     *  actions on the associated manager.
     *    @param message the string read from the driver
     */
    virtual void protocol(
        string&     message) = 0;

    /**
     *  This function is called whenever the driver crashes. This function
     *  should perform the actions needed to recover the VMs.
     */
    virtual void recover() = 0;    
};

#endif /*MAD_H_*/
