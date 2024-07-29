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

#ifndef ATTRIBUTE_H_
#define ATTRIBUTE_H_

#include <string>
#include <map>
#include <sstream>
#include <algorithm>

#include "NebulaUtil.h"

/**
 *  Attribute base class for name-value pairs. This class provides a generic
 *  interface to implement
 */
class Attribute
{
public:

    Attribute(const std::string& aname)
        : attribute_name(aname)
    {
        one_util::toupper(attribute_name);

        // FIX Attribute name if it does not conform XML element
        // naming conventions

        int size = attribute_name.size();

        if  ((size >0 && !(isalpha(aname[0]) || aname[0] == '_')) ||
             (size >=3 && (aname[0]=='X' && aname[1]=='M' && aname[2]=='L')))
        {
            attribute_name.insert(0, "ONE_");
        }
    };

    virtual ~Attribute() {};

    enum AttributeType
    {
        SIMPLE = 0,
        VECTOR = 1
    };

    /**
     *  Gets the name of the attribute.
     *    @return the attribute name
     */
    const std::string& name() const
    {
        return attribute_name;
    };

    /**
     *  Marshall the attribute in a single string.
     *    @return a string holding the attribute value.
     */
    virtual std::string marshall(const char * _sep = 0) const = 0;

    /**
     *  Write the attribute using a simple XML format.
     */
    virtual void to_xml(std::ostringstream& s) const = 0;

    virtual void to_json(std::ostringstream& s) const = 0;

    virtual void to_xml(std::ostringstream& s,
                        const std::map<std::string, std::set<std::string>> &hidden) const = 0;

    /**
     *  Builds a new attribute from a string.
     */
    virtual void unmarshall(const std::string& sattr, const char * _sep = 0) = 0;

    /**
     *  Returns the attribute type
     */
    virtual AttributeType type() const = 0;

    /**
     *  Clones the current attribute
     */
    virtual Attribute* clone() const = 0;

    /**
     *  Encrypt all secret attributes
     */
    virtual void encrypt(const std::string& one_key, const std::set<std::string>& eas) {};

    /**
     *  Decrypt all secret attributes
     */
    virtual void decrypt(const std::string& one_key, const std::set<std::string>& eas) {};

protected:

    /**
     *  The attribute name.
     */
    std::string attribute_name;

    static const std::string EMPTY_ATTRIBUTE;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The SingleAttribute class represents a simple attribute in the form
 *  NAME = VALUE.
 */

class SingleAttribute : public Attribute
{
public:

    SingleAttribute(const std::string& name)
        : Attribute(name)
    {}

    SingleAttribute(const std::string& name, const std::string& value)
        : Attribute(name)
        , attribute_value(value)
    {}

    SingleAttribute(const SingleAttribute& sa)
        : Attribute(sa.attribute_name)
        , attribute_value(sa.attribute_value)
    {}

    ~SingleAttribute() {};

    /**
     *  Returns the attribute value, a string.
     */
    const std::string& value() const
    {
        return attribute_value;
    };

    /**
     *  Marshall the attribute in a single string.
     *    @return a string holding the attribute value.
     */
    std::string marshall(const char * _sep = 0) const override
    {
        return attribute_value;
    };

    /**
     *  Write the attribute using a simple XML format:
     *
     *  <attribute_name>attribute_value</attribute_name>
     *
     *  @paran s the stream to write the attribute.
     *
     *  NOTE: For Simple attributes hidden are in the form { "PORT". {} }
     *  A hidden attribute is rendered as ***
     */
    void to_xml(std::ostringstream& s) const override
    {
        s << "<" << attribute_name << ">" << one_util::escape_xml(attribute_value)
          << "</"<< attribute_name << ">";

    }

    void to_xml(std::ostringstream& s,
                const std::map<std::string, std::set<std::string>> &hidden) const override
    {
        s << "<" << attribute_name << ">";

        if (hidden.find(attribute_name) != hidden.end() )
        {
            s << "***";
        }
        else
        {
            s << one_util::escape_xml(attribute_value);
        }

        s << "</"<< attribute_name << ">";
    }

    void to_json(std::ostringstream& s) const override
    {
        one_util::escape_json(attribute_value, s);
    }

    /**
     *  Builds a new attribute from a string.
     */
    void unmarshall(const std::string& sattr, const char * _sep = 0) override
    {
        attribute_value = sattr;
    };

    /**
     *  Replaces the attribute value from a string.
     */
    void replace(const std::string& sattr)
    {
        attribute_value = sattr;
    };

    /**
     *  Returns the attribute type
     */
    AttributeType type() const override
    {
        return SIMPLE;
    };

    /**
     *  Clones the current attribute
     */
    Attribute* clone() const override
    {
        return new SingleAttribute(*this);
    };

    /**
     *  Encrypt all secret attributes
     */
    void encrypt(const std::string& one_key,
                 const std::set<std::string>& eas) override;

    /**
     *  Decrypt all secret attributes
     */
    void decrypt(const std::string& one_key,
                 const std::set<std::string>& eas) override;

private:

    std::string attribute_value;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The VectorAttribute class represents an array attribute in the form
 *  NAME = [ VAL_NAME_1=VAL_VALUE_1,...,VAL_NAME_N=VAL_VALUE_N].
 */

class VectorAttribute : public Attribute
{
public:

    VectorAttribute(const std::string& name)
        : Attribute(name)
    {}

    VectorAttribute(const std::string& name,
                    const  std::map<std::string, std::string>& value)
        : Attribute(name)
        , attribute_value(value)
    {}

    VectorAttribute(const VectorAttribute& va) = default;

    VectorAttribute(const VectorAttribute* va)
        : Attribute(va->attribute_name)
        , attribute_value(va->attribute_value)
    {}

    VectorAttribute& operator=(const VectorAttribute& va) = default;

    ~VectorAttribute() {};

    /**
     *  Returns the attribute value, a string.
     */
    const std::map<std::string, std::string>& value() const
    {
        return attribute_value;
    };

    /**
     *  Returns the string value
     *    @param name of the attribute
     *
     *    @return copy of the value of the attribute if found, empty otherwise
     *
     *    @note Non const version must return copy, as subsequent call to replace or remove
     *      may change the value
     */
    std::string vector_value(const std::string& name);

    /**
     *  Returns the string value
     *    @param name of the attribute
     *
     *    @return reference of the value of the attribute if found, empty otherwise
     *
     *    @note It's safe to return reference here, as we are using
     *      the const object, which can't change the value
     */
    const std::string& vector_value(const std::string& name) const;

    /**
     * Returns the value of the given element of the VectorAttribute
     *
     * @param name of the attribute
     * @param value, not set if the element is not found of has invalid type
     *
     * @return 0 on success, -1 otherwise
     */
    template<typename T>
    int vector_value(const std::string& name, T& value) const
    {
        auto it = attribute_value.find(name);

        if ( it == attribute_value.end() )
        {
            return -1;
        }

        if ( it->second.empty() )
        {
            return -1;
        }

        if (std::is_unsigned<T>::value)
        {
            // Do not accept negative values for unsigned
            if (one_util::trim(it->second)[0] == '-')
            {
                return -1;
            }
        }

        std::istringstream iss(it->second);
        iss >> value;

        if (iss.fail() || !iss.eof())
        {
            return -1;
        }

        return 0;
    }

    /**
     * Returns the value of the given element of the VectorAttribute.
     * If element is invalid, returns default value
     *
     * @param name of the attribute
     * @param value always set, if element is invalid set default_value
     * @param default_value used if element is invalid
     */
    template<typename T>
    void vector_value(const std::string& name,
                      T& value,
                      const T& default_value) const
    {
        if (vector_value(name, value) != 0)
        {
            value = default_value;
        }
    }

    int vector_value(const std::string& name, std::string& value) const;

    int vector_value(const std::string& name, bool& value) const;

    /**
     * Returns the value of the given element of the VectorAttribute
     *
     * @param name Name of the attribute
     * @param value Integer value, if an error occurred the string returned is
     * empty and value is not set
     *
     * @return the value in string form on success, "" otherwise
     */
    template<typename T>
    const std::string& vector_value_str(const std::string& name, T& value) const
    {
        auto it = attribute_value.find(name);

        if ( it == attribute_value.end() )
        {
            return EMPTY_ATTRIBUTE;
        }

        if ( it->second.empty() )
        {
            return EMPTY_ATTRIBUTE;
        }

        std::istringstream iss(it->second);
        iss >> value;

        if (iss.fail() || !iss.eof())
        {
            return EMPTY_ATTRIBUTE;
        }

        return it->second;
    }

    /**
     *  Marshall the attribute in a single string. The string MUST be freed
     *  by the calling function. The string is in the form:
     *  "VAL_NAME_1=VAL_VALUE_1,...,VAL_NAME_N=VAL_VALUE_N".
     *    @return a string (allocated in the heap) holding the attribute value.
     */
    std::string marshall(const char * _sep = 0) const override;

    /**
     *  Write the attribute using a simple XML format:
     *
     *  <attribute_name>
     *    <val_name_1>val_value_1</val_name_1>
     *    ...
     *    <val_name_n>val_value_n</val_name_n>
     *  </attribute_name>
     *
     *  NOTE: For Vector attributes hidden are in the form  { "DB", { "USER", "PASSWD"} }
     *  A hidden attribute is rendered as ***
     */
    void to_xml(std::ostringstream& s) const override;

    void to_xml(std::ostringstream& s,
                const std::map<std::string, std::set<std::string>> &hidden) const override;

    void to_json(std::ostringstream& s) const override;

    /**
     *  Builds a new attribute from a string of the form:
     *  "VAL_NAME_1=VAL_VALUE_1,...,VAL_NAME_N=VAL_VALUE_N".
     */
    void unmarshall(const std::string& sattr, const char * _sep = 0) override;

    /**
     *  Replace the value of the given attribute with the provided map
     */
    void replace(const std::map<std::string, std::string>& attr);

    /**
     * The attributes from vattr will be copied to this vector
     * @param attr Vector attribute to merge
     * @param replace True to replace existing values, false to copy values
     * only if they don't exist in this vector attribute
     */
    void merge(const VectorAttribute* vattr, bool replace);

    /**
     *  Replace the value of the given vector attribute
     */
    template<typename T>
    void replace(const std::string& name, const T& value)
    {
        std::ostringstream oss;

        oss << value;

        replace(name, oss.str());
    }

    void replace(const std::string& name, bool value)
    {
        if (value == true)
        {
            replace(name, "YES");
        }
        else
        {
            replace(name, "NO");
        }
    }

    void replace(const std::string& name, const std::string& value);

    /**
     * Removes the given attribute from the vector
     * @param name of the attribute
     */
    void remove(const std::string& name);

    /**
     *  Returns the attribute type
     */
    AttributeType type() const override
    {
        return VECTOR;
    };

    /**
     *  Clones the current attribute
     */
    VectorAttribute* clone() const override
    {
        return new VectorAttribute(*this);
    };

    /**
     *  Clear the vector attribute values
     */
    void clear()
    {
        attribute_value.clear();
    }

    /**
     *  @return true if the vector attribute contains no values
     */
    bool empty() const
    {
        return attribute_value.empty();
    }

    /**
     *  Encrypt all secret attributes
     */
    void encrypt(const std::string& one_key,
                 const std::set<std::string>& eas) override;

    /**
     *  Decrypt all secret attributes
     */
    void decrypt(const std::string& one_key,
                 const std::set<std::string>& eas) override;

private:

    static const char * magic_sep;

    static const int    magic_sep_size;

    std::map<std::string, std::string> attribute_value;
};

#endif /*ATTRIBUTE_H_*/
