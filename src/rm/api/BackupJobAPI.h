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

#ifndef BACKUPJOB_API_H
#define BACKUPJOB_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "BackupJobPool.h"
#include "ScheduledActionPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobAPI : public SharedAPI
{
protected:
    BackupJobAPI(Request &r) : SharedAPI(r)
    {
        Nebula& nd = Nebula::instance();
        bjpool     = nd.get_bjpool();
        sapool     = nd.get_sapool();
        pool       = bjpool;

        request.auth_object(PoolObjectSQL::BACKUPJOB);
        request.auth_op(AuthRequest::MANAGE);
    }

    virtual ~BackupJobAPI() = default;

    /* API calls */
    Request::ErrorCode backup(int oid,
                              RequestAttributes& att);

    Request::ErrorCode cancel(int oid,
                              RequestAttributes& att);

    Request::ErrorCode retry(int oid,
                              RequestAttributes& att);

    Request::ErrorCode priority(int oid,
                                int priority,
                                RequestAttributes& att);

    Request::ErrorCode sched_add(int oid,
                                 const std::string& template_str,
                                 int& sa_id,
                                 RequestAttributes& att);

    Request::ErrorCode sched_delete(int oid,
                                    int sa_id,
                                    RequestAttributes& att);

    Request::ErrorCode sched_update(int oid,
                                    int sa_id,
                                    const std::string& template_str,
                                    RequestAttributes& att);

    /* Helpers */
    void to_xml(RequestAttributes& att, PoolObjectSQL * object,
                std::string& str) override
    {
        static_cast<BackupJob *>(object)->to_xml_extended(str, true);
    };

    int drop(std::unique_ptr<PoolObjectSQL> obj,
        bool recursive,
        RequestAttributes& att) override;

    int exist(const std::string& name, int uid) override
    {
        return bjpool->exist(name, uid);
    }

    BackupJobPool * bjpool;
    ScheduledActionPool * sapool;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobAllocateAPI : public BackupJobAPI
{
protected:
    BackupJobAllocateAPI(Request &r) : BackupJobAPI(r)
    {
        request.auth_op(AuthRequest::CREATE);
    }

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<Template>();
    }

    Request::ErrorCode pool_allocate(std::unique_ptr<Template> tmpl,
                                     int&                       id,
                                     RequestAttributes&         att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobInfoAPI : public BackupJobAPI
{
protected:
    BackupJobInfoAPI(Request &r) : BackupJobAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

#endif
