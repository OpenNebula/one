/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "Quotas.h"
#include "Nebula.h"

#include "ObjectXML.h"


int Quotas::set(Template *tmpl, string& error)
{
    vector<Attribute *> vquotas;

    if ( tmpl->get(datastore_quota.get_quota_name(), vquotas) > 0 )
    {
        if ( datastore_quota.set(&vquotas, error) != 0 )
        {
            return -1;
        }
    
        vquotas.clear();
    }

    if ( tmpl->get(network_quota.get_quota_name(), vquotas) > 0 )
    {
        if ( network_quota.set(&vquotas, error) != 0 )
        {
            return -1;
        }
    
        vquotas.clear();
    }

    if ( tmpl->get(image_quota.get_quota_name(), vquotas) > 0 )
    {
        if ( image_quota.set(&vquotas, error) != 0 )
        {
            return -1;
        }
    
        vquotas.clear();
    }

    if ( tmpl->get(vm_quota.get_quota_name(), vquotas) > 0 )
    {
        if ( vm_quota.set(&vquotas, error) != 0 )
        {
            return -1;
        }
    
        vquotas.clear();
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& Quotas::to_xml(string& xml) const
{
    ostringstream oss;

    string ds_quota_xml;
    string net_quota_xml;
    string vm_quota_xml;
    string image_quota_xml;

    oss << datastore_quota.to_xml(ds_quota_xml)
        << network_quota.to_xml(net_quota_xml)
        << vm_quota.to_xml(vm_quota_xml)
        << image_quota.to_xml(image_quota_xml);

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Quotas::from_xml(ObjectXML * object_xml)
{
    vector<xmlNodePtr> content;
    int                rc = 0;

    object_xml->get_nodes(ds_xpath, content);

    if (!content.empty())
    {
        rc += datastore_quota.from_xml_node(content[0]);
    }

    object_xml->free_nodes(content);
    content.clear();

    object_xml->get_nodes(net_xpath, content);

    if (!content.empty())
    {
        rc += network_quota.from_xml_node(content[0]);
    }

    object_xml->free_nodes(content);
    content.clear();

    object_xml->get_nodes(vm_xpath, content);

    if (!content.empty())
    {
        rc += vm_quota.from_xml_node(content[0]);
    }

    object_xml->free_nodes(content);
    content.clear();

    object_xml->get_nodes(img_xpath, content);

    if (!content.empty())
    {
        rc += image_quota.from_xml_node(content[0]);
    }

    object_xml->free_nodes(content);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Quotas::vm_del(int uid, int gid, Template * tmpl)
{
    Nebula&     nd    = Nebula::instance();
    UserPool *  upool = nd.get_upool();
    GroupPool * gpool = nd.get_gpool();

    User *  user;
    Group * group;

    if ( uid != UserPool::ONEADMIN_ID )
    {
        user = upool->get(uid, true);

        if ( user != 0 )
        {
            user->quota.vm_del(tmpl);

            upool->update(user);

            user->unlock();
        }
    }
    
    if ( gid != GroupPool::ONEADMIN_ID )
    {
        group = gpool->get(gid, true);

        if ( group != 0 )
        {
            group->quota.vm_del(tmpl);

            gpool->update(group);

            group->unlock();
        } 
   }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Quotas::ds_del(int uid, int gid, Template * tmpl)
{
    Nebula&     nd    = Nebula::instance();
    UserPool *  upool = nd.get_upool();
    GroupPool * gpool = nd.get_gpool();

    User *  user;
    Group * group;

    if ( uid != UserPool::ONEADMIN_ID )
    {
        user = upool->get(uid, true);

        if ( user != 0 )
        {
            user->quota.ds_del(tmpl);

            upool->update(user);

            user->unlock();
        } 
    }

    if ( gid != GroupPool::ONEADMIN_ID )
    {
        group = gpool->get(gid, true);

        if ( group != 0 )
        {
            group->quota.ds_del(tmpl);

            gpool->update(group);

            group->unlock();
        }        
    }
}
