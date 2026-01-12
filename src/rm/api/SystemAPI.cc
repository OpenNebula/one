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

#include "SystemAPI.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode SystemAPI::version(std::string& version, RequestAttributes& att)
{
    version = Nebula::instance().code_version();

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode SystemAPI::config(std::string& config_xml, RequestAttributes& att)
{
    bool is_admin = att.gid == GroupPool::ONEADMIN_ID;

    config_xml = Nebula::instance().get_configuration_xml(is_admin);

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode SystemAPI::sql(const std::string& sql, bool federate, RequestAttributes& att)
{
    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();

    SqlDB * db;

    if (!att.is_oneadmin())
    {
        att.resp_id  = -1;

        return Request::AUTHORIZATION;
    }

    if ( federate )
    {
        if (nd.is_federation_slave())
        {
            att.resp_msg = "SQL command has to be executed on a master zone";
            att.resp_id  = - 1;

            return Request::ACTION;
        }

        db = new FedLogDB(logdb);
    }
    else
    {
        db = logdb;
    }

    std::ostringstream oss(sql);

    int rc = db->exec_wr(oss);

    if ( federate )
    {
        delete db;
    }

    if (rc != 0)
    {
        att.resp_id = rc;

        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SystemAPI::select_cb::callback(void *nil, int num, char **values, char **names)
{
    oss << "<ROW>";

    for ( int i = 0 ; i < num ; ++i )
    {
        if (values[i] != 0 && values[i][0] == '<')
        {
            std::string val(values[i]);
            std::string val64;

            if (ssl_util::base64_encode(val, val64) == 0)
            {
                oss << "<" << names[i] << "64>"
                    << "<![CDATA[" << val64 << "]]>"
                    << "</"<< names[i] << "64>";
            }
        }
        else
        {
            oss << "<" << names[i] << ">"
                << "<![CDATA[" << values[i] << "]]>"
                << "</"<< names[i] << ">";
        }
    }

    oss << "</ROW>";

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode SystemAPI::sql_query(std::string& sql, RequestAttributes& att)
{
    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();

    SystemAPI::select_cb cb;

    std::ostringstream oss(sql);

    std::string result;

    if (!att.is_oneadmin())
    {
        att.resp_id  = -1;

        return Request::AUTHORIZATION;
    }


    cb.set_callback();

    int rc = logdb->exec_rd(oss, &cb);

    result = cb.get_result();

    cb.unset_callback();

    if ( rc != 0 )
    {
        att.resp_id = rc;

        return Request::ACTION;
    }

    oss.str("");

    oss << "<SQL_COMMAND><QUERY><![CDATA[" << sql << "]]></QUERY>"
        << "<RESULT>" << result << "</RESULT></SQL_COMMAND>";

    sql = oss.str();

    return Request::SUCCESS;
}
