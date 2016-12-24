/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#include <vector>
#include <map>

#include "Attribute.h"
#include "Template.h"

/**
 *  This class represents a generic VirtualMachine attribute, it exposes the
 *  basic VectorAttribute interface and can be decorated with functionality
 *  for an specific class, (e.g. disks or nics).
 *
 *  The attribute operates directly on the VirtualMachineTemplate attribute. IT
 *  IS NOT CLONED OR COPIED
 */
class VirtualMachineAttribute: public Attribute
{
public:
    /**
     *  Return the associated VectorAttribute to interface with vector attribute
     *  functions
     */
    VectorAttribute * vector_attribute()
    {
        return va;
    }

    /* ---------------------------------------------------------------------- */
    /* VectorAttribute Interface                                              */
    /* ---------------------------------------------------------------------- */
    template<typename T>
    int vector_value(const std::string& name, T& value) const
    {
        return va->vector_value(name, value);
    }

    string vector_value(const std::string& name) const
    {
        return va->vector_value(name);
    }

    template<typename T>
    void replace(const std::string& name, T value)
    {
        va->replace(name, value);
    }

    void remove(const std::string& name)
    {
        va->remove(name);
    }


    void merge(VectorAttribute* vattr, bool replace)
    {
        va->merge(vattr, replace);
    }

protected:
    /**
     *  Creates the attribute with a reference to a VectorAttribute. The object
     *  is shared and WILL BE modified through this interface.
     *    @param va pointer to the VectorAttribute.
     */
    VirtualMachineAttribute(VectorAttribute *_va):
        Attribute(_va->name()) ,va(_va), id(-1) {};

    VirtualMachineAttribute(VectorAttribute *_va, int _id):
        Attribute(_va->name()) ,va(_va), id(_id) {};

    virtual ~VirtualMachineAttribute(){};

    /* ---------------------------------------------------------------------- */
    /* Attribute Interface                                                    */
    /* ---------------------------------------------------------------------- */
    string * marshall(const char * _sep = 0) const
    {
        return va->marshall(_sep);
    };

    string * to_xml() const
    {
        return va->to_xml();
    };

    void unmarshall(const std::string& sattr, const char * _sep = 0)
    {
        va->unmarshall(sattr, _sep);
    }

    AttributeType type()
    {
        return va->type();
    };

    Attribute* clone() const
    {
        return va->clone();
    };

    /* ---------------------------------------------------------------------- */
    /* VirtualMachineAttribute Interface                                      */
    /* ---------------------------------------------------------------------- */
    /**
     *  Sets the flag in the attribute in the form (FLAG="YES")
     */
    void set_flag(const string& flag)
    {
        replace(flag, true);
    };

    /**
     *  Clears a previously set flag
     */
    void clear_flag(const string& flag)
    {
        remove(flag);
    };

    bool is_flag(const string& flag) const
    {
        bool value;

        va->vector_value(flag, value);

        return value;
    }

    int get_id() const
    {
        return id;
    }

private:

    /* ---------------------------------------------------------------------- */
    /* ---------------------------------------------------------------------- */
    friend class VirtualMachineAttributeSet;

    /* ---------------------------------------------------------------------- */
    /* ---------------------------------------------------------------------- */
    /**
     *  The associated VectorAttribute
     */
    VectorAttribute * va;

    /**
     *  Set if the attribute can be addressed by an identifier, -1 otherwise
     */
    int id;
};

/**
 *  This class represents a set of VirtualMachineAttributes it provides fast
 *  access to individual elements (by ID) and implement collective operations
 */
class VirtualMachineAttributeSet
{
protected:
    /**
     *  Creates the VirtualMachineAttribute set
     *    @param dispose elements upon set destruction
     */
    VirtualMachineAttributeSet(bool _dispose):dispose(_dispose){};

    virtual ~VirtualMachineAttributeSet();

    /* ---------------------------------------------------------------------- */
    /* Methods to access attributes                                           */
    /* ---------------------------------------------------------------------- */
    /**
     *  @return attribute by id or 0 if not found
     */
    VirtualMachineAttribute * get_attribute(int id) const;

    /**
     *  @return attribute with the given flag set or 0 if not found
     */
    VirtualMachineAttribute * get_attribute(const string& flag) const;

    /**
     *  Deletes the attribute with the given flag set.
     *  @return Pointer to the attribute or 0 if not found
     */
    VirtualMachineAttribute * remove_attribute(const string& flag);

    /**
     *  Sets flag in a VirtualMachineAttribute
     *    @param a_id of the attribute
     *    @param flag_name
     *    @return 0 on success
     */
    int set_flag(int a_id, const string& flag_name);

    /**
     *  Clears the flag from the VirtualMachineAttributes in the set.
     *    @return the attribute for which the flag was cleared, 0 if none
     */
    VirtualMachineAttribute * clear_flag(const string& flag_name);

    /* ---------------------------------------------------------------------- */
    /* Iterators                                                              */
    /* ---------------------------------------------------------------------- */
    /**
     *  Generic iterator for the set. Wraps the STL iterator for map, can be
     *  used to iterate over the attributes
     */
    class AttributeIterator
    {
    public:
        AttributeIterator& operator=(const AttributeIterator& rhs)
        {
            map_it = rhs.map_it;
            return *this;
        }

        AttributeIterator& operator++()
        {
            ++map_it;
            return *this;
        }

        bool operator!=(const AttributeIterator& rhs)
        {
            return map_it != rhs.map_it;
        }

        AttributeIterator(){};
        AttributeIterator(const AttributeIterator& ait):map_it(ait.map_it){};
        AttributeIterator(const std::map<int,
                VirtualMachineAttribute *>::iterator& _map_it):map_it(_map_it){};

        virtual ~AttributeIterator(){};

    protected:
        std::map<int, VirtualMachineAttribute *>::iterator map_it;
    };

    AttributeIterator begin()
    {
        AttributeIterator it(a_set.begin());
        return it;
    }

    AttributeIterator end()
    {
        AttributeIterator it(a_set.end());
        return it;
    }

    typedef class AttributeIterator attribute_iterator;

    /* ---------------------------------------------------------------------- */
    /* Attribute map interface                                                */
    /* ---------------------------------------------------------------------- */
    /**
     *  Adds a new VirtualMachine attribute to the set
     */
    void add_attribute(VirtualMachineAttribute * a, int id)
    {
        a_set.insert(make_pair(id, a));
    }

    /**
     *  Init the attribute set from a vector
     *    @param id_name with the ID of the attribute
     *    @param auto_ids automatically generate ids for the attributes
     *    @param vas vector of attribute to use
     */
    void init_attribute_map(const std::string& id_name,
            std::vector<VectorAttribute *>& vas);
    /**
     *  Abstract method to create the VirtualMachineAttributes for this set
     */
    virtual VirtualMachineAttribute * attribute_factory(VectorAttribute * va,
            int id) const = 0;

    /* ---------------------------------------------------------------------- */
    /* ---------------------------------------------------------------------- */

    /**
     *  Map with the disk attributes
     */
    std::map<int, VirtualMachineAttribute *> a_set;

    /**
     *  Frees the VectorAttribute associated with each VirtualMachineAttribute
     *  upon object destruction
     */
    bool dispose;
};

#endif  /*VIRTUAL_MACHINE_ATTRIBUTE_H_*/
