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

#ifndef REQUEST_MANAGER_SYSTEM_H
#define REQUEST_MANAGER_SYSTEM_H

#include "Request.h"
#include "DefaultQuotas.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerSystem: public Request
{
protected:
    RequestManagerSystem(const std::string& method_name,
                         const std::string& help,
                         const std::string& params)
        : Request(method_name, params, help)
    {
        auth_op = AuthRequest::ADMIN;
    };

    ~RequestManagerSystem() {};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SystemVersion : public RequestManagerSystem
{
public:
    SystemVersion():
        RequestManagerSystem("one.system.version",
                             "Returns the OpenNebula version",
                             "A:s")
    {
        zone_disabled = true;
    }

    ~SystemVersion() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SystemConfig : public RequestManagerSystem
{
public:
    SystemConfig():
        RequestManagerSystem("one.system.config",
                             "Returns the OpenNebula configuration",
                             "A:s")
    {
        zone_disabled = true;
    }

    ~SystemConfig() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SystemSql: public RequestManagerSystem
{
public:
    SystemSql():RequestManagerSystem("one.system.sql",
                                         "Executes and replicates SQL commands on the DB backend", "A:ssb") {}

    ~SystemSql() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SystemSqlQuery: public RequestManagerSystem
{
public:
    SystemSqlQuery():RequestManagerSystem("one.system.sqlquery",
                                              "Executes SQL queries on the DB backend", "A:ss") { }

    ~SystemSqlQuery() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
private:

    class select_cb : public Callbackable
    {
    public:
        void set_callback()
        {
            oss.str("");

            Callbackable::set_callback(
                    static_cast<Callbackable::Callback>(&select_cb::callback));
        }

        std::string get_result() const
        {
            return oss.str();
        }

        virtual int callback(void *nil, int num, char **values, char **names);

    private:
        std::ostringstream oss;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserQuotaInfo : public RequestManagerSystem
{
public:
    UserQuotaInfo():
        RequestManagerSystem("one.userquota.info",
                             "Returns the default user quota limits",
                             "A:s")
    {
        zone_disabled = true;
    }

    ~UserQuotaInfo() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupQuotaInfo : public RequestManagerSystem
{
public:
    GroupQuotaInfo():
        RequestManagerSystem("one.groupquota.info",
                             "Returns the default group quota limits",
                             "A:s")
    {
        zone_disabled = true;
    }

    ~GroupQuotaInfo() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class QuotaUpdate : public RequestManagerSystem
{
protected:
    QuotaUpdate(const std::string& method_name,
                const std::string& help):
        RequestManagerSystem(method_name,
                             help,
                             "A:ss") { }

    ~QuotaUpdate() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;

    virtual int set_default_quota(Template *tmpl, std::string& error) = 0;

    const virtual DefaultQuotas* get_default_quota() = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserQuotaUpdate : public QuotaUpdate
{
public:
    UserQuotaUpdate():
        QuotaUpdate("one.userquota.update",
                    "Updates the default user quota limits") { }

    int set_default_quota(Template *tmpl, std::string& error) override;

    const DefaultQuotas* get_default_quota() override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupQuotaUpdate : public QuotaUpdate
{
public:
    GroupQuotaUpdate():
        QuotaUpdate("one.groupquota.update",
                    "Updates the default group quota limits") { }

    int set_default_quota(Template *tmpl, std::string& error) override;

    const DefaultQuotas* get_default_quota() override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
