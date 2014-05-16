/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "AddressRangePool.h"

using namespace std;

AddressRangePool::AddressRangePool():ar_template(false,'=',"AR_POOL"),
    next_ar(0), used_addr(0){};

AddressRangePool::~AddressRangePool()
{
    map<unsigned int, AddressRange *>::iterator it;

    for (it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        delete it->second;
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::from_vattr(vector<Attribute *> ars, string& error_msg)
{
    vector<Attribute *>::iterator it;

    /* -------------------- Init the AR pool ---------------------------- */

    for (it = ars.begin(); it != ars.end(); it++)
    {
        VectorAttribute * va = static_cast<VectorAttribute *>(*it);

        if (va == 0)
        {
            error_msg = "Wrong AR format";
            return -1;
        }

        AddressRange * ar = new AddressRange(next_ar);

        if (ar->from_vattr(va, error_msg) != 0)
        {
            delete ar;
            return -1;
        }

        ar_pool.insert(make_pair(next_ar++, ar));
    }

    /* ---------------------- Template ---------------------------------- */

    for (it = ars.begin(); it != ars.end(); it++)
    {
        ar_template.set(*it);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::from_xml_node(const xmlNodePtr node)
{
    int rc = ar_template.from_xml_node(node);

    if (rc != 0)
    {
        return -1;
    }

    vector<Attribute*> var;

    int num_ar = ar_template.get("AR", var);

    for (int i = 0; i < num_ar; i++)
    {
        VectorAttribute * va = static_cast<VectorAttribute *>(var[i]);

        AddressRange * ar = new AddressRange(0);

        if (ar->from_vattr_db(va)!= 0)
        {
            return -1;
        }

        ar_pool.insert(make_pair(ar->ar_id(), ar));

        if (ar->ar_id() > next_ar)
        {
            next_ar = ar->ar_id() + 1;
        }

        used_addr += ar->get_used_addr();
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& AddressRangePool::to_xml(string& sstream, bool extended) const
{
    if (extended)
    {
        ostringstream oss;
        map<unsigned int, AddressRange *>::const_iterator it;

        oss << "<AR_POOL>";

        for (it=ar_pool.begin(); it!=ar_pool.end(); it++)
        {
            it->second->to_xml(oss);
        }

        oss << "</AR_POOL>";

        sstream = oss.str();

        return sstream;
    }

    return ar_template.to_xml(sstream);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::allocate_addr(PoolObjectSQL::ObjectType ot, int obid,
    VectorAttribute * nic, const vector<string> &inherit)
{
    map<unsigned int, AddressRange *>::iterator it;

    for (it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        if (it->second->allocate_addr(ot, obid, nic, inherit) == 0)
        {
            used_addr++;
            return 0;
        }
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::allocate_by_mac(const string &mac,
    PoolObjectSQL::ObjectType ot, int obid, VectorAttribute * nic,
    const vector<string> &inherit)
{
    map<unsigned int, AddressRange *>::iterator it;

    for (it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        if (it->second->allocate_by_mac(mac, ot, obid, nic, inherit) == 0)
        {
            used_addr++;
            return 0;
        }
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::allocate_by_ip(const string &ip,
    PoolObjectSQL::ObjectType ot, int obid, VectorAttribute * nic,
    const vector<string> &inherit)
{
    map<unsigned int, AddressRange *>::iterator it;

    for (it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        if (it->second->allocate_by_ip(ip, ot, obid, nic, inherit) == 0)
        {
            used_addr++;
            return 0;
        }
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRangePool::free_addr(unsigned int arid, PoolObjectSQL::ObjectType ot,
    int obid, const string& mac)
{
    map<unsigned int, AddressRange *>::iterator it;

    it = ar_pool.find(arid);

    if (it!=ar_pool.end())
    {
        if ( it->second->free_addr(ot, obid, mac) == 0 )
        {
            used_addr--;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRangePool::get_attribute(const char * name, string& value,
    int ar_id) const
{
    map<unsigned int, AddressRange *>::const_iterator it;

    value.clear();

    it = ar_pool.find(ar_id);

    if (it!=ar_pool.end())
    {
        value = it->second->get_attribute(name);
    }
}
