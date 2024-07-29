/* ------------------------------------------------------------------------ */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems              */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* -------------------------------------------------------------------------*/

#ifndef CLUSTERABLE_H_
#define CLUSTERABLE_H_

#include "ObjectCollection.h"

class Clusterable
{
public:

    int add_cluster(int cluster_id)
    {
        return cluster_ids.add(cluster_id);
    };

    int del_cluster(int cluster_id)
    {
        return cluster_ids.del(cluster_id);
    };

    /**
     * Returns the cluster IDs
     *
     * @return The cluster IDs set
     */
    const std::set<int>& get_cluster_ids() const
    {
        return cluster_ids.get_collection();
    };

    /**
     * Rebuilds the cluster collection from an xml object
     * @param xml xml object
     * @param xpath_prefix Parent nodes, e.g. "/DATASTORE/"
     *
     * @return 0 on success, -1 otherwise
     */
    int from_xml(const ObjectXML* xml, const std::string& xpath_prefix)
    {
        return cluster_ids.from_xml(xml, xpath_prefix);
    };

    /**
     * Function to print the cluster IDs into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const
    {
        return cluster_ids.to_xml(xml);
    };

protected:

    Clusterable(const std::set<int> &_cluster_ids):
        cluster_ids("CLUSTERS", _cluster_ids) {};

    ~Clusterable() {};

    /**
     * IDs of the clusters this object belongs to.
     */
    ObjectCollection cluster_ids;
};

#endif /*CLUSTERABLE_H_*/
