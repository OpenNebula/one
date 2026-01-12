/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#ifndef BACKUPJOB_XRPC_H
#define BACKUPJOB_XRPC_H

#include "RequestXRPC.h"
#include "BackupJobAPI.h"
#include "BackupJobPoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobAllocateXRPC : public RequestXRPC, public BackupJobAllocateAPI
{
public:
    BackupJobAllocateXRPC() :
        RequestXRPC("one.backupjob.allocate",
                    "Allocates a new Backup Job",
                    "A:ss"),
        BackupJobAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobDeleteXRPC : public RequestXRPC, public BackupJobAPI
{
public:
    BackupJobDeleteXRPC() :
        RequestXRPC("one.backupjob.delete",
                    "Deletes a Backup Job",
                    "A:si"),
        BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobUpdateXRPC : public RequestXRPC, public BackupJobAPI
{
public:
    BackupJobUpdateXRPC() :
        RequestXRPC("one.backupjob.update",
                    "Updates a Backup Job template",
                    "A:sisi"),
        BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobRenameXRPC : public RequestXRPC, public BackupJobAPI
{
public:
    BackupJobRenameXRPC() :
        RequestXRPC("one.backupjob.rename",
                    "Renames a Backup Job",
                    "A:sis"),
        BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobChmodXRPC: public RequestXRPC, public BackupJobAPI
{
public:
    BackupJobChmodXRPC()
        : RequestXRPC("one.backupjob.chmod",
                      "Changes permission bits of a Backup Job",
                      "A:siiiiiiiiii")
        , BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobChownXRPC : public RequestXRPC, public BackupJobAPI
{
public:
    BackupJobChownXRPC()
        : RequestXRPC("one.backupjob.chown",
                      "Changes ownership of a Backup Job",
                      "A:siii")
        , BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobLockXRPC : public RequestXRPC, public BackupJobAPI
{
public:
    BackupJobLockXRPC()
        : RequestXRPC("one.backupjob.lock",
                      "Lock a Backup Job",
                      "A:siib")
        , BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobUnlockXRPC : public RequestXRPC, public BackupJobAPI
{
public:
    BackupJobUnlockXRPC()
        : RequestXRPC("one.backupjob.unlock",
                      "Unlock a Backup Job",
                      "A:si")
        , BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobBackupXRPC : public RequestXRPC, public BackupJobAPI
{
public:
    BackupJobBackupXRPC()
        : RequestXRPC("one.backupjob.backup",
                      "Execute Backup Job",
                      "A:si")
        , BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobCancelXRPC : public RequestXRPC, public BackupJobAPI
{
public:
    BackupJobCancelXRPC()
        : RequestXRPC("one.backupjob.cancel",
                      "Cancel Backup Job execution",
                      "A:si")
        , BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobRetryXRPC : public RequestXRPC, public BackupJobAPI
{
public:
    BackupJobRetryXRPC()
        : RequestXRPC("one.backupjob.retry",
                      "Retry Backup Job",
                      "A:si")
        , BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobPriorityXRPC : public RequestXRPC, public BackupJobAPI
{
public:
    BackupJobPriorityXRPC()
        : RequestXRPC("one.backupjob.priority",
                      "Set Backup Job priority",
                      "A:sii")
        , BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobSchedAddXRPC : public RequestXRPC, public BackupJobAPI
{
public:
    BackupJobSchedAddXRPC()
        : RequestXRPC("one.backupjob.schedadd",
                      "Create Scheduled Action",
                      "A:sis")
        , BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobSchedDelXRPC : public RequestXRPC, public BackupJobAPI
{
public:
    BackupJobSchedDelXRPC()
        : RequestXRPC("one.backupjob.scheddelete",
                      "Delete Scheduled Action",
                      "A:sii")
        , BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobSchedUpdateXRPC : public RequestXRPC, public BackupJobAPI
{
public:
    BackupJobSchedUpdateXRPC()
        : RequestXRPC("one.backupjob.schedupdate",
                      "pdate Scheduled Action",
                      "A:siis")
        , BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobInfoXRPC : public RequestXRPC, public BackupJobInfoAPI
{
public:
    BackupJobInfoXRPC():
        RequestXRPC("one.backupjob.info",
                    "Returns Backup Job information",
                    "A:sib"),
        BackupJobInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobPoolInfoXRPC : public RequestXRPC, public BackupJobPoolAPI
{
public:
    BackupJobPoolInfoXRPC()
        : RequestXRPC("one.backupjobpool.info",
                      "Returns the Backup Job pool",
                      "A:siii")
        , BackupJobPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
