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

#ifndef QUOTA_H_
#define QUOTA_H_

#include "Template.h"

/**
 *  Base class for resource quotas, it provides basic storage and management of
 *  the quotas. Each resource MUST inherit from it to implement check and 
 *  update methods. Quotas are stored in a template form, each class store the
 *  limits and usage in a resource specific format.
 */
class Quota: public Template
{
public:
    
    /**
     *  Set the quotas. If the quota previously exists its limit is updated.
     *    @param quota_str the quota template in ASCII or XML formats
     *    @param error describe the error in case of error
     *    @return 0 on success -1 otherwise
     */
    int set(const string& quota_str, string& error);

    /**
     *  Check if the resource allocation will exceed the quota limits. If not 
     *  the usage counters are updated
     *    @param tmpl template for the resource
     *    @param error string 
     *    @return true if the operation can be performed
     */
    virtual bool check_add(Template* tmpl,  string& error)
    {
        return false;
    }

    /**
     *  Decrement usage counters when deallocating image
     *    @param tmpl template for the resource
     */
    virtual void del(Template* tmpl)
    {
        return;
    }

protected:

    Quota(const char * quota_name): Template(true, '=', quota_name) {};
    
    virtual ~Quota(){};

    /** 
     *  Sets new limit values for the quota
     *    @param quota to be updated
     *    @param va attribute with the new limits
     *    @return 0 on success or -1 if wrong limits
     */
    virtual int update_limits(Attribute* quota, const Attribute* va)
    {
       return -1; 
    };

    /**
     *  Creates an empty quota based on the given attribute. The attribute va
     *  contains the limits for the quota.
     *    @param va limits for the new quota if 0 limits will be 0
     *    @return a new attribute representing the quota
     */
    virtual Attribute * new_quota(Attribute* va)
    {
        return 0;
    }

    /**
     *  Adds a given value to the current quota (single)
     *    @param attr the quota with a numeric value
     *    @param num value to add to the current quota
     */
    void add_to_quota(SingleAttribute * attr, float num);

    /**
     *  Adds a given value to the current quota (vector)
     *    @param attr the quota;
     *    @param va_name name of the quota in the vector attribute
     *    @param num value to add to the current quota;
     */
    void add_to_quota(VectorAttribute * attr, const string& va_name, int num);
};

#endif /*QUOTA_H_*/
