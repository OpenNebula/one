/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

using namespace std;

/**
 *  Attribute base class for name-value pairs. This class provides a generic
 *  interface to implement
 */
class Attribute
{
public:

    Attribute(const string& aname):attribute_name(aname)
    {
        transform (
            attribute_name.begin(),
            attribute_name.end(),
            attribute_name.begin(),
            (int(*)(int))toupper);

        // FIX Attribute name if it does not conform XML element
        // naming conventions

        int size = attribute_name.size();

        if  ((size >0 && !isalpha(aname[0]))||
             (size >=3 && (aname[0]=='X' && aname[1]=='M' && aname[2]=='L')))
        {
            attribute_name.insert(0,"ONE_");    
        }
    };

    virtual ~Attribute(){};

    enum AttributeType
    {
        SIMPLE = 0,
        VECTOR = 1
    };

    /**
     *  Gets the name of the attribute.
     *    @return the attribute name
     */
    const string& name() const
    {
        return attribute_name;
    };

    /**
     *  Marshall the attribute in a single string. The string MUST be freed
     *  by the calling function.
     *    @return a string (allocated in the heap) holding the attribute value.
     */
    virtual string * marshall(const char * _sep = 0) const = 0;

    /**
     *  Write the attribute using a simple XML format. The string MUST be freed
     *  by the calling function.
     *    @return a string (allocated in the heap) holding the attribute value.
     */
    virtual string * to_xml() const = 0;

    /**
     *  Builds a new attribute from a string.
     */
    virtual void unmarshall(const string& sattr, const char * _sep = 0) = 0;

    /**
     *  Returns the attribute type
     */
    virtual AttributeType type() = 0;

    /**
     *  Clones the current attribute
     */
    virtual Attribute* clone() const = 0;

protected:
    /**
     *  The attribute name.
     */
    string attribute_name;
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

    SingleAttribute(const string& name):Attribute(name){};

    SingleAttribute(const string& name, const string& value):
        Attribute(name),attribute_value(value){};

    SingleAttribute(const SingleAttribute& sa):Attribute(sa.attribute_name)
    {
        attribute_value = sa.attribute_value;
    };

    ~SingleAttribute(){};

    /**
     *  Returns the attribute value, a string.
     */
    const string& value() const
    {
        return attribute_value;
    };

    /**
     *  Marshall the attribute in a single string. The string MUST be freed
     *  by the calling function.
     *    @return a string (allocated in the heap) holding the attribute value.
     */
    string * marshall(const char * _sep = 0) const
    {
        string * rs = new string;

        *rs = attribute_value;

        return rs;
    };

    /**
     *  Write the attribute using a simple XML format:
     *
     *  <attribute_name>attribute_value</attribute_name>
     *
     *  The string MUST be freed by the calling function.
     *    @return a string (allocated in the heap) holding the attribute value.
     */
    string * to_xml() const
    {
    	string * xml = new string;

    	*xml = "<" + name() + "><![CDATA[" + attribute_value
    		 + "]]></"+ name() + ">";

    	return xml;
    }

    /**
     *  Builds a new attribute from a string.
     */
    void unmarshall(const string& sattr, const char * _sep = 0)
    {
        attribute_value = sattr;
    };

    /**
     *  Replaces the attribute value from a string.
     */
    void replace(const string& sattr)
    {
        attribute_value = sattr;
    };

    /**
     *  Returns the attribute type
     */
    AttributeType type()
    {
        return SIMPLE;
    };

    /**
     *  Clones the current attribute
     */
    Attribute* clone() const
    {
        return new SingleAttribute(*this);   
    };

private:

    string attribute_value;
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

    VectorAttribute(const string& name):Attribute(name){};

    VectorAttribute(const string& name,const  map<string,string>& value):
            Attribute(name),attribute_value(value){};

    VectorAttribute(const VectorAttribute& va):Attribute(va.attribute_name)
    {
        attribute_value = va.attribute_value;
    };

    ~VectorAttribute(){};

    /**
     *  Returns the attribute value, a string.
     */
    const map<string,string>& value() const
    {
        return attribute_value;
    };

    /**
     *  Returns the string value
     *    @param name of the attribute
     *
     *    @return the value of the attribute if found, empty otherwise
     */
    string vector_value(const char *name) const;

    /**
     * Returns the integer value
     *
     * @param name Name of the attribute
     * @param value Integer value
     *
     * @return 0 on success, -1 otherwise
     */
    int vector_value(const char *name, int& value) const;

    /**
     * Returns the integer value
     *
     * @param name Name of the attribute
     * @param value Integer value, if an error ocurred the string returned is 
     * empty and value set to -1;
     *
     * @return the value in string form on success, "" otherwise
     */
    string vector_value_str(const char *name, int& value) const;

    /**
     *  Marshall the attribute in a single string. The string MUST be freed
     *  by the calling function. The string is in the form:
     *  "VAL_NAME_1=VAL_VALUE_1,...,VAL_NAME_N=VAL_VALUE_N".
     *    @return a string (allocated in the heap) holding the attribute value.
     */
    string * marshall(const char * _sep = 0) const;

    /**
     *  Write the attribute using a simple XML format:
     *
     *  <attribute_name>
     *    <val_name_1>val_value_1</val_name_1>
     *    ...
     *    <val_name_n>val_value_n</val_name_n>
     *  </attribute_name>
     *
     *  The string MUST be freed by the calling function.
     *    @return a string (allocated in the heap) holding the attribute value.
     */
    string * to_xml() const;

    /**
     *  Builds a new attribute from a string of the form:
     *  "VAL_NAME_1=VAL_VALUE_1,...,VAL_NAME_N=VAL_VALUE_N".
     */
    void unmarshall(const string& sattr, const char * _sep = 0);

    /**
     *  Replace the value of the given attribute with the provided map
     */
    void replace(const map<string,string>& attr);

    /**
     *  Replace the value of the given vector attribute
     */
    void replace(const string& name, const string& value);

    /**
     *  Replace the value of the given vector attribute
     */
    void replace(const string& name, int value)
    {
        ostringstream oss;

        oss << value;

        replace(name, oss.str());
    } 

    /**
     *  Returns the attribute type
     */
    AttributeType type()
    {
        return VECTOR;
    };

    /**
     *  Clones the current attribute
     */
    Attribute* clone() const
    {
        return new VectorAttribute(*this);   
    };

private:

	static const char * magic_sep;

	static const int	magic_sep_size;

    map<string,string> attribute_value;
};

#endif /*ATTRIBUTE_H_*/
