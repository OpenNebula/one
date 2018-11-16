/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#ifndef VIRTUAL_MACHINE_NIC_H_
#define VIRTUAL_MACHINE_NIC_H_

#include "VirtualMachineAttribute.h"
#include "PoolObjectSQL.h"

class AuthRequest;

/**
 * The VirtualMachine NIC attribute
 */
class VirtualMachineNic : public VirtualMachineAttribute
{
public:
    VirtualMachineNic(VectorAttribute *va, int id):
        VirtualMachineAttribute(va, id){};

    virtual ~VirtualMachineNic(){};

    /* ---------------------------------------------------------------------- */
    /* DISK get/set functions for boolean disk flags                          */
    /*   ATTACH                                                               */
    /* ---------------------------------------------------------------------- */
    void set_attach()
    {
        set_flag("ATTACH");
    };

    /* ---------------------------------------------------------------------- */
    /* Disk attributes, not accesible through vector_value                    */
    /* ---------------------------------------------------------------------- */
    /**
     *  Return the disk id ("NIC_ID")
     */
    int get_nic_id() const
    {
        return get_id();
    }

    /**
     * Returns a set of the security group IDs of this NIC
     *    @param nic NIC to get the security groups from
     *    @param sgs a set of security group IDs
     */
    void get_security_groups(set<int>& sgs) const
    {
        one_util::split_unique(vector_value("SECURITY_GROUPS"), ',', sgs);
    }

    /**
     *  Get the effective uid to get the VirtualNetwork.
     */
    int get_uid(int _uid, string& error);

    /* ---------------------------------------------------------------------- */
    /* Network Manager Interface                                                */
    /* ---------------------------------------------------------------------- */
    /**
     *  Fills the authorization request for this NIC based on the VNET and SG
     *  requirements
     *    @param uid of user making the request
     *    @param ar auth request
     *    @param  check_lock for check if the resource is lock or not
     */
    void authorize(int uid, AuthRequest* ar, bool check_lock)
    {
        authorize(PoolObjectSQL::VM, uid, ar, check_lock);
    }

    void authorize_vrouter(int uid, AuthRequest* ar, bool check_lock)
    {
        authorize(PoolObjectSQL::VROUTER, uid, ar, check_lock);
    }

    /**
     *  Releases the network leases and SGs associated to this NIC
     *    @param vmid of the VM
     *    @return 0 if resources has been freed
     */
    int release_network_leases(int vmid);

    /**
     *  Marshall disk attributes in XML format with just essential information
     *    @param stream to write the disk XML description
     */
    void to_xml_short(std::ostringstream& oss) const;

private:
    /**
     *  Fills the authorization request for this NIC based on the VNET and SG
     *  requirements
     *    @param ot the object type making the auth request
     *    @param uid of user making the request
     *    @param ar auth request
     */
    void authorize(PoolObjectSQL::ObjectType ot, int uid, AuthRequest* ar,
                    bool check_lock);
};


/**
 *  Set of VirtualMachine NIC
 */
class VirtualMachineNics : public VirtualMachineAttributeSet
{
public:
    /* ---------------------------------------------------------------------- */
    /* Constructor and Initialization functions                               */
    /* ---------------------------------------------------------------------- */
    /**
     *  Creates the VirtualMachineNIC set from a Template with NIC=[...]
     *  attributes
     *    @param tmpl template with DISK
     *    @param has_id to use the ID's in NIC=[NIC_ID=...] or autogenerate
     */
    VirtualMachineNics(Template * tmpl):
        VirtualMachineAttributeSet(false)
    {
        std::vector<VectorAttribute *> vas;
        std::vector<VectorAttribute *> pcis;
        std::vector<VectorAttribute *>::iterator it;

        tmpl->get(NIC_NAME, vas);

        tmpl->get("PCI", pcis);

        for ( it=pcis.begin(); it != pcis.end() ; ++it)
        {
            if ( (*it)->vector_value("TYPE") == "NIC" )
            {
                vas.push_back(*it);
            }
        }

        init(vas, false);
    };

    /**
     *  Creates the VirtualMachineNic set from a vector of NIC VectorAttribute
     *    @param va vector of NIC VectorAttribute
     *    @param has_id to use the ID's in NIC=[NIC_ID=...] or autogenerate
     *    @param dispose true to delete the VectorAttributes when the set is
     *    destroyed
     */
    VirtualMachineNics(vector<VectorAttribute *>& va, bool has_id, bool dispose):
        VirtualMachineAttributeSet(dispose)
    {
        init(va, has_id);
    };

    /**
     *  Creates an empty nic set
     */
    VirtualMachineNics(bool dispose):
        VirtualMachineAttributeSet(dispose){};

    virtual ~VirtualMachineNics(){};

    /**
     *  Function used to initialize the attribute map based on a vector of NIC
     */
    void init(std::vector<VectorAttribute *>& vas, bool has_id)
    {
        if ( has_id )
        {
            init_attribute_map(NIC_ID_NAME, vas);
        }
        else
        {
            init_attribute_map("", vas);
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Iterators                                                              */
    /* ---------------------------------------------------------------------- */
    /**
     *  Generic iterator for the nic set.
     */
    class NicIterator : public AttributeIterator
    {
    public:
        NicIterator():AttributeIterator(){};
        NicIterator(const AttributeIterator& dit):AttributeIterator(dit){};
        virtual ~NicIterator(){};

        VirtualMachineNic * operator*() const
        {
            return static_cast<VirtualMachineNic *>(map_it->second);
        }
    };

    NicIterator begin()
    {
        NicIterator it(ExtendedAttributeSet::begin());
        return it;
    }

    NicIterator end()
    {
        NicIterator it(ExtendedAttributeSet::end());
        return it;
    }

    typedef class NicIterator nic_iterator;

    /* ---------------------------------------------------------------------- */
    /* NIC interface                                                          */
    /* ---------------------------------------------------------------------- */
    /**
     * Returns the NIC attribute for a disk
     *   @param nic_id of the NIC
     *   @return pointer to the attribute ir null if not found
     */
    VirtualMachineNic * get_nic(int nic_id) const
    {
        return static_cast<VirtualMachineNic *>(get_attribute(nic_id));
    }

    /**
     * Returns a set of the security group IDs in use in this set.
     *     @param sgs a set of security group IDs
     */
    void get_security_groups(set<int>& sgs);

    /* ---------------------------------------------------------------------- */
    /* Network Manager Interface                                              */
    /* ---------------------------------------------------------------------- */
    /**
     *  Get all nic for this Virtual Machine
     *  @param vm_id of the VirtualMachine
     *  @param uid of owner
     *  @param nics list of NIC Attribute and PCI(TYPE=NIC) in VM template
     *  @param nic_default attribute, 0 if none
     *  @param sgs list of SG rules to add to the VM for this NICs
     *  @param error_str Returns the error reason, if any
     *  @return 0 if success
     */
    int get_network_leases(int vm_id, int uid, std::vector<Attribute *> nics,
            VectorAttribute * nic_default, std::vector<VectorAttribute *>& sgs,
            std::string& estr);

    int get_auto_network_leases(int vm_id, int uid, VectorAttribute * nic_default, 
            vector<VectorAttribute*>& sgs, std::string& error_str);

    /**
     *  Release all the network leases and SG associated to the set
     *    @param vmid of the VM
     */
    void release_network_leases(int vmid);

    /* ---------------------------------------------------------------------- */
    /* Attach nic interface                                                   */
    /* ---------------------------------------------------------------------- */
    /**
     *  Clear attach status from the attach nic (ATTACH=YES) and removes disk
     *  from the set
     */
    VirtualMachineNic * delete_attach()
    {
        return static_cast<VirtualMachineNic *>(remove_attribute("ATTACH"));
    }

    /**
     *  Clear attach status from the attach disk (ATTACH=YES)
     */
    VirtualMachineNic * clear_attach()
    {
        return static_cast<VirtualMachineNic *>(clear_flag("ATTACH"));
    }

    /**
     *  Get the attach nic (ATTACH=YES)
     */
    VirtualMachineNic * get_attach()
    {
        return static_cast<VirtualMachineNic *>(get_attribute("ATTACH"));
    }

    /**
     *  Setup a nic for attachment
     *    @param vm_id of the VirtualMachine
     *    @param uid of owner
     *    @param cluster_id associated to the VM
     *    @param vnic the new nic in vector attribute
     *    @param nic_default attribute, 0 if none
     *    @param sgs list of SG rules to add to the VM for this NIC
     *    @param error_str Returns the error reason, if any
     *    @return 0 if success
     */
    int set_up_attach_nic(int vmid, int uid, int cluster_id,
        VectorAttribute * vnic, VectorAttribute * nic_default,
        vector<VectorAttribute*>& sgs, std::string& error_str);
    /**
     *  Marshall NICs in XML format with just essential information
     *    @param xml string to write the NIC XML description
     */
    std::string& to_xml_short(std::string& xml);

protected:

    VirtualMachineAttribute * attribute_factory(VectorAttribute * va,
        int id) const
    {
        return new VirtualMachineNic(va, id);
    };

private:
    static const char * NIC_NAME; //"NIC"

    static const char * NIC_ID_NAME; //"NIC_ID"
};

#endif  /*VIRTUAL_MACHINE_NIC_H_*/

