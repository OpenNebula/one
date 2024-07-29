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

#include "AddressRangePool.h"
#include "AddressRange.h"
#include "AddressRangeInternal.h"
#include "AddressRangeIPAM.h"

#include "IPAMRequest.h"
#include "IPAMManager.h"
#include "VirtualMachineNic.h"

#include "Nebula.h"
#include "NebulaUtil.h"

using namespace std;

AddressRangePool::AddressRangePool():ar_template(false, '=', "AR_POOL"),
    next_ar(0), used_addr(0) {};

AddressRangePool::~AddressRangePool()
{
    for (auto it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        delete it->second;
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::from_vattr(VectorAttribute* va, string& error_msg)
{
    AddressRange * ar = allocate_ar(va->vector_value("IPAM_MAD"));
    string one_key;

    if (ar->from_vattr(va, error_msg) != 0)
    {
        next_ar = next_ar - 1;
        delete ar;

        return -1;
    }

    ar_pool.insert(make_pair(ar->ar_id(), ar));

    ar_template.set(va);

    Nebula::instance().get_configuration_attribute("ONE_KEY", one_key);
    ar_template.encrypt(one_key);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

AddressRange * AddressRangePool::allocate_ar(const string& ipam_mad)
{
    return allocate_ar(ipam_mad, next_ar++);
}

/* -------------------------------------------------------------------------- */

AddressRange * AddressRangePool::allocate_ar(const string& ipam_mad,
                                             unsigned int na)
{
    if ( ipam_mad.empty() || ipam_mad == "internal" )
    {
        return new AddressRangeInternal(na);
    }
    else
    {
        return new AddressRangeIPAM(na);
    }
}

/* -------------------------------------------------------------------------- */

int AddressRangePool::add_ar(AddressRange * ar)
{
    string one_key;

    auto rc = ar_pool.insert(make_pair(ar->ar_id(), ar));

    if (rc.second == false)
    {
        return -1;
    }

    ar_template.set(ar->attr);

    Nebula::instance().get_configuration_attribute("ONE_KEY", one_key);
    ar_template.encrypt(one_key);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::update_ar(vector<VectorAttribute *> ars, bool keep_restricted,
                                std::set<int>& update_ids, std::unique_ptr<VectorAttribute>& update_attr,
                                string& error_msg)
{
    unsigned int arid;

    for (auto attr : ars)
    {
        if (attr->vector_value("AR_ID", arid) != 0)
        {
            error_msg = "AR/AR_ID attribute is missing.";
            return -1;
        }

        auto ar_it = ar_pool.find(arid);

        if (ar_it == ar_pool.end())
        {
            ostringstream oss;

            oss << "Address Range with ID " << arid << " was not found.";
            error_msg = oss.str();

            return -1;
        }

        return ar_it->second->update_attributes(attr, keep_restricted,
                                                update_ids, update_attr, error_msg);
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

    vector<VectorAttribute *> var;

    int num_ar = ar_template.get("AR", var);

    for (int i = 0; i < num_ar; i++)
    {
        AddressRange * ar = allocate_ar((var[i])->vector_value("IPAM_MAD"), 0);

        if (ar->from_vattr_db(var[i]) != 0)
        {
            delete ar;
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

int AddressRangePool::rm_ar(unsigned int ar_id, bool force, string& error_msg)
{
    auto it = ar_pool.find(ar_id);

    if (it == ar_pool.end())
    {
        error_msg = "Address Range does not exist";
        return -1;
    }

    if (!force && it->second->get_used_addr() > 0)
    {
        error_msg = "Address Range has leases in use";
        return -1;
    }

    AddressRange * ar_ptr    = it->second;
    VectorAttribute * the_ar = ar_ptr->attr;

    if(ar_ptr->is_ipam())
    {
        IPAMManager * ipamm = Nebula::instance().get_ipamm();

        IPAMRequest ir(ar_ptr);

        ipamm->trigger_unregister_address_range(ir);

        ir.wait();

        if (!force && ir.result != true)
        {
            error_msg = ir.message;
            return -1;
        }
    }

    ar_pool.erase(it);

    delete ar_ptr;

    if (the_ar != 0)
    {
        delete ar_template.remove(the_ar);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::rm_ars(string& error_msg)
{
    for ( auto it = ar_pool.begin(); it != ar_pool.end(); )
    {
        if(it->second->is_ipam())
        {
            IPAMManager * ipamm = Nebula::instance().get_ipamm();

            IPAMRequest ir(it->second->attr);

            ipamm->trigger_unregister_address_range(ir);

            ir.wait();

            if (ir.result != true)
            {
                error_msg = ir.message;
                return -1;
            }
        }

        if (it->second->attr != 0)
        {
            delete ar_template.remove(it->second->attr);
        }

        delete it->second;

        it = ar_pool.erase(it);
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

        oss << "<AR_POOL>";

        for (auto it=ar_pool.begin(); it!=ar_pool.end(); it++)
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
                                    VectorAttribute * nic, const set<string> &inherit)
{
    for (auto it=ar_pool.begin(); it!=ar_pool.end(); it++)
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
                                      const set<string> &inherit)
{
    for (auto it=ar_pool.begin(); it!=ar_pool.end(); it++)
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
                                     const set<string> &inherit)
{
    for (auto it=ar_pool.begin(); it!=ar_pool.end(); it++)
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

int AddressRangePool::allocate_by_ip6(const string &ip,
                                      PoolObjectSQL::ObjectType ot, int obid, VectorAttribute * nic,
                                      const set<string> &inherit)
{
    for (auto it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        if (it->second->allocate_by_ip6(ip, ot, obid, nic, inherit) == 0)
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
    auto it = ar_pool.find(arid);

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
    auto it = ar_pool.find(arid);

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

void AddressRangePool::free_addr_by_ip6(unsigned int arid,
                                        PoolObjectSQL::ObjectType ot, int obid, const string& ip)
{
    auto it = ar_pool.find(arid);

    if (it!=ar_pool.end())
    {
        if ( it->second->free_addr_by_ip6(ot, obid, ip) == 0 )
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
    for (auto it=ar_pool.begin(); it!=ar_pool.end(); it++)
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
    for (auto it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        if (it->second->free_addr_by_ip(ot, obid, ip_s) == 0)
        {
            used_addr--;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRangePool::free_addr_by_ip6(PoolObjectSQL::ObjectType ot, int obid,
                                        const string& ip_s)
{
    for (auto it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        if (it->second->free_addr_by_ip6(ot, obid, ip_s) == 0)
        {
            used_addr--;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::free_addr_by_owner(PoolObjectSQL::ObjectType ot, int oid)
{
    unsigned int used_addr_ini = used_addr;

    for (auto it=ar_pool.begin(); it!=ar_pool.end(); it++)
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
    unsigned int freed = 0;

    auto it = ar_pool.find(arid);

    if (it!=ar_pool.end())
    {
        freed = it->second->free_addr_by_range(ot, obid, mac, rsize);

        used_addr -= freed;
    }

    return freed;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::get_attribute(const string& name, string& value,
                                    int ar_id) const
{
    auto it = ar_pool.find(ar_id);

    value.clear();

    if (it!=ar_pool.end())
    {
        return it->second->get_attribute(name, value);
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::get_attribute(const string& name, int& value,
                                    int ar_id) const
{
    auto it = ar_pool.find(ar_id);

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
    auto it = ar_pool.find(ar_id);

    if (it == ar_pool.end())
    {
        static set<int> empty_set;

        return empty_set;
    }

    return it->second->get_security_groups();
}

void AddressRangePool::get_all_security_groups(set<int>& sgs) const
{
    for (auto it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        it->second->get_security_groups(sgs);
    }
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
    unsigned int total = 0;

    for (auto it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        total += it->second->get_size();
    }

    return total;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::hold_by_ip(unsigned int ar_id, const string& ip_s)
{
    auto it = ar_pool.find(ar_id);

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
    int rc = -1;

    for (auto it=ar_pool.begin(); it!=ar_pool.end(); it++)
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

int AddressRangePool::hold_by_ip6(unsigned int ar_id, const string& ip_s)
{
    auto it = ar_pool.find(ar_id);

    if (it == ar_pool.end())
    {
        return -1;
    }

    int rc = it->second->hold_by_ip6(ip_s);

    if (rc == 0)
    {
        used_addr++;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangePool::hold_by_ip6(const string& ip_s)
{
    int rc = -1;

    for (auto it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        if (it->second->hold_by_ip6(ip_s) == 0) //At least one AR hold the IP
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
    auto it = ar_pool.find(ar_id);

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
    int rc = -1;

    for (auto it=ar_pool.begin(); it!=ar_pool.end(); it++)
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
    for (auto it=ar_pool.begin(); it!=ar_pool.end(); it++)
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
    auto it = ar_pool.find(ar_id);

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
    auto it = ar_pool.find(ar_id);

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
    auto it = ar_pool.find(ar_id);

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

int AddressRangePool::reserve_addr_by_ip6(int vid, unsigned int rsize,
                                          unsigned int ar_id, const string& ip, AddressRange *rar)
{
    auto it = ar_pool.find(ar_id);

    if (it == ar_pool.end())
    {
        return -1;
    }

    if (it->second->reserve_addr_by_ip6(vid, rsize, ip, rar) == 0)
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
    for (auto it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        VectorAttribute* new_rule = new VectorAttribute(
                "SECURITY_GROUP_RULE", rule->value());

        it->second->process_security_rule(new_rule);

        new_rules.push_back(new_rule);
    }
}
