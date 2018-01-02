/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

// Forward declaration to avoid include cycle
class Quotas;

/**
 *  This class defines the public interface (pure abstract) for Quota.
 */
class QuotaInterface
{
public:
    /**
     *  Check if the resource allocation will exceed the quota limits. If not
     *  the usage counters are updated
     *    @param tmpl template for the resource
     *    @param default_quotas Quotas that contain the default limits
     *    @param error string
     *    @return true if the operation can be performed
     */
    virtual bool check(Template* tmpl, Quotas& default_quotas, string& error) = 0;

    /**
     *  Decrement usage counters when deallocating image
     *    @param tmpl template for the resource
     */
    virtual void del(Template* tmpl) = 0;
    /**
     *  Set the quotas. If the quota previously exists its limit is updated.
     *    @param quota_str the quota template in ASCII or XML formats
     *    @param error describe the error in case of error
     *
     *    @return 0 on success -1 otherwise
     */
    virtual int set(vector<VectorAttribute*> * quotas, string& error) = 0;

    /**
     *  Check if a resource update in usage counters will exceed the
     *  quota limits. If not the usage counters are updated for that resource
     *    @param tmpl with increments in MEMORY and CPU
     *    @param default_quotas Quotas that contain the default limits
     *    @param error string
     *    @return true if the operation can be performed
     */
    virtual bool update(Template * tmpl, Quotas& default_quotas, string& error) = 0;

    /**
     * Returns the name that identifies the quota in a template
     */
     virtual const char * get_quota_name() = 0;

     /**
      *  Gets a quota identified by its ID.
      *    @param id of the quota
      *    @param va The quota, if it is found
      *    @return 0 on success, -1 if not found
      */
     virtual int get_quota(const string& id, VectorAttribute **va) = 0;

protected:
    QuotaInterface(){};

    virtual ~QuotaInterface(){};
};

/**
 *  The QuotaDecorator class decorates the quota interface with specific
 *  behavior over the same quota object and counters. Decorators must be derived
 *  from this class and pass in its constructor the decorated object.
 */
class QuotaDecorator : public QuotaInterface
{
    virtual bool check(Template* tmpl, Quotas& default_quotas, string& error)
    {
        return quota->check(tmpl, default_quotas, error);
    }

    virtual void del(Template* tmpl)
    {
        return quota->del(tmpl);
    }

    virtual int set(vector<VectorAttribute*> * quotas, string& error)
    {
        return quota->set(quotas, error);
    }

    virtual bool update(Template * tmpl, Quotas& default_quotas, string& error)
    {
        return quota->update(tmpl, default_quotas, error);
    }

    virtual const char * get_quota_name()
    {
        return quota->get_quota_name();
    }

    virtual int get_quota(const string& id, VectorAttribute **va)
    {
        return quota->get_quota(id, va);
    }

protected:
    QuotaDecorator(QuotaInterface * _quota):quota(_quota){};

    virtual ~QuotaDecorator(){};

    QuotaInterface * quota;
};

/**
 *  Base class for resource quotas, it provides basic storage and management of
 *  the quotas. Each resource MUST inherit from it to implement check and
 *  update methods. Quotas are stored in a template form, each class store the
 *  limits and usage in a resource specific format.
 */
class Quota: public Template, public QuotaInterface
{
public:
    /**
     *  Set the quotas. If the quota previously exists its limit is updated.
     *    @param quota_str the quota template in ASCII or XML formats
     *    @param error describe the error in case of error
     *
     *    @return 0 on success -1 otherwise
     */
    int set(vector<VectorAttribute*> * quotas, string& error);

    /**
     *  Check if a resource update in usage counters will exceed the
     *  quota limits. If not the usage counters are updated for that resource
     *    @param tmpl with increments in MEMORY and CPU
     *    @param default_quotas Quotas that contain the default limits
     *    @param error string
     *    @return true if the operation can be performed
     */
    virtual bool update(Template * tmpl, Quotas& default_quotas, string& error)
    {
        error = "Update operation for quotas not supported.";
        return false;
    };

    /**
     * Returns the name that identifies the quota in a template
     */
     const char * get_quota_name()
     {
        return template_name;
     }

     /**
      *  Gets a quota identified by its ID.
      *    @param id of the quota
      *    @param va The quota, if it is found
      *    @return 0 on success, -1 if not found
      */
     virtual int get_quota(const string& id, VectorAttribute **va)
     {
         map<string, Attribute *>::iterator it;
         return get_quota(id, va, it);
     }

     /**
      * Value for limit default
      */
     static const int    DEFAULT;
     static const string DEFAULT_STR;

     /**
      * Value for "unlimited" limit
      */
     static const int UNLIMITED;

protected:

    Quota(const char *  quota_name,
          const char *  _template_name,
          const char ** _metrics,
          int           _num_metrics,
          bool          _is_default)
        : Template(false, '=', quota_name),
          template_name(_template_name),
          metrics(_metrics),
          num_metrics(_num_metrics),
          is_default(_is_default){};

    virtual ~Quota(){};

    /**
     *  Generic Quota Names
     *
     *  template_name = [
     *      ID              = "ID to identify the resource",
     *      metrics[0]      = "Limit for the first metric"
     *      metrics[0]_USED = "Usage for metric"
     *  ]
     *
     *  ID & counter fields are optional
     */

    /**
     *  Name of the quota used in the templates
     */
    const char *  template_name;

    /**
     *  The name of the quota metrics
     */
    const char ** metrics;

    /**
     *  Length
     */
    int num_metrics;

    /**
     * Whether or not this is a default quota. Default quotas do not have usage,
     * and can't have a limit of -1
     */
    bool is_default;

    /**
     *  Check a given quota for an usage request and update counters if the
     *  request does not exceed quota limits
     *    @param qid id that identifies the quota, to be used by get_quota
     *    @param usage_req usage for each metric
     *    @param default_quotas Quotas that contain the default limits
     *    @param error string describing the error
     *    @return true if the request does not exceed current limits
     */
    bool check_quota(const string& qid,
                     map<string, float>& usage_req,
                     Quotas& default_quotas,
                     string& error);

    /**
     *  Reduce usage from a given quota based on the current consumption
     *    @param qid id that identifies the quota, to be used by get_quota
     *    @param usage_req usage for each metric
     */
    void del_quota(const string& qid,
                   map<string, float>& usage_req);

    /**
     * Gets the default quota identified by its ID.
     *
     *    @param id of the quota
     *    @param default_quotas Quotas that contain the default limits
     *    @param va The quota, if it is found
     *
     *    @return 0 on success, -1 if not found
     */
    virtual int get_default_quota(const string& id,
                                Quotas& default_quotas,
                                VectorAttribute **va) = 0;

    /**
     * Gets a quota identified by its ID.
     *
     *    @param id of the quota
     *    @param va The quota, if it is found
     *    @param it The quota iterator, if it is found
     *
     *    @return 0 on success, -1 if not found
     */
    virtual int get_quota(
            const string& id,
            VectorAttribute **va,
            map<string, Attribute *>::iterator& it);

    /**
     * Checks if a quota has 0 limit and usage, and deletes it
     *
     * @param qid id of the quota
     */
    void cleanup_quota(const string& qid);

private:
    /**
     *  Creates an empty quota based on the given attribute. The attribute va
     *  contains the limits for the quota.
     *    @param va limits for the new quota if 0 limits will be 0
     *
     *    @return a new attribute representing the quota, 0 on error
     */
    VectorAttribute * new_quota(VectorAttribute* va);

    /**
     *  Adds a new quota, it also updates an internal index for fast accessing
     *  the quotas
     *    @param quota is the new quota, allocated in the HEAP
     */
    void add(VectorAttribute * nq)
    {
       attributes.insert(make_pair(nq->name(), nq));
    }

    /**
     *  Adds a given value to the current quota (vector)
     *    @param attr the quota;
     *    @param va_name name of the quota in the vector attribute
     *    @param num value to add to the current quota;
     */
    void add_to_quota(VectorAttribute * attr, const string& va_name, float num);

    /**
     *  Sets new limit values for the quota
     *    @param quota to be updated
     *    @param va attribute with the new limits
     *
     *    @return 0 on success or -1 if wrong limits
     */
    int update_limits(VectorAttribute* quota,
            const VectorAttribute* va);

    /**
     *  Extract the limits for the defined quota metrics from a given attribute
     *    @param va the attribute with the limits
     *    @param limits stores the known limits
     *    @return 0 on success
     */
    int get_limits(const VectorAttribute * va, map<string, string>& limits);
};

#endif /*QUOTA_H_*/
