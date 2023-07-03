/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#ifndef SCHEDULED_ACTION_XML_H_
#define SCHEDULED_ACTION_XML_H_

#include <queue>
#include <map>
#include <vector>

#include "SchedAction.h"

class VirtualMachineActionsPoolXML;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class SchedActionsXML : public SchedActions
{
public:
    SchedActionsXML(Template * vm):SchedActions(vm){};

    int do_actions(int vmid, time_t stime);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class BackupActions
{
public:

    BackupActions(int max, int maxh):max_backups(max), max_backups_host(maxh){};

    void add(int vmid, int hid, time_t stime, SchedActionsXML& sas);

    void dispatch(VirtualMachineActionsPoolXML* vmapool);

private:
    int max_backups;

    int max_backups_host;

    struct VMBackupAction
    {
        VMBackupAction():backup("SCHED_ACTION"){};

        /** ID of the VM and action**/
        int vm_id = -1;

        int action_id = -1;

        /** Pending backup operation **/
        VectorAttribute backup;
    };

    std::map<int, std::vector<VMBackupAction>> host_backups;
};

#endif /* SCHEDULED_ACTION_XML_H_ */
