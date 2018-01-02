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

#include "OpenNebulaDriver.h"
#include "NebulaUtil.h"
#include <unistd.h>
#include <string>
#include <sstream>
#include <iostream>
#include <signal.h>

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

static const char * usage =
"\n  collectd [-h] [-a address] [-p port] [-t threads] [-f flush]\n\n"
"SYNOPSIS\n"
"  Information Collector for OpenNebula. It should not be started directly.\n"
"  All arguments MUST be passed as a **single** string \n\n"
"OPTIONS\n"
"\t-h\tprints this help.\n"
"\t-a\tAddress to bind the collectd sockect\n"
"\t-p\tUDP port to listen for monitor information\n"
"\t-t\tNumber of threads for the server\n"
"\t-f and -i\tOptions are ignored\n";

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

extern "C" void * sig_thread(void *arg)
{
    // Wait for a SIGTERM or SIGINT signal & exit
    sigset_t mask;
    int      signal;

    sigemptyset(&mask);

    sigaddset(&mask, SIGINT);
    sigaddset(&mask, SIGTERM);

    sigwait(&mask, &signal);

    _exit(0);
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

int main(int argc, char ** argv)
{
    sigset_t mask;

    std::string address = "0.0.0.0";
    int port    = 4124;
    int threads = 50;

    std::istringstream iss;
    int opt;

    if ( argv[1] != 0 )
    {
        std::string argv_1 = argv[1];

        std::vector<std::string> _argv = one_util::split(argv_1, ' ');
        int _argc = _argv.size() + 1;

        char ** _argv_c = (char **) malloc(sizeof(char *) * (_argc + 1));

        _argv_c[0] = argv[0];

        for (int i=1 ; i < _argc ; ++i)
        {
            _argv_c[i] = const_cast<char *>(_argv[i-1].c_str());
        }

        _argv_c[_argc] = 0;

        while((opt = getopt(_argc, _argv_c, ":ha:p:t:f:i:")) != -1)
            switch(opt)
            {
                case 'h':
                    std::cout << usage;
                    return 0;
                    break;
                case 'a':
                    address = optarg;
                    break;

                case 'p':
                    iss.clear();
                    iss.str(optarg);

                    iss >> port;
                    break;

                case 't':
                    iss.clear();
                    iss.str(optarg);

                    iss >> threads;
                    break;

                case 'f': //Compatibility with previous releases
                case 'i': //Argument for collectd client
                    break;

                default:
                    std::cerr << usage;
                    return -1;
                    break;
            }

        free(_argv_c);
    }

    //--------------------------------------------------------------------------
    // Block all signals before creating server threads
    //--------------------------------------------------------------------------
    sigfillset(&mask);

    pthread_sigmask(SIG_BLOCK, &mask, NULL);

    // -------------------------------------------------------------------------
    //Handle SIGTERM and SIGQUIT in a specific thread
    // -------------------------------------------------------------------------
    pthread_attr_t attr;
    pthread_t      id;

    pthread_attr_init(&attr);
    pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);

    pthread_create(&id, &attr, sig_thread, 0);

    pthread_attr_destroy(&attr);

    // -------------------------------------------------------------------------
    // Start the collector and server threads
    // -------------------------------------------------------------------------
    IMCollectorDriver collectd(address, port, threads);

    if ( collectd.init_collector() != 0 )
    {
        std::cerr << ". Could not init collectd, exiting...\n";
        return -1;
    }

    collectd.start_collector();
}
