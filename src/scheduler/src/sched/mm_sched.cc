/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

    RankScheduler():Scheduler(),rp_host(0),rp_ds(0){};

    ~RankScheduler()
    {
        if ( rp_host != 0 )
        {
            delete rp_host;
        }

        if ( rp_ds != 0 )
        {
            delete rp_ds;
        }
    };

    void register_policies(const SchedulerTemplate& conf)
    {
        rp_host = new RankHostPolicy(hpool, conf.get_policy(), 1.0);

        add_host_policy(rp_host);

        rp_ds = new RankDatastorePolicy(dspool, conf.get_ds_policy(), 1.0);

        add_ds_policy(rp_ds);
    };

private:
    RankPolicy * rp_host;
    RankPolicy * rp_ds;
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
