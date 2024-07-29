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

#include "PoolSQL.h"
#include "RequestManagerPoolInfoFilter.h"
#include "AclManager.h"
#include "Nebula.h"
#include "ClusterPool.h"

#include <sstream>
#include <algorithm>

using namespace std;

/* ************************************************************************** */
/* PoolSQL constructor/destructor                                             */
/* ************************************************************************** */

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
static int _get_lastOID(SqlDB * db, const string& table)
{
    ostringstream oss;

    int _last_oid = -1;

    single_cb<int> cb;

    cb.set_callback(&_last_oid);

    oss << "SELECT last_oid FROM pool_control WHERE tablename='" << table <<"'";

    db->exec_rd(oss, &cb);

    cb.unset_callback();

    return _last_oid;
}

int PoolSQL::get_lastOID()
{
    int _last_oid;

    lock_guard<mutex> lock(_mutex);

    _last_oid = _get_lastOID(db, table);

    return _last_oid;
}

/* -------------------------------------------------------------------------- */

static int _set_lastOID(int _last_oid, SqlDB * db, const string& table)
{
    ostringstream oss;

    oss << "REPLACE INTO pool_control (tablename, last_oid) VALUES ('" << table
        << "'," << _last_oid << ")";

    return db->exec_wr(oss);
}

void PoolSQL::set_lastOID(int _last_oid)
{
    lock_guard<mutex> lock(_mutex);

    _set_lastOID(_last_oid, db, table);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PoolSQL::PoolSQL(SqlDB * _db, const char * _table)
    : db(_db)
    , table(_table)
{
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PoolSQL::~PoolSQL()
{
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* PoolSQL public interface                                                   */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
int PoolSQL::allocate(PoolObjectSQL *objsql, string& error_str)
{
    int rc;
    int lastOID;

    lock_guard<mutex> lock(_mutex);

    lastOID = _get_lastOID(db, table);

    if (lastOID == INT_MAX)
    {
        lastOID = -1;
    }

    objsql->oid = ++lastOID;

    if ( _set_lastOID(lastOID, db, table) == -1 )
    {
        return -1;
    }

    rc = objsql->insert(db, error_str);

    if ( rc != 0 )
    {
        rc = -1;
    }
    else
    {
        rc = lastOID;
    }

    delete objsql;

    if( rc == -1 )
    {
        lastOID = lastOID - 1;

        if ( lastOID < 0 )
        {
            lastOID = 0;
        }

        _set_lastOID(lastOID, db, table);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PoolSQL::exist(const string& id_str, std::set<int>& id_list)
{
    std::vector<int> existing_items;

    one_util::split_unique(id_str, ',', id_list);

    search(existing_items, table.c_str(), "1 order by 1 ASC");

    for (auto iterator = id_list.begin(); iterator != id_list.end();)
    {
        if (!std::binary_search(existing_items.begin(), existing_items.end(), *iterator))
        {
            iterator = id_list.erase(iterator);
        }
        else
        {
            ++iterator;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolSQL::dump(string& oss, const string& elem_name, const string& column,
                  const char* table, const string& where, int sid, int eid, bool desc)
{
    ostringstream   cmd;

    cmd << "SELECT " << column << " FROM " << table;

    if ( !where.empty() )
    {
        cmd << " WHERE " << where;
    }

    cmd << " ORDER BY oid";

    if ( desc == true )
    {
        cmd << " DESC";
    }

    if ( eid != -1 )
    {
        cmd << " " << db->limit_string(sid, eid);
    }

    return dump(oss, elem_name, cmd);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolSQL::dump(string& oss, const string& root_elem_name,
                  ostringstream& sql_query)
{
    int rc;

    string_cb cb(1);

    ostringstream oelem;

    if (!root_elem_name.empty())
    {
        oelem << "<" << root_elem_name << ">";

        oss.append(oelem.str());
    }

    cb.set_callback(&oss);

    rc = db->exec_rd(sql_query, &cb);

    cb.unset_callback();

    if (!root_elem_name.empty())
    {
        oelem.str("");

        oelem << "</" << root_elem_name << ">";

        oss.append(oelem.str());
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolSQL::search(
        vector<int>&    oids,
        const char *    table,
        const string&   where)
{
    ostringstream   sql;
    int             rc;

    vector_cb<int> cb;

    cb.set_callback(&oids);

    sql  << "SELECT oid FROM " <<  table;

    if (!where.empty())
    {
        sql << " WHERE " << where;
    }

    rc = db->exec_rd(sql, &cb);

    cb.unset_callback();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PoolSQL::acl_filter(int                       uid,
                         const set<int>&           user_groups,
                         PoolObjectSQL::ObjectType auth_object,
                         bool&                     all,
                         bool                      disable_all_acl,
                         bool                      disable_cluster_acl,
                         bool                      disable_group_acl,
                         string&                   filter)
{
    filter.clear();

    if ( uid == UserPool::ONEADMIN_ID ||
         user_groups.count( GroupPool::ONEADMIN_ID ) == 1 )
    {
        all = true;
        return;
    }

    Nebula&     nd   = Nebula::instance();
    AclManager* aclm = nd.get_aclm();

    ostringstream         acl_filter;

    vector<int> oids;
    vector<int> gids;
    vector<int> cids;

    aclm->reverse_search(uid,
                         user_groups,
                         auth_object,
                         AuthRequest::USE,
                         disable_all_acl,
                         disable_cluster_acl,
                         disable_group_acl,
                         all,
                         oids,
                         gids,
                         cids);

    for ( auto oid : oids )
    {
        acl_filter << " OR oid = " << oid;
    }

    for ( auto gid : gids )
    {
        acl_filter << " OR gid = " << gid;
    }

    ClusterPool::cluster_acl_filter(acl_filter, auth_object, cids);

    filter = acl_filter.str();
}

/* -------------------------------------------------------------------------- */

void PoolSQL::usr_filter(int                uid,
                         int                gid,
                         const set<int>&    user_groups,
                         int                filter_flag,
                         bool               all,
                         const string&      acl_str,
                         string&            filter)
{
    ostringstream uid_filter;

    if ( filter_flag == RequestManagerPoolInfoFilter::MINE )
    {
        uid_filter << "uid = " << uid;
    }
    else if ( filter_flag == RequestManagerPoolInfoFilter::GROUP )
    {
        uid_filter << "gid = " << gid;
    }
    else if ( filter_flag == RequestManagerPoolInfoFilter::MINE_GROUP )
    {
        uid_filter << "uid = " << uid << " OR ( (";

        string sep = " ";

        for (auto g_id : user_groups)
        {
            uid_filter << sep << "( gid = " << g_id << " )";
            sep = " OR ";
        }

        uid_filter << ")";

        if ( !all )
        {
            uid_filter << " AND ( other_u = 1";

            for (auto g_id : user_groups)
            {
                uid_filter << " OR ( gid = " << g_id << " AND group_u = 1 )";
            }

            uid_filter << acl_str << ")";
        }

        uid_filter << ")";
    }
    else if ( filter_flag == RequestManagerPoolInfoFilter::ALL )
    {
        if (!all)
        {
            uid_filter << " uid = " << uid
                       << " OR other_u = 1";

            for (auto g_id : user_groups)
            {
                uid_filter << " OR ( gid = " << g_id << " AND group_u = 1 )";
            }

            uid_filter << acl_str;
        }
    }
    else
    {
        uid_filter << "uid = " << filter_flag;

        if ( filter_flag != uid && !all )
        {
            uid_filter << " AND ( other_u = 1";

            for (auto g_id : user_groups)
            {
                uid_filter << " OR ( gid = " << g_id << " AND group_u = 1 )";
            }

            uid_filter << acl_str << ")";
        }
    }

    filter = uid_filter.str();
}

/* -------------------------------------------------------------------------- */

void PoolSQL::oid_filter(int     start_id,
                         int     end_id,
                         string& filter)
{
    ostringstream idfilter;

    if ( end_id >= -1 && start_id != -1 )
    {
        idfilter << "oid >= " << start_id;

        if ( end_id != -1 )
        {
            idfilter << " AND oid <= " << end_id;
        }
    }

    filter = idfilter.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

