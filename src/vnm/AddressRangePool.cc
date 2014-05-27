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

AddressRange * AddressRangePool::allocate_ar()
{
    AddressRange * ar = new AddressRange(next_ar);

    ar_pool.insert(make_pair(next_ar++, ar));

    return ar;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRangePool::update_ar(vector<Attribute *> ars)
{
    vector<Attribute *>::iterator               it;
    map<unsigned int, AddressRange *>::iterator ar_it;

    unsigned int arid;

    for (it = ars.begin(); it != ars.end(); it++)
    {
        VectorAttribute * va = static_cast<VectorAttribute *>(*it);

        if (va == 0)
        {
            continue;
        }

        if (va->vector_value("AR_ID", arid) != 0)
        {
            continue;
        }

        ar_it = ar_pool.find(arid);

        if (ar_it == ar_pool.end())
        {
            continue;
        }

        ar_it->second->update_attributes(va);
    }
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
        VectorAttribute *ar = static_cast<VectorAttribute *>(*it_ar);

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

void AddressRangePool::free_addr_by_owner(PoolObjectSQL::ObjectType ot, int oid)
{
    map<unsigned int, AddressRange *>::iterator it;

    for (it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        used_addr = used_addr - it->second->free_addr_by_owner(ot, oid);
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

int AddressRangePool::reserve_addr(int pvid, int vid, unsigned int rsize,
    AddressRange *rar)
{
    map<unsigned int, AddressRange *>::iterator it;

    for (it=ar_pool.begin(); it!=ar_pool.end(); it++)
    {
        if ((it->second->get_free_addr() >= rsize) &&
            (it->second->reserve_addr(pvid, vid, rsize, rar) == 0))
        {
            used_addr += rsize;
            return 0;
        }
    }

    return -1;
}
