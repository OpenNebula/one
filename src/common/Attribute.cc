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

#include <string>
#include <sstream>
#include <cstring>

#include "Attribute.h"


const char * VectorAttribute::magic_sep      = "@^_^@";
const int    VectorAttribute::magic_sep_size = 5;

string * VectorAttribute::marshall(const char * _sep) const
{
    ostringstream os;
    string *      rs;
    const char *  my_sep;

    map<string,string>::const_iterator it;

    if ( _sep == 0 )
    {
    	my_sep = magic_sep;
    }
    else
    {
    	my_sep = _sep;
    }

    if ( attribute_value.size() == 0 )
    {
        return 0;
    }

    it = attribute_value.begin();

    os << it->first << "=" << it->second;

    for (++it; it != attribute_value.end(); it++)
    {
        os << my_sep << it->first << "=" << it->second;
    }

    rs = new string;

    *rs = os.str();

    return rs;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string * VectorAttribute::to_xml() const
{
	map<string,string>::const_iterator    it;
	ostringstream                   oss;
	string * 						xml;

	oss << "<" << name() << ">";

	for (it=attribute_value.begin();it!=attribute_value.end();it++)
	{
        if ( it->first.empty() )
        {
            continue;
        }

        if ( it->second.empty() )
        {
            oss << "<" << it->first << "/>";
        }
        else
        {
	    	oss << "<" << it->first << "><![CDATA[" << it->second
			    << "]]></"<< it->first << ">";
        }
	}

	oss << "</"<< name() << ">";

	xml = new string;

	*xml = oss.str();

	return xml;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VectorAttribute::unmarshall(const string& sattr, const char * _sep)
{
    size_t  bpos=0,epos,mpos;
    string  tmp;
    bool    cont = true;

    const char *  my_sep;
    int           my_sep_size;

    if ( _sep == 0 )
    {
        my_sep      = magic_sep;
        my_sep_size = magic_sep_size;
    }
    else
    {
        my_sep      = _sep;
        my_sep_size = strlen(_sep);
    }

    while(cont)
    {
    	epos=sattr.find(my_sep,bpos);

    	if (epos == string::npos)
    	{
    		tmp  = sattr.substr(bpos);
    		cont = false;
    	}
    	else
    	{
    		tmp  = sattr.substr(bpos,epos-bpos);
    		bpos = epos + my_sep_size;
    	}

    	mpos = tmp.find('=');

    	if (mpos == string::npos)
    	{
    		continue;
    	}
        
        if ( mpos + 1 == tmp.size() )
        {
            attribute_value.insert(make_pair(tmp.substr(0,mpos),""));
        }
        else
        {
            attribute_value.insert(make_pair(tmp.substr(0,mpos),
                                             tmp.substr(mpos+1)));
        } 
    }
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VectorAttribute::replace(const map<string,string>& attr)
{
	attribute_value = attr;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VectorAttribute::replace(const string& name, const string& value)
{
    map<string,string>::iterator it;

    it = attribute_value.find(name);
    
    if ( it != attribute_value.end() )
    {
        attribute_value.erase(it);
    }
    
    attribute_value.insert(make_pair(name,value));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string VectorAttribute::vector_value(const char *name) const
{
    map<string,string>::const_iterator it;

    it = attribute_value.find(name);

    if ( it == attribute_value.end() )
    {
        return "";
    }
    else
    {
        return it->second;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VectorAttribute::vector_value(const char *name, int & value) const
{
    map<string,string>::const_iterator it;

    it = attribute_value.find(name);

    if ( it == attribute_value.end() )
    {
        return -1;
    }

    if ( it->second.empty() )
    {
        return -1;
    }

    istringstream iss(it->second);
    iss >> value;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string VectorAttribute::vector_value_str(const char *name, int& value) const
{
    map<string,string>::const_iterator it;

    it = attribute_value.find(name);

    if ( it == attribute_value.end() )
    {
        value = -1;
        return  "";
    }

    if ( it->second.empty() )
    {
        value = -1;
        return "";
    }

    istringstream iss(it->second);
    iss >> value;

    if (iss.fail() || !iss.eof())
    {
        value = -1;
        return "";
    }

    return it->second;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
