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

#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* GLOBAL VARIABLES                                                          */
/* ------------------------------------------------------------------------- */

static const char * usage =
"\n  oned [-h] [-v] [-f]\n\n"
"SYNOPSIS\n"
"  Starts the OpenNebula daemon\n\n"
"OPTIONS\n"
"\t-h\tprints this help.\n"
"\t-v\tprints OpenNebula version and license\n"
"\t-f\tforeground, do not fork the oned daemon\n";

static const char * susage =
"usage: oned [-h] [-v] [-f]\n";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void print_license()
{
    cout<< "Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)\n\n"
        << Nebula::version() << " is distributed and licensed for use under the"
        << " terms of the\nApache License, Version 2.0 "
        << "(http://www.apache.org/licenses/LICENSE-2.0).\n";
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void oned_main()
{
    try
    {
        Nebula& nd  = Nebula::instance();
        nd.start();    
    }
    catch (exception &e)
    {
        cerr << e.what() << endl;
 
        return;
    }
}
    
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
    
int main(int argc, char **argv)
{
    char            opt;
    bool            foreground = false;
    const char *    nl;
    int             fd;
    pid_t           pid,sid;
    string          wd;
    int             rc;
            
    while((opt = getopt(argc,argv,"vhf")) != -1)
        switch(opt)
        {
            case 'v':
                print_license();
                exit(0);
                break;
            case 'h':
                cout << usage;
                exit(0);
                break;
            case 'f':
                foreground = true;
                break;        
            default:
                cerr << susage;
                exit(-1);
                break;
        }

    // ---------------------------------
    //   Check if other oned is running  
    // --------------------------------- 
    
    string lockfile;
    string var_location;
    
    nl = getenv("ONE_LOCATION");

    if (nl == 0) // OpenNebula in root of FSH
    {
    	var_location = "/var/lib/one/"; 
    	lockfile 	 = "/var/lock/one/one";
    }
    else
    {
    	var_location = nl;
    	var_location += "/var/";
    	
    	lockfile = var_location + ".lock";
    }

    fd = open(lockfile.c_str(), O_CREAT|O_EXCL, 0640);

    if( fd == -1)
    {
        cerr<< "Error: Cannot start oned, opening lock file " << lockfile 
            << endl;
        
        exit(-1);
    }

    close(fd);
    
    // ---------------------------- 
    //   Fork & exit main process   
    // ---------------------------- 
    
    if (foreground == true)
    {
        pid = 0; //Do not fork
    }
    else
    {
        pid = fork();    
    }
        

    switch (pid){
        case -1: // Error
            cerr << "Error: Unable to fork.\n"; 
            exit(-1);
            

        case 0: // Child process
        	
            rc  = chdir(var_location.c_str());
                        
            if (rc != 0)
            {
                goto error_chdir;
            }
            
            if (foreground == false)
            { 
                sid = setsid();
                
                if (sid == -1)
                {
                    goto error_sid;
                }
            }
                        
            oned_main();
            
            unlink(lockfile.c_str());            
            break;

        default: // Parent process
            break;               
    }
    
    return 0;
    
error_chdir:
    cerr << "Error: cannot change to dir " << wd << "\n";
    unlink(lockfile.c_str());
    exit(-1);

error_sid:    
    cerr << "Error: creating new session\n";
    unlink(lockfile.c_str());
    exit(-1);
}
