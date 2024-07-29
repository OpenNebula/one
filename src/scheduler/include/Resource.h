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

#ifndef RESOURCE_H_
#define RESOURCE_H_

#include <map>

class PoolXML;

/**
 *  This class represents a target resource to schedule a "schedulable"
 *  resource.
 */
struct Resource
{
public:
    Resource(int _oid):oid(_oid), priority(0) {};

    virtual ~Resource() {};

    int   oid;
    float priority;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  Abstract class that models an object that can be scheduled over a resource
 */
class ResourceMatch
{
public:
    ResourceMatch() {};

    virtual ~ResourceMatch()
    {
        clear();
    };

    /**
     *  Adds a matching resource to the object
     *    @param oid of the resource
     */
    virtual void add_resource(int oid)
    {
        Resource * r = new Resource(oid);

        resources.push_back(r);
    }

    /**
     *  Removes resource
     *    @param oid of the resource
     */
    virtual void remove_resource(int oid)
    {
        auto it = std::find_if(resources.begin(), resources.end(), [oid](const auto val)
        {
            return oid == val->oid;
        });

        if (it != resources.end())
        {
            delete *it;
            resources.erase(it);
        }
    }

    /**
     *  Sort the matched resources in the vector
     */
    virtual void sort_resources()
    {
        struct ResourceCompare
        {
            bool operator() (const Resource * a, const Resource * b) const
            {
                return a->priority < b->priority;
            };
        } cmp;

        std::sort(resources.begin(), resources.end(), cmp);
    }

    /**
     *  Return a reference to the resources of the object
     *    @return vector of resources.
     */
    const std::vector<Resource *>& get_resources() const
    {
        return resources;
    };

    /**
     *  Clear the resources by freeing memory and reducing the effective size
     *  to 0.
     */
    void clear()
    {
        for (auto res : resources)
        {
            delete res;
        }

        resources.clear();
    }

protected:

    std::vector<Resource *> resources;
};

/**
 *  Abstract class that models an object that can be scheduled over a resource
 */
class VirtualMachineResourceMatch: public ResourceMatch
{
public:
    void sort_resources() override
    {
        struct ResourceCompare
        {
            bool operator() (const Resource * a, const Resource * b) const
            {
                if ( a->priority == b->priority )
                {
                    return a->oid > b->oid;
                }

                return a->priority < b->priority;
            };
        } cmp;

        std::sort(resources.begin(), resources.end(), cmp);
    }
};

#endif /*RESOURCE_H_*/
