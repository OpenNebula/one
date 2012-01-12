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

#include "Scheduler.h"
#include "SchedulerTemplate.h"
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

    RankScheduler():Scheduler(),rp(0){};

    ~RankScheduler()
    {
        if ( rp != 0 )
        {
            delete rp;
        }
    };

    void register_policies(const SchedulerTemplate& conf)
    {
        rp = new RankPolicy(vmpool, hpool, conf.get_policy(), 1.0);

        add_host_policy(rp);
    };

private:
    RankPolicy * rp;

};

int main(int argc, char **argv)
{
    RankScheduler ss;

    try
    {
        ss.start();
    }
    catch (exception &e)
    {
        cout << e.what() << endl;

        return -1;
    }

    return 0;
}
