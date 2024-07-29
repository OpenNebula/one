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

#include "RequestManagerSystem.h"
#include "Nebula.h"
#include "LogDB.h"
#include "SSLUtil.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void SystemVersion::request_execute(xmlrpc_c::paramList const& paramList,
                                    RequestAttributes& att)
{
    success_response(Nebula::instance().code_version(), att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void SystemConfig::request_execute(xmlrpc_c::paramList const& paramList,
                                   RequestAttributes& att)
{
    bool is_admin = att.gid == GroupPool::ONEADMIN_ID;

    success_response(Nebula::instance().get_configuration_xml(is_admin), att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void SystemSql::request_execute(xmlrpc_c::paramList const& paramList,
                                RequestAttributes& att)
{
    std::string sql = xmlrpc_c::value_string(paramList.getString(1));
    bool federate   = xmlrpc_c::value_boolean(paramList.getBoolean(2));

    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();

    SqlDB * db;

    if (!att.is_oneadmin())
    {
        att.resp_id  = -1;

        failure_response(AUTHORIZATION, att);
        return;
    }

    if ( federate )
    {
        if (nd.is_federation_slave())
        {
            att.resp_msg = "SQL command has to be executed on a master zone";
            att.resp_id  = - 1;

            failure_response(ACTION, att);
            return;
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

    if ( rc == 0 )
    {
        success_response(0, att);
    }
    else
    {
        att.resp_id = rc;
        failure_response(ACTION, att);
    }

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int SystemSqlQuery::select_cb::callback(void *nil, int num, char **values,
                                        char **names)
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

/* ------------------------------------------------------------------------- */

void SystemSqlQuery::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributes& att)
{
    std::string sql = xmlrpc_c::value_string(paramList.getString(1));

    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();

    SystemSqlQuery::select_cb cb;

    std::ostringstream oss(sql);

    std::string result;

    if (!att.is_oneadmin())
    {
        att.resp_id  = -1;

        failure_response(AUTHORIZATION, att);
        return;
    }


    cb.set_callback();

    int rc = logdb->exec_rd(oss, &cb);

    result = cb.get_result();

    cb.unset_callback();

    if ( rc == 0 )
    {
        oss.str("");

        oss << "<SQL_COMMAND><QUERY><![CDATA[" << sql << "]]></QUERY>"
            << "<RESULT>" << result << "</RESULT></SQL_COMMAND>";

        success_response(oss.str(), att);
    }
    else
    {
        att.resp_id = rc;
        failure_response(ACTION, att);
    }

    return;
}
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void UserQuotaInfo::request_execute(xmlrpc_c::paramList const& paramList,
                                    RequestAttributes& att)
{
    string xml;

    success_response(Nebula::instance().get_default_user_quota().to_xml(xml), att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void GroupQuotaInfo::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributes& att)
{
    string xml;

    success_response(Nebula::instance().get_default_group_quota().to_xml(xml), att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void QuotaUpdate::request_execute(xmlrpc_c::paramList const& paramList,
                                  RequestAttributes& att)
{
    string   quota_str = xmlrpc_c::value_string(paramList.getString(1));
    string   xml;
    Template quota_tmpl;

    int     rc;

    if ( att.gid != GroupPool::ONEADMIN_ID )
    {
        att.resp_msg = "The default quotas can only be updated by users in the"
                       " oneadmin group";
        failure_response(AUTHORIZATION, att);
        return;
    }

    rc = quota_tmpl.parse_str_or_xml(quota_str, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(ACTION, att);
        return;
    }

    rc = set_default_quota(&quota_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(ACTION, att);
        return;
    }

    success_response(get_default_quota()->to_xml(xml), att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int UserQuotaUpdate::set_default_quota(Template *tmpl, string& error)
{
    return Nebula::instance().set_default_user_quota(tmpl, error);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

const DefaultQuotas * UserQuotaUpdate::get_default_quota()
{
    return &Nebula::instance().get_default_user_quota();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int GroupQuotaUpdate::set_default_quota(Template *tmpl, string& error)
{
    return Nebula::instance().set_default_group_quota(tmpl, error);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

const DefaultQuotas * GroupQuotaUpdate::get_default_quota()
{
    return &Nebula::instance().get_default_group_quota();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
