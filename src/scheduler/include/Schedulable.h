/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#ifndef SCHEDULABLE_H_
#define SCHEDULABLE_H_

#include <map>

class PoolXML;

/**
 *  This class represents a target resource to schedule a "schedulable"
 *  resource.
 */
class Resource
{
public:
    Resource(int _oid):oid(_oid), priority(0){};

    virtual ~Resource(){};

    static bool cmp (const Resource * a, const Resource * b)
    {
        return a->priority < b->priority;
    };

    bool operator<(const Resource& b) const
    {
        return priority < b.priority;
    };

    int   oid;
    float priority;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  Abstract class that models an object that can be scheduled over a resource
 */
class Schedulable
{
public:
    Schedulable(){};

    virtual ~Schedulable()
    {
        vector<Resource *>::iterator jt;

        for (jt=resources.begin(); jt!=resources.end(); jt++)
        {
            delete *jt;
        }
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

    void sort_resources()
    {
        sort(resources.begin(), resources.end(), Resource::cmp);
    }

    /**
     *  Selects a resource among the matched and prioritized resources, in a
     *  scheduling step.
     *    @param oid of the selected resource.
     *    @param pool storing the resources.
     *    @param current number of schedules for each resource in this step.
     *    @param max number of schedules per resource in this step.
     *
     *    @return 0 if success -1 otherwise
     */
    virtual int get_resource(int& oid, PoolXML *pool, map<int,int>& current, int max) = 0;

    /**
     *  Return a reference to the resources of the object
     *    @return vector of resources.
     */
    const vector<Resource *>& get_resources() const
    {
        return resources;
    };

protected:

    vector<Resource *> resources;
};

#endif /*SCHEDULABLE_H_*/
