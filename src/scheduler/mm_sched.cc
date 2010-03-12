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

#include "Scheduler.h"
#include "RankPolicy.h"
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

#include <iostream>
#include <sstream>


using namespace std;

class RankScheduler : public Scheduler
{
public:

    RankScheduler(string url,time_t timer=1):Scheduler(url,timer),rp(0){};
    
    ~RankScheduler()
    {
        if ( rp != 0 )
        {
            delete rp;
        }
    };
    
    void register_policies()
    {
        rp = new RankPolicy(vmpool,hpool,1.0);
        
        add_host_policy(rp);        
    };
    
private:
    RankPolicy * rp;
        
};

int main(int argc, char **argv)
{
    RankScheduler * ss;
    int             port = 2633;
    time_t          timer= 30;
    char            opt;
    
    ostringstream  oss;
        
    while((opt = getopt(argc,argv,"p:t:")) != -1)
    {
        switch(opt)
        {
            case 'p':
                port = atoi(optarg);
                break;
            case 't':
                timer = atoi(optarg);
                break;
            default:
                cerr << "usage: " << argv[0] << " [-p port] [-t timer]\n";
                exit(-1);
                break;
        }
    };
    
    /* ---------------------------------------------------------------------- */
    
    oss << "http://localhost:" << port << "/RPC2";
        
    ss = new RankScheduler(oss.str(),timer);
    
    try
    {
        ss->start();    
    }
    catch (exception &e)
    {
        cout << e.what() << endl;
 
        return -1;
    }
    
    delete ss;
    
    return 0;
}
