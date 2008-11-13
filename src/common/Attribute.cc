/* -------------------------------------------------------------------------- */
/* Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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

#include "Attribute.h"


const char * VectorAttribute::magic_sep      = "@^_^@";
const int    VectorAttribute::magic_sep_size = 5;

string * VectorAttribute::marshall()
{
    ostringstream                   os;
    map<string,string>::iterator    it;
    string *                        rs;

    if ( attribute_value.size() == 0 )
    {
        return 0;
    }

    it = attribute_value.begin();

    os << it->first << "=" << it->second;

    for (++it; it != attribute_value.end(); it++)
    {
        os << magic_sep << it->first << "=" << it->second;
    }

    rs = new string;

    *rs = os.str();

    return rs;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VectorAttribute::unmarshall(const string& sattr)
{
    size_t 	bpos=0,epos,mpos;
    string  tmp;
    bool	cont = true;
    
    while(cont)
    {
    	epos=sattr.find(magic_sep,bpos);
    	
    	if (epos == string::npos)
    	{
    		tmp  = sattr.substr(bpos);
    		cont = false;
    	}
    	else
    	{
    		tmp  = sattr.substr(bpos,epos-bpos);
    		bpos = epos + magic_sep_size;
    	}
    	
    	mpos = tmp.find('=');
    	
    	if (mpos == string::npos)
    	{
    		continue;
    	}
    	
        attribute_value.insert(make_pair(tmp.substr(0,mpos),
                                         tmp.substr(mpos+1)));
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
};
