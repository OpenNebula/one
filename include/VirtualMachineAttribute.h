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

#ifndef VIRTUAL_MACHINE_ATTRIBUTE_H_
#define VIRTUAL_MACHINE_ATTRIBUTE_H_

#include "ExtendedAttribute.h"

/**
 *  This class represents a generic VirtualMachine attribute, it exposes the
 *  basic VectorAttribute interface and can be decorated with functionality
 *  for an specific class, (e.g. disks or nics).
 *
 *  The attribute operates directly on the VirtualMachineTemplate attribute. IT
 *  IS NOT CLONED OR COPIED
 */
class VirtualMachineAttribute: public ExtendedAttribute
{
protected:
    /**
     *  Creates the attribute with a reference to a VectorAttribute. The object
     *  is shared and WILL BE modified through this interface.
     *    @param va pointer to the VectorAttribute.
     */
    VirtualMachineAttribute(VectorAttribute *_va):
        ExtendedAttribute(_va) {};

    VirtualMachineAttribute(VectorAttribute *_va, int _id):
        ExtendedAttribute(_va, _id) {};

    virtual ~VirtualMachineAttribute() {};

    /* ---------------------------------------------------------------------- */
    /* VirtualMachineAttribute Interface                                      */
    /* ---------------------------------------------------------------------- */
    /**
     *  Sets the flag in the attribute in the form (FLAG="YES")
     */
    void set_flag(const std::string& flag)
    {
        replace(flag, true);
    };

    /**
     *  Clears a previously set flag
     */
    void clear_flag(const std::string& flag)
    {
        remove(flag);
    };

    bool is_flag(const std::string& flag) const
    {
        bool value;

        vector_value(flag, value);

        return value;
    }

private:
    friend class VirtualMachineAttributeSet;
};

/**
 *  This class represents a set of VirtualMachineAttributes it provides fast
 *  access to individual elements (by ID) and implement collective operations
 */
class VirtualMachineAttributeSet : public ExtendedAttributeSet
{
protected:
    /**
     *  Creates the VirtualMachineAttribute set
     *    @param dispose elements upon set destruction
     */
    VirtualMachineAttributeSet(bool _dispose):ExtendedAttributeSet(_dispose) {};

    virtual ~VirtualMachineAttributeSet() {};

    /* ---------------------------------------------------------------------- */
    /* Methods to access attributes                                           */
    /* ---------------------------------------------------------------------- */
    /**
     *  @return attribute by id or 0 if not found
     */
    VirtualMachineAttribute * get_attribute(int id) const
    {
        return static_cast<VirtualMachineAttribute *>(
                       ExtendedAttributeSet::get_attribute(id));
    }

    /**
     *  @return attribute with the given flag set or 0 if not found
     */
    VirtualMachineAttribute * get_attribute(const std::string& flag) const;

    /**
     *  Deletes the attribute with the given flag set.
     *  @return Pointer to the attribute or 0 if not found
     */
    VirtualMachineAttribute * remove_attribute(const std::string& flag);

    /**
     *  Sets flag in a VirtualMachineAttribute
     *    @param a_id of the attribute
     *    @param flag_name
     *    @return 0 on success
     */
    int set_flag(int a_id, const std::string& flag_name);

    /**
     *  Clears the flag from the VirtualMachineAttributes in the set.
     *    @return the attribute for which the flag was cleared, 0 if none
     */
    VirtualMachineAttribute * clear_flag(const std::string& flag_name);
};

#endif  /*VIRTUAL_MACHINE_ATTRIBUTE_H_*/
