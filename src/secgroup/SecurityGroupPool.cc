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

#include "SecurityGroupPool.h"
#include "User.h"
#include "Nebula.h"
#include "NebulaLog.h"
#include "VirtualNetworkPool.h"

using namespace std;

/* -------------------------------------------------------------------------- */

SecurityGroupPool::SecurityGroupPool(SqlDB * db)
    : PoolSQL(db, one_db::sg_table)
{
    //lastOID is set in PoolSQL::init_cb
    if (get_lastOID() == -1)
    {
        // Build the default default security group
        string default_sg =
                "NAME=default\n"
                "DESCRIPTION=\"The default security group is added to every "
                "network. Use it to add default filter rules for your networks. "
                "You may remove this security group from any network by "
                "updating its properties.\"\n"
                "RULE=[RULE_TYPE=OUTBOUND,PROTOCOL=ALL]\n"
                "RULE=[RULE_TYPE=INBOUND,PROTOCOL=ALL]";

        Nebula& nd         = Nebula::instance();
        UserPool * upool   = nd.get_upool();
        auto      oneadmin = upool->get_ro(0);

        string error;

        auto default_tmpl = make_unique<Template>();
        char * error_parse;

        default_tmpl->parse(default_sg, &error_parse);

        SecurityGroup * secgroup = new SecurityGroup(
                oneadmin->get_uid(),
                oneadmin->get_gid(),
                oneadmin->get_uname(),
                oneadmin->get_gname(),
                oneadmin->get_umask(),
                move(default_tmpl));

        secgroup->set_permissions(1, 1, 1, 1, 0, 0, 1, 0, 0, error);

        if (PoolSQL::allocate(secgroup, error) < 0)
        {
            ostringstream oss;
            oss << "Error trying to create default security group: " << error;
            NebulaLog::log("SGROUP", Log::ERROR, oss);

            throw runtime_error(oss.str());
        }

        // The first 100 IDs are reserved for system Security Groups.
        // Regular ones start from ID 100
        set_lastOID(99);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SecurityGroupPool::allocate(
        int             uid,
        int             gid,
        const string&   uname,
        const string&   gname,
        int             umask,
        unique_ptr<Template> sgroup_template,
        int *           oid,
        string&         error_str)
{
    int    db_oid;
    string name;

    ostringstream oss;

    auto secgroup = new SecurityGroup(uid, gid, uname, gname, umask,
                                      move(sgroup_template));

    // -------------------------------------------------------------------------
    // Check name & duplicates
    // -------------------------------------------------------------------------

    secgroup->get_template_attribute("NAME", name);

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    db_oid = exist(name, uid);

    if( db_oid != -1 )
    {
        goto error_duplicated;
    }

    *oid = PoolSQL::allocate(move(secgroup), error_str);

    return *oid;

error_duplicated:
    oss << "NAME is already taken by SecurityGroup " << db_oid << ".";
    error_str = oss.str();

error_name:
    delete secgroup;
    *oid = -1;

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SecurityGroupPool::get_security_group_rules(int vmid, int sgid,
                                                 vector<VectorAttribute*> &rules)
{
    vector<VectorAttribute*> sg_rules;

    int vnet_id;
    VirtualNetworkPool* vnet_pool = Nebula::instance().get_vnpool();

    if (auto sg = get(sgid))
    {
        if ( vmid != -1 )
        {
            sg->add_vm(vmid);

            update(sg.get());
        }

        sg->get_rules(sg_rules);
    }
    else
    {
        return;
    }

    for (auto rule : sg_rules)
    {
        if ( rule->vector_value("NETWORK_ID", vnet_id) != -1 )
        {
            vector<VectorAttribute*> vnet_rules;

            if ( auto vnet = vnet_pool->get_ro(vnet_id) )
            {
                vnet->process_security_rule(rule, vnet_rules);

                delete rule;

                rules.insert(rules.end(), vnet_rules.begin(), vnet_rules.end());
            }
            else
            {
                delete rule;
                continue;
            }
        }
        else
        {
            rules.push_back(rule);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SecurityGroupPool::release_security_group(int id, int sgid)
{
    if (id == -1)
    {
        return;
    }

    if ( auto sg = get(sgid) )
    {
        sg->del_vm(id);

        update(sg.get());
    }
}

