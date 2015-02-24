/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
"  Information Collector for OpenNebula. It should not be started directly\n\n"
"OPTIONS\n"
"\t-h\tprints this help.\n"
"\t-a\tAddress to bind the collectd sockect\n"
"\t-p\tUDP port to listen for monitor information\n"
"\t-f\tInterval in seconds to flush collected information\n"
"\t-t\tNumber of threads for the server\n";

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
    int flush   = 5;

    std::istringstream iss;
    int opt;

    while((opt = getopt(argc,argv,":ha:p:t:f:")) != -1)
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

            case 'f':
                iss.clear();
                iss.str(optarg);

                iss >> flush;
                break;

            default:
                std::cerr << usage;
                return -1;
                break;
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
    IMCollectorDriver collectd(address, port, threads, flush);

    if ( collectd.init_collector() != 0 )
    {
        std::cerr << ". Could not init collectd, exiting...\n";
        return -1;
    }

    collectd.start_collector();
}
