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

#include <iostream>
#include <sstream>

#include <unistd.h>
#include <fcntl.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <string.h> 

#include "Mad.h"
#include "NebulaLog.h"

#include "Nebula.h"

#include <cerrno>


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Mad::~Mad()
{
    char    buf[]="FINALIZE\n";
    int     status;
    pid_t   rp;
    
    if ( pid==-1)
    {
        return;
    }
    
    // Finish the driver
    ::write(nebula_mad_pipe, buf, strlen(buf));

    close(mad_nebula_pipe);
    close(nebula_mad_pipe);

    rp = waitpid(pid, &status, WNOHANG);

    if ( rp == 0 )
    {
        sleep(1);
        waitpid(pid, &status, WNOHANG);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Mad::start()
{
    int                            ne_mad_pipe[2];
    int                            mad_ne_pipe[2];

    map<string,string>::iterator   it;

    const char *                   owner = 0;
    const char *                   executable = 0;
    const char *                   arguments = 0;
    string                         exec_path;
    
    char                           buf[]="INIT\n";
    char                           c;

    stringbuf                      sbuf;
    iostream                       mstream(&sbuf);
    int                            rc;

    string                         action;
    string                         result;
    string                         info;
    
    ostringstream                  oss;

    // Open communication pipes

    if (pipe(ne_mad_pipe) == -1 ||
        pipe(mad_ne_pipe) == -1)
    {
        goto error_pipes;
    }

    // Get the attributes for this driver

    it = attributes.find("OWNER");

    if ( it != attributes.end() )
    {
        owner = it->second.c_str();
    }

    it = attributes.find("EXECUTABLE");

    if ( it != attributes.end() )
    {
        if ( it->second.empty() == false )
        {
            if (it->second[0] != '/') //Look in ONE_LOCATION/lib/mads or in "/usr/lib/one/mads"
            {
                Nebula& nd = Nebula::instance();
                                
                exec_path = nd.get_mad_location() + it->second;
                executable= exec_path.c_str();
            }
            else //Absolute Path
            {
                executable = it->second.c_str();        
            } 
        }
    }

    it = attributes.find("ARGUMENTS");

    if ( it != attributes.end() )
    {
        arguments = it->second.c_str();
    }

    if ( (sudo_execution == true && owner == 0) || executable == 0 )
    {
        goto error_attributes;
    }

    //Create a new process for the driver

    pid = fork();

    switch (pid)
    {
    case -1: // Error
        goto error_fork;

    case 0:  // Child process (MAD)
    
        close(ne_mad_pipe[1]);
        close(mad_ne_pipe[0]);

        if (dup2(ne_mad_pipe[0], 0) != 0 || // stdin and stdout redirection
            dup2(mad_ne_pipe[1], 1) != 1)
        {
            goto error_dup2;
        }

        close(ne_mad_pipe[0]);
        close(mad_ne_pipe[1]);

        close(2);
        
        if ( sudo_execution == true )
        {
            rc = execlp("sudo","sudo","-H","-u",owner,executable,arguments,
                     (char *) NULL);
        }
        else
        {
            rc = execlp(executable,executable,arguments,(char*)NULL);            
        }

        goto error_exec;

    default: // Parent process (SE)
        fd_set          rfds;
        struct timeval  tv;
                
        close(ne_mad_pipe[0]);
        close(mad_ne_pipe[1]);

        nebula_mad_pipe = ne_mad_pipe[1];
        mad_nebula_pipe = mad_ne_pipe[0];

        // Close pipes in other MADs

        fcntl(nebula_mad_pipe, F_SETFD, FD_CLOEXEC);
        fcntl(mad_nebula_pipe, F_SETFD, FD_CLOEXEC);

        ::write(nebula_mad_pipe, buf, strlen(buf));
                    
        do
        {
            FD_ZERO(&rfds);
            FD_SET(mad_nebula_pipe, &rfds);

            // Wait up to 5 seconds
            tv.tv_sec  = 5;
            tv.tv_usec = 0;

            rc = select(mad_nebula_pipe+1,&rfds,0,0, &tv);
                        
            if ( rc <= 0 ) // MAD did not answered
            {
                goto error_mad_init;
            }
                                    
            rc = read(mad_nebula_pipe, (void *) &c, sizeof(char));
            mstream.put(c);            
        }
        while ( rc > 0 && c != '\n');

        if ( rc <= 0 )
        {
            goto error_mad_init;
        }

        mstream >> action >> result >> ws;
        getline(mstream,info);

        if (action == "INIT")
        {
            if (result == "FAILURE")
            {
                goto error_mad_result;
            }
        }
        else
        {
            goto error_mad_action;
        }

        break;
    }

    return 0;

error_exec:
    oss.str("");
    oss << "Cannot load driver " << executable << ", " << strerror(errno);
    NebulaLog::log("MAD", Log::ERROR, oss);
    exit(-1);
    
error_dup2:
    oss.str("");
    oss << "Cannot duplicate descriptors, " << strerror(errno);
    NebulaLog::log("MAD", Log::ERROR, oss);
    exit(-1);

error_mad_result:
    oss.str("");
    oss << "MAD initialization failed, " << info;
    NebulaLog::log("MAD", Log::ERROR, oss);
    return -1;

error_mad_action:
    NebulaLog::log("MAD", Log::ERROR,"Wrong action in MAD response");
    return -1;

error_mad_init:
    NebulaLog::log("MAD", Log::ERROR, "MAD did not answer INIT command");
    return -1;
    
error_fork:
    oss.str("");
    oss << "Error forking to start MAD, " << strerror(errno);
    NebulaLog::log("MAD", Log::ERROR, oss);
    return -1;
    
error_attributes:
    NebulaLog::log("MAD", Log::ERROR, "Wrong attributes for the driver");
    return -1;

error_pipes:
    oss.str("");
    oss << "Cannot create driver pipes, " << strerror(errno);
    NebulaLog::log("MAD", Log::ERROR, oss);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Mad::reload()
{
    char    buf[]="FINALIZE\n";
    int     status;
    int     rc;
    pid_t   rp;

    // Finish the driver
    ::write(nebula_mad_pipe, buf, strlen(buf));

    close(nebula_mad_pipe);
    close(mad_nebula_pipe);

    rp = waitpid(pid, &status, WNOHANG);

    if ( rp == 0 )
    {
        sleep(1);
        waitpid(pid, &status, WNOHANG);
    }

    // Start the MAD again

    rc = start();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

