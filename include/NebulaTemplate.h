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

#ifndef NEBULA_TEMPLATE_H_
#define NEBULA_TEMPLATE_H_

#include "Template.h"
#include <map>

/**
 * This class provides the basic abstraction for OpenNebula configuration files
 */
class NebulaTemplate : public Template
{
public:
    // -----------------------------------------------------------------------
    // -----------------------------------------------------------------------

    NebulaTemplate(const string& etc_location, const char * _conf_name)
    {
        conf_file = etc_location + _conf_name;
    }

    virtual ~NebulaTemplate(){};

    // -----------------------------------------------------------------------
    // -----------------------------------------------------------------------

    int get(const char * name, vector<const Attribute*>& values) const
    {
        string _name(name);

        return Template::get(_name,values);
    };

    void get(const char * name, string& values) const
    {
        string _name(name);

        Template::get(_name,values);
    };

    void get(const char * name, int& values) const
    {
        string _name(name);

        Template::get(_name,values);
    };

    void get(const char *name, unsigned int& values) const
    {
        int ival;

        NebulaTemplate::get(name, ival);

        values = static_cast<unsigned int>(ival);
    };

    void get(const char * name, time_t& values) const
    {
        const SingleAttribute *   sattr;
        vector<const Attribute *> attr;

        string _name(name);

        if ( Template::get(_name,attr) == 0 )
        {
            values = 0;
            return;
        }

        sattr = dynamic_cast<const SingleAttribute *>(attr[0]);

        if ( sattr != 0 )
        {
            istringstream   is;

            is.str(sattr->value());
            is >> values;
        }
        else
            values = 0;
    };

    void get(const char *name, float& value) const
    {
        string _name(name);

        Template::get(_name,value);
    };

    void get(const char *name, bool& value) const
    {
        string _name(name);

        Template::get(_name,value);
    };

    void get(const char *name, long long& value) const
    {
        string _name(name);

        Template::get(_name,value);
    }

    // -----------------------------------------------------------------------
    // -----------------------------------------------------------------------

    /**
     *  Parse and loads the configuration in the template
     */
    int load_configuration();

protected:
    /**
     *  Full path to the configuration file
     */
    string                  conf_file;

    /**
     *  Defaults for the configuration file
     */
    map<string, Attribute*> conf_default;

    /**
     *  Sets the defaults value for the template
     */
    virtual void set_conf_default() = 0;
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

class OpenNebulaTemplate : public NebulaTemplate
{
public:

    OpenNebulaTemplate(const string& etc_location, const string& _var_location):
        NebulaTemplate(etc_location, conf_name), var_location(_var_location)
        {};

    ~OpenNebulaTemplate(){};

    /**
     *  Read or Generate the master key file to encrypt DB data when needed
     *  this key is added to the configuration of OpenNebula and can be obtained
     *  through one.system.config
     */
    int load_key();

private:
    /**
     *  Name for the configuration file, oned.conf
     */
    static const char * conf_name;

    /**
     *  Path for the var directory, for defaults
     */
    string var_location;

    /**
     *  Sets the defaults value for the template
     */
    void set_conf_default();


    /**
     *  Sets a default single attribute value
     */
    void set_conf_default_single(const std::string& attr,
                                 const std::string& value);
};


#endif /*NEBULA_TEMPLATE_H_*/
