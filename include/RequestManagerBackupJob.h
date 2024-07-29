/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#ifndef REQUEST_MANAGER_BACKUPJOB_H
#define REQUEST_MANAGER_BACKUPJOB_H

#include "Request.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerBackupJob: public Request
{
public:
    RequestManagerBackupJob(const std::string& method_name,
                            const std::string& params,
                            const std::string& help);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobBackup: public RequestManagerBackupJob
{
public:
    BackupJobBackup()
        : RequestManagerBackupJob("one.backupjob.backup", "A:si", "Execute Backup Job")
    {};

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobCancel: public RequestManagerBackupJob
{
public:
    BackupJobCancel()
        : RequestManagerBackupJob("one.backupjob.cancel", "A:si", "Cancel Backup Job execution")
    {};

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobRetry: public RequestManagerBackupJob
{
public:
    BackupJobRetry()
        : RequestManagerBackupJob("one.backupjob.retry", "A:si", "Retry Backup Job")
    {};

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobPriority: public RequestManagerBackupJob
{
public:
    BackupJobPriority()
        : RequestManagerBackupJob("one.backupjob.priority", "A:sii", "Set Backup Job priority")
    {}

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobSchedAdd: public RequestManagerBackupJob
{
public:
    BackupJobSchedAdd()
        : RequestManagerBackupJob("one.backupjob.schedadd", "A:sis", "Create Scheduled Action")
    {};

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobSchedDelete: public RequestManagerBackupJob
{
public:
    BackupJobSchedDelete()
        : RequestManagerBackupJob("one.backupjob.scheddelete", "A:sii", "Delete Scheduled Action")
    {};

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobSchedUpdate: public RequestManagerBackupJob
{
public:
    BackupJobSchedUpdate()
        : RequestManagerBackupJob("one.backupjob.schedupdate", "A:siis", "Update Scheduled Action")
    {};

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

#endif
