/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#ifndef VIRTUAL_MACHINE_PCI_H_
#define VIRTUAL_MACHINE_PCI_H_

#include "VirtualMachineAttribute.h"
#include "PoolObjectSQL.h"

class AuthRequest;

/**
 * The VirtualMachine PCI attribute
 */
class VirtualMachinePCI : public VirtualMachineAttribute
{
public:
    VirtualMachinePCI(VectorAttribute *va, int id):
        VirtualMachineAttribute(va, id){};

    virtual ~VirtualMachinePCI(){};

    /* ---------------------------------------------------------------------- */
    /* PCI get/set functions for boolean disk flags                           */
    /*   ATTACH                                                               */
    /* ---------------------------------------------------------------------- */
    void set_attach()
    {
        set_flag("ATTACH");
    };

    /* ---------------------------------------------------------------------- */
    /* PCI attributes                                                         */
    /* ---------------------------------------------------------------------- */
    /**
     *  Return the disk id ("PCI_ID")
     */
    int get_pci_id() const
    {
        return get_id();
    }

    /**
     * Check if a nic is alias or not
     */
    bool is_alias() const
    {
        return name() == "NIC_ALIAS";
    }

    /**
     * Check if a nic is a PCI
     */
    bool is_nic() const
    {
        std::string type;

        if (vector_value("TYPE", type) != 0)
        {
            return false;
        }

        one_util::toupper(type);

        return type == "NIC";
    }

};


/**
 *  Set of VirtualMachine NIC
 */
class VirtualMachinePCIs : public VirtualMachineAttributeSet
{
public:
    /* ---------------------------------------------------------------------- */
    /* Constructor and Initialization functions                               */
    /* ---------------------------------------------------------------------- */
    /**
     *  Creates the VirtualMachinePCI set from a Template with PCI=[...]
     *  attributes
     *    @param tmpl template with PCI
     *    @param has_id to use the ID's in PCI=[PCI_ID=...] or autogenerate
     */
    VirtualMachinePCIs(Template * tmpl):
        VirtualMachineAttributeSet(false)
    {
        std::vector<VectorAttribute *> pcis;

        tmpl->get(PCI_NAME, pcis);

        for (auto it = pcis.begin(); it !=  pcis.end(); )
        {
            if ( (*it)->vector_value("TYPE") != "NIC" )
            {
                it = pcis.erase(it);
            }
            else
            {
                ++it;
            }
        }

        init(pcis, false);
    };

    /**
     *  Creates the VirtualMachineNic set from a vector of NIC VectorAttribute
     *    @param va vector of NIC VectorAttribute
     *    @param has_id to use the ID's in NIC=[NIC_ID=...] or autogenerate
     *    @param dispose true to delete the VectorAttributes when the set is
     *    destroyed
     */
    VirtualMachinePCIs(std::vector<VectorAttribute *>& va, bool has_id, bool dispose):
        VirtualMachineAttributeSet(dispose)
    {
        init(va, has_id);
    };

    /**
     *  Creates an empty nic set
     */
    VirtualMachinePCIs(bool dispose):
        VirtualMachineAttributeSet(dispose){};

    virtual ~VirtualMachinePCIs(){};

    /**
     *  Function used to initialize the attribute map based on a vector of NIC
     */
    void init(std::vector<VectorAttribute *>& vas, bool has_id)
    {
        if ( has_id )
        {
            init_attribute_map(PCI_ID_NAME, vas);
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
    class PCIIterator : public AttributeIterator
    {
    public:
        PCIIterator():AttributeIterator(){};
        PCIIterator(const AttributeIterator& dit):AttributeIterator(dit){};
        virtual ~PCIIterator(){};

        VirtualMachinePCI * operator*() const
        {
            return static_cast<VirtualMachinePCI *>(map_it->second);
        }
    };

    PCIIterator begin()
    {
        PCIIterator it(ExtendedAttributeSet::begin());
        return it;
    }

    PCIIterator end()
    {
        PCIIterator it(ExtendedAttributeSet::end());
        return it;
    }

    typedef class PCIIterator pci_iterator;

    /* ---------------------------------------------------------------------- */
    /* NIC interface                                                          */
    /* ---------------------------------------------------------------------- */
    /**
     * Returns the PCI attribute for a network interface
     *   @param pci_id of the PCI
     *   @return pointer to the attribute ir null if not found
     */
    VirtualMachinePCI * get_pci(int pci_id) const
    {
        return static_cast<VirtualMachinePCI *>(get_attribute(pci_id));
    }

    /* ---------------------------------------------------------------------- */
    /* Attach PCI interface                                                   */
    /* ---------------------------------------------------------------------- */
    /**
     *  Clear attach status from the attach PCI (ATTACH=YES) and removes PCI
     *  from the set
     */
    VirtualMachinePCI * delete_attach()
    {
        return static_cast<VirtualMachinePCI *>(remove_attribute("ATTACH"));
    }

    /**
     *  Clear attach status from the attach PCI (ATTACH=YES)
     */
    VirtualMachinePCI * clear_attach()
    {
        return static_cast<VirtualMachinePCI *>(clear_flag("ATTACH"));
    }

    /**
     *  Get the attach PCI (ATTACH=YES)
     */
    VirtualMachinePCI * get_attach()
    {
        return static_cast<VirtualMachinePCI *>(get_attribute("ATTACH"));
    }

protected:

    VirtualMachineAttribute * attribute_factory(VectorAttribute * va,
        int id) const
    {
        return new VirtualMachinePCI(va, id);
    };

private:
    static const char * PCI_NAME; //"PCI"

    static const char * PCI_ID_NAME; //"PCI_ID"
};

#endif  /*VIRTUAL_MACHINE_PCI_H_*/

