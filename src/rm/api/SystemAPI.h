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

#ifndef SYSTEM_API_H
#define SYSTEM_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"

#include "LogDB.h"
#include "SSLUtil.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SystemAPI: public SharedAPI
{
protected:
    SystemAPI(Request &r) : SharedAPI(r)
    {
        request.auth_op(AuthRequest::ADMIN);
    };

    virtual ~SystemAPI() = default;

    /* API calls */
    Request::ErrorCode version(std::string& version, RequestAttributes& att);

    Request::ErrorCode config(std::string& config_xml, RequestAttributes& att);

    Request::ErrorCode sql(const std::string& sql, bool federate, RequestAttributes& att);

    Request::ErrorCode sql_query(std::string& sql, RequestAttributes& att);

    /* Helpers */
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class SystemVersionAPI : public SystemAPI
{
protected:
    SystemVersionAPI(Request &r) : SystemAPI(r)
    {
        request.zone_disabled(true);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class SystemConfigAPI : public SystemAPI
{
protected:
    SystemConfigAPI(Request &r) : SystemAPI(r)
    {
        request.zone_disabled(true);
    }
};

#endif
