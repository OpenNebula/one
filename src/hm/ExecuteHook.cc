/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

#include "ExecuteHook.h"
#include "Nebula.h"

#include <string>
#include <sstream>
#include <iostream>

#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <pthread.h>


void * execute_thread(void *arg)
{
    int out[2];
    int err[2];

    char buffer[500];

    int rcode;
    std::string s_out;
    std::string s_err;

    ExecuteHook * eh = static_cast<ExecuteHook *>(arg);

    if ( pipe(out) == -1 )
    {
        NebulaLog::log("HKM", Log::ERROR, "Executing Hook: " + eh->name);
        return 0;
    }

    if ( pipe(err) == -1 )
    {
        NebulaLog::log("HKM", Log::ERROR, "Executing Hook: " + eh->name);
        return  0;
    }

    pid_t pid = fork();

    switch (pid)
    {
        case 0: //child
        {
            int dev_null = open("/dev/null", O_RDWR);

            if ( dev_null == -1 )
            {
                exit(-1);
            }

            close(out[0]);
            close(err[0]);

            dup2(dev_null, 0);
            dup2(out[1], 1);
            dup2(err[1], 2);

            close(out[1]);
            close(err[1]);
            close(dev_null);

            execvp(eh->cmd.c_str(), (char * const *) eh->c_args);

            exit(-1);
        }
        break;

        case -1: //failure
            NebulaLog::log("HKM", Log::ERROR, "Executing Hook: " + eh->name);
        break;

        default: //parent
        {
            int nbytes;

            close(out[1]);
            close(err[1]);

            while ( (nbytes = read(out[0], buffer, 500)) > 0 )
            {
                s_out.append(buffer, nbytes);
            }

            while ( (nbytes = read(err[0], buffer, 500)) > 0 )
            {
                s_err.append(buffer, nbytes);
            }

            close(out[0]);
            close(err[0]);

            waitpid(pid, &rcode, 0);

            rcode = WEXITSTATUS(rcode);
        }
        break;
    }

    std::ostringstream oss;

    oss << "Hook: " << eh->name << ", ";

    if ( rcode == 0 )
    {
        oss << "successfully executed.\n";
    }
    else
    {
        oss << "execution error (" << rcode << ").\n";
    }

    if (!s_out.empty())
    {
        oss << "Hook stdout: " << s_out << "\n";
    }

    if (!s_err.empty())
    {
        oss << "Hook stderr: " << s_err << "\n";
    }

    NebulaLog::log("HKM", Log::INFO, oss);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ExecuteHook::ExecuteHook(const std::string& _name, const std::string& _cmd,
        const std::string& _arg, const std::string& rl): name(_name), cmd(_cmd)
{
    std::string s(_arg);
    std::istringstream iss(_arg);

    if (cmd[0] != '/')
    {
        std::ostringstream cmd_os;

        cmd_os << rl << "/hooks/" << cmd;
        cmd = cmd_os.str();
    }

    c_args[0] = _cmd.c_str();

    for (int i=1; i < EXECUTE_HOOK_MAX_ARG; ++i)
    {
        c_args[i] = nullptr;
    }

    for (int i=1; iss >> args[i] && i < EXECUTE_HOOK_MAX_ARG - 1; ++i)
    {
        c_args[i] = args[i].c_str();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ExecuteHook::execute()
{
    pthread_attr_t pattr;
    pthread_t thid;

    pthread_attr_init(&pattr);
    pthread_attr_setdetachstate(&pattr, PTHREAD_CREATE_DETACHED);

    pthread_create(&thid, &pattr, execute_thread, (void *) this);

    pthread_attr_destroy(&pattr);
}

