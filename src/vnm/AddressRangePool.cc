/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
#include "AddressRange.h"

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

int AddressRangePool::from_vattr(VectorAttribute* va, string& error_msg)
{
    AddressRange * ar = new AddressRange(next_ar);

    if (ar->from_vattr(va, error_msg) != 0)
    {
        delete ar;
        return -1;
    }

    ar_pool.insert(make_pair(next_ar++, ar));

    ar_template.set(va);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

AddressRange * AddressRangePool::allocate_ar()
{
    return new AddressRange(next_ar++);
}

/* -------------------------------------------------------------------------- */

int AddressRangePool::add_ar(AddressRange * ar)
{
    pair<map<unsigned int, AddressRange *>::iterator, bool> rc;

    rc = ar_pool.insert(make_pair(ar->ar_id(), ar));

    if (rc.second == false)
    {
        return -1;
    }

    ar_template.set(ar->attr);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::update_ar(
        vector<Attribute *>     ars,
        bool                    keep_restricted,
        string&                 error_msg)
{
    vector<Attribute *>::iterator               it;
    map<unsigned int, AddressRange *>::iterator ar_it;

    unsigned int arid;

    for (it = ars.begin(); it != ars.end(); it++)
    {
        VectorAttribute * va = dynamic_cast<VectorAttribute *>(*it);

        if (va == 0)
        {
            continue;
        }

        if (va->vector_value("AR_ID", arid) != 0)
        {
            error_msg = "AR/AR_ID attribute is missing.";
            return -1;
        }

        ar_it = ar_pool.find(arid);

        if (ar_it == ar_pool.end())
        {
            ostringstream oss;

            oss << "Address Range with ID " << arid << " was not found.";
            error_msg = oss.str();

            return -1;
        }

        return ar_it->second->update_attributes(va, keep_restricted, error_msg);
    }

    error_msg = "Wrong AR definition. AR vector attribute is missing.";
    return -1;
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

        if (ar->ar_id() >= next_ar)
        {
            next_ar = ar->ar_id() + 1;
        }

        used_addr += ar->get_used_addr();
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::rm_ar(unsigned int ar_id, string& error_msg)
{
    map<unsigned int, AddressRange *>::iterator it;

    it = ar_pool.find(ar_id);

    if (it == ar_pool.end())
    {
        error_msg = "Address Range does not exist";
        return -1;
    }

    if (it->second->get_used_addr() > 0)
    {
        error_msg = "Address Range has leases in use";
        return -1;
    }

    AddressRange * ar_ptr = it->second;

    ar_pool.erase(it);

    delete ar_ptr;

    vector<Attribute*> ars;
    vector<Attribute*>::iterator it_ar;

    Attribute * the_ar = 0;

    unsigned int ar_id_templ;

    ar_template.get("AR", ars);

    for (it_ar=ars.begin(); it_ar!=ars.end(); it_ar++)
    {
        VectorAttribute *ar = dynamic_cast<VectorAttribute *>(*it_ar);

        if (ar == 0)
        {
            continue;
        }

        if ((ar->vector_value("AR_ID",ar_id_templ)==0) && (ar_id_templ==ar_id))
        {
            the_ar = ar;
            break;
        }
    }

    if (the_ar != 0)
    {
        delete ar_template.remove(the_ar);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& AddressRangePool::to_xml(string& sstream, bool extended,
    const vector<int>& vms, const vector<int>& vnets,
    const vector<int>& vrs) const
{
    if (extended)
    {
        ostringstream oss;
        map<unsigned int, AddressRange *>::const_iterator it;

        oss << "<AR_POOL>";

        for (it=ar_pool.begin(); it!=ar_pool.end(); it++)
        {
            it->second->to_xml(oss, vms, vnets, vrs);
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

void AddressRangePool::free_addr_by_ip(unsigned int arid,
    PoolObjectSQL::ObjectType ot, int obid, const string& ip)
{
    map<unsigned int, AddressRange *>::iterator it;

    it = ar_pool.find(arid);

    if (it!=ar_pool.end())
    {
        if ( it->second->free_addr_by_ip(ot, obid, ip) == 0 )
        {
            used_addr--;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRangePool::free_addr(PoolObjectSQL::ObjectType ot, int obid,
    const string& mac_s)
{
    map<unsigned int, AddressRange *>::iterator it;

    for (it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        if (it->second->free_addr(ot, obid, mac_s) == 0)
        {
            used_addr--;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRangePool::free_addr_by_ip(PoolObjectSQL::ObjectType ot, int obid,
    const string& ip_s)
{
    map<unsigned int, AddressRange *>::iterator it;

    for (it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        if (it->second->free_addr_by_ip(ot, obid, ip_s) == 0)
        {
            used_addr--;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::free_addr_by_owner(PoolObjectSQL::ObjectType ot, int oid)
{
    map<unsigned int, AddressRange *>::iterator it;
    unsigned int used_addr_ini = used_addr;

    for (it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        used_addr -= it->second->free_addr_by_owner(ot, oid);
    }

    return used_addr_ini - used_addr;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::free_addr_by_range(unsigned int arid,
    PoolObjectSQL::ObjectType ot, int obid, const string& mac, unsigned int rsize)
{
    map<unsigned int, AddressRange *>::iterator it;

    unsigned int freed = 0;

    it = ar_pool.find(arid);

    if (it!=ar_pool.end())
    {
        freed = it->second->free_addr_by_range(ot, obid, mac, rsize);

        used_addr -= freed;
    }

    return freed;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRangePool::get_attribute(const char * name, string& value,
    int ar_id) const
{
    map<unsigned int, AddressRange *>::const_iterator it = ar_pool.find(ar_id);

    value.clear();

    if (it!=ar_pool.end())
    {
        value = it->second->get_attribute(name);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::get_attribute(const char * name, int& value,
    int ar_id) const
{
    map<unsigned int, AddressRange *>::const_iterator it = ar_pool.find(ar_id);

    int rc = -1;

    if (it!=ar_pool.end())
    {
        rc = it->second->get_attribute(name, value);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const set<int>& AddressRangePool::get_security_groups(int ar_id) const
{
    map<unsigned int, AddressRange *>::const_iterator it = ar_pool.find(ar_id);

    if (it == ar_pool.end())
    {
        static set<int> empty_set;

        return empty_set;
    }

    return it->second->get_security_groups();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::get_ar_parent(int ar_id) const
{
    int rc;

    if (get_attribute("PARENT_NETWORK_AR_ID", rc, ar_id) != 0)
    {
        rc = -1;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

unsigned int AddressRangePool::get_size() const
{
    map<unsigned int, AddressRange *>::const_iterator it;

    unsigned int total = 0;

    for (it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        total += it->second->get_size();
    }

    return total;
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::hold_by_ip(unsigned int ar_id, const string& ip_s)
{
    map<unsigned int, AddressRange *>::const_iterator it;

    it = ar_pool.find(ar_id);

    if (it == ar_pool.end())
    {
        return -1;
    }

    int rc = it->second->hold_by_ip(ip_s);

    if (rc == 0)
    {
        used_addr++;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::hold_by_ip(const string& ip_s)
{
    map<unsigned int, AddressRange *>::iterator it;
    int rc = -1;

    for (it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        if (it->second->hold_by_ip(ip_s) == 0) //At least one AR hold the IP
        {
            used_addr++;
            rc = 0;
        }
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::hold_by_mac(unsigned int ar_id, const string& mac_s)
{
    map<unsigned int, AddressRange *>::iterator it;

    it = ar_pool.find(ar_id);

    if (it == ar_pool.end())
    {
        return -1;
    }

    int rc = it->second->hold_by_mac(mac_s);

    if (rc == 0)
    {
        used_addr++;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::hold_by_mac(const string& mac_s)
{
    map<unsigned int, AddressRange *>::iterator it;
    int rc = -1;

    for (it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        if (it->second->hold_by_mac(mac_s) == 0) //At least one AR hold the IP
        {
            used_addr++;
            rc = 0;
        }
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::reserve_addr(int vid, unsigned int rsize,
    AddressRange *rar)
{
    map<unsigned int, AddressRange *>::iterator it;

    for (it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        if ((it->second->get_free_addr() >= rsize) &&
            (it->second->reserve_addr(vid, rsize, rar) == 0))
        {
            used_addr += rsize;
            return 0;
        }
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::reserve_addr(int vid, unsigned int rsize,
    unsigned int ar_id, AddressRange *rar)
{
    map<unsigned int, AddressRange *>::iterator it;

    it = ar_pool.find(ar_id);

    if (it == ar_pool.end())
    {
        return -1;
    }

    if ((it->second->get_free_addr() >= rsize) &&
        (it->second->reserve_addr(vid, rsize, rar) == 0))
    {
        used_addr += rsize;
        return 0;
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::reserve_addr_by_ip(int vid, unsigned int rsize,
    unsigned int ar_id, const string& ip, AddressRange *rar)
{
    map<unsigned int, AddressRange *>::iterator it;

    it = ar_pool.find(ar_id);

    if (it == ar_pool.end())
    {
        return -1;
    }

    if (it->second->reserve_addr_by_ip(vid, rsize, ip, rar) == 0)
    {
        used_addr += rsize;
        return 0;
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::reserve_addr_by_mac(int vid, unsigned int rsize,
    unsigned int ar_id, const string& mac, AddressRange *rar)
{
    map<unsigned int, AddressRange *>::iterator it;

    it = ar_pool.find(ar_id);

    if (it == ar_pool.end())
    {
        return -1;
    }

    if (it->second->reserve_addr_by_mac(vid, rsize, mac, rar) == 0)
    {
        used_addr += rsize;
        return 0;
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRangePool::process_security_rule(
        VectorAttribute *        rule,
        vector<VectorAttribute*> &new_rules)
{
    map<unsigned int, AddressRange *>::iterator it;

    for (it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        VectorAttribute* new_rule = new VectorAttribute(
                                    "SECURITY_GROUP_RULE", rule->value());

        it->second->process_security_rule(new_rule);

        new_rules.push_back(new_rule);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
