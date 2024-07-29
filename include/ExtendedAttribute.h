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

#ifndef EXTENDED_ATTRIBUTE_H_
#define EXTENDED_ATTRIBUTE_H_

#include <vector>
#include <map>

#include "Attribute.h"
#include "Template.h"

/**
 *  This class represents a generic attribute, it exposes the basic
 *  VectorAttribute interface and can be decorated with functionality
 *  for an specific class.
 *
 *  The attribute operates directly on the OriginalTemplate attribute. IT
 *  IS NOT CLONED OR COPIED
 */
class ExtendedAttribute: public Attribute
{
public:
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

    std::string vector_value(const std::string& name)
    {
        return va->vector_value(name);
    }

    const std::string& vector_value(const std::string& name) const
    {
        return const_cast<const VectorAttribute*>(va)->vector_value(name);
    }

    template<typename T>
    void replace(const std::string& name, const T& value)
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

    /* ---------------------------------------------------------------------- */
    /* Attribute Interface                                                    */
    /* ---------------------------------------------------------------------- */
    std::string marshall(const char * _sep = 0) const  override
    {
        return va->marshall(_sep);
    };

    void to_xml(std::ostringstream& s) const override
    {
        return va->to_xml(s);
    };

    void to_json(std::ostringstream& s) const override
    {
        return va->to_json(s);
    };

    void to_xml(std::ostringstream& s,
                const std::map<std::string, std::set<std::string>> &hidden) const override
    {
        return va->to_xml(s, hidden);
    }

protected:
    /**
     *  Creates the attribute with a reference to a VectorAttribute. The object
     *  is shared and WILL BE modified through this interface.
     *    @param va pointer to the VectorAttribute.
     */
    ExtendedAttribute(VectorAttribute *_va):
        Attribute(_va->name()), va(_va), id(-1) {};

    ExtendedAttribute(VectorAttribute *_va, int _id):
        Attribute(_va->name()), va(_va), id(_id) {};

    virtual ~ExtendedAttribute() {};

    /* ---------------------------------------------------------------------- */
    /* Attribute Interface                                                    */
    /* ---------------------------------------------------------------------- */
    void unmarshall(const std::string& sattr, const char * _sep = 0) override
    {
        va->unmarshall(sattr, _sep);
    }

    AttributeType type() const override
    {
        return va->type();
    }

    Attribute* clone() const override
    {
        return va->clone();
    }

    /* ---------------------------------------------------------------------- */
    /* ExtendedAttribute Interface                                            */
    /* ---------------------------------------------------------------------- */
    int get_id() const
    {
        return id;
    }

private:

    /* ---------------------------------------------------------------------- */
    /* ---------------------------------------------------------------------- */
    friend class ExtendedAttributeSet;

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
 *  This class represents a set of ExtendedAttributes it provides fast
 *  access to individual elements (by ID) and implement collective operations
 */
class ExtendedAttributeSet
{
protected:
    /**
     *  Creates the ExtenededAttribute set
     *    @param dispose elements upon set destruction
     */
    ExtendedAttributeSet(bool _dispose):dispose(_dispose) {};

    virtual ~ExtendedAttributeSet();

    /* ---------------------------------------------------------------------- */
    /* Method to access attributes                                            */
    /* ---------------------------------------------------------------------- */
    /**
     *  @return attribute by id or nullptr if not found
     */
    ExtendedAttribute * get_attribute(int id) const;

    /**
     *  @return last_attribute or nullptr if empty set
     */
    ExtendedAttribute * last_attribute() const;

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

        AttributeIterator() {};
        AttributeIterator(const AttributeIterator& ait):map_it(ait.map_it) {};
        AttributeIterator(const std::map<int,
                          ExtendedAttribute *>::iterator& _map_it):map_it(_map_it) {};

        virtual ~AttributeIterator() {};

    protected:
        std::map<int, ExtendedAttribute *>::iterator map_it;
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
     *    @param a the Extended attribute to add
     *    @param id of the new attribute
     */
    void add_attribute(ExtendedAttribute * a, int id)
    {
        a_set.insert(std::make_pair(id, a));
    }

    /**
     *  Deletes an attribute from the set
     *    @param id of the attribute
     *    @return the attribute removed or 0 if not found
     */
    ExtendedAttribute * delete_attribute(int id);

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
    virtual ExtendedAttribute * attribute_factory(VectorAttribute * va,
                                                  int id) const = 0;

    /**
     *  @return the number of elements in the set
     */
    unsigned int size()
    {
        return a_set.size();
    }

    /* ---------------------------------------------------------------------- */
    /* ---------------------------------------------------------------------- */

    /**
     *  Map with the disk attributes
     */
    std::map<int, ExtendedAttribute *> a_set;

    /**
     *  Frees the VectorAttribute associated with each VirtualMachineAttribute
     *  upon object destruction
     */
    bool dispose;
};

#endif  /*VIRTUAL_MACHINE_ATTRIBUTE_H_*/
