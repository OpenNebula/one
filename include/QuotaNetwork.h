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

#ifndef QUOTA_NETWORK_H_
#define QUOTA_NETWORK_H_

#include "Quota.h"
#include "PoolObjectSQL.h"

/**
 *  DataStore Quotas, defined as:
 *    NETWORK = [
 *        ID     = <ID of the datastore>
 *        LEASES = <Max. number of IPs that can be leased from net>
 *        LEASES_USED = Current number of IPs
 *    ]
 *
 *   0 = unlimited, default if missing
 */
class QuotaNetwork : public Quota
{
public:
    QuotaNetwork(bool is_default)
        : Quota("NETWORK_QUOTA", "NETWORK", NET_METRICS, is_default)
    {}

    virtual ~QuotaNetwork() {};

    /**
     *  Check if the resource allocation will exceed the quota limits. If not
     *  the usage counters are updated. Assumes calling object is a VM
     *    @param tmpl template for the resource
     *    @param default_quotas Quotas that contain the default limits
     *    @param error string
     *    @return true if the operation can be performed
     */
    bool check(Template* tmpl, Quotas& default_quotas, std::string& err) override
    {
        return check(PoolObjectSQL::VM, tmpl, default_quotas, err);
    }

    /**
     *  Decrement usage counters when freeing a lease. This method considers
     *  the object type to accounto for FLOATING IP addresses or not
     *    @param tmpl template for the resource
     */
    void del(Template* tmpl) override
    {
        del(PoolObjectSQL::VM, tmpl);
    }

protected:
    /**
     * Gets the default quota identified by its ID.
     *
     *    @param id of the quota
     *    @param default_quotas Quotas that contain the default limits
     *    @param va The quota, if it is found
     *
     *    @return 0 on success, -1 if not found
     */
    int get_default_quota(const std::string& id,
                          Quotas& default_quotas,
                          VectorAttribute **va) override;

    static const std::vector<std::string> NET_METRICS;

private:
    /**
     *  Friends are decorators for the QuotaNetwork. They can access specialized
     *  methods to operate over the same quota counters (base Template class)
     */
    friend class QuotaNetworkVirtualRouter;

    /**
     *  Check if the resource allocation will exceed the quota limits. If not
     *  the usage counters are updated. This method considers the object type to
     *  accounto for FLOATING IP addresses or not
     *    @param otype object type, VM or VRouter
     *    @param tmpl template for the resource
     *    @param default_quotas Quotas that contain the default limits
     *    @param error string
     *    @return true if the operation can be performed
     */
    bool check(PoolObjectSQL::ObjectType otype, Template* tmpl,
               Quotas& default_quotas, std::string& error);

    /**
     *  Decrement usage counters when freeing a lease. This method considers
     *  the object type to accounto for FLOATING IP addresses or not
     *    @param otype object type, VM or VRouter
     *    @param tmpl template for the resource
     */
    void del(PoolObjectSQL::ObjectType otype, Template* tmpl);
};

/**
 *  Decorates the QuotaNetwork object to consider the FLOATING_IP attribute
 *  of the NIC attributes. It must be instantiated using an exisiting QuotaNetwork
 *  object
 */
class QuotaNetworkVirtualRouter: public QuotaDecorator
{
public:
    QuotaNetworkVirtualRouter(QuotaNetwork *qn):QuotaDecorator(qn) {};

    virtual ~QuotaNetworkVirtualRouter() {};

    bool check(Template* tmpl, Quotas& default_quotas, std::string& err) override
    {
        QuotaNetwork * qn = static_cast<QuotaNetwork *>(quota);

        return qn->check(PoolObjectSQL::VROUTER, tmpl, default_quotas, err);
    }

    void del(Template* tmpl) override
    {
        QuotaNetwork * qn = static_cast<QuotaNetwork *>(quota);

        qn->del(PoolObjectSQL::VROUTER, tmpl);
    }
};

#endif /*QUOTA_NETWORK_H_*/
