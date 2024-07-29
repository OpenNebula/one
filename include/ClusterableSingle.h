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

#ifndef CLUSTERABLE_SINGLE_H_
#define CLUSTERABLE_SINGLE_H_

class ClusterableSingle
{
public:

    /**
     * Changes the cluster this object belongs to
     *
     * @param _cluster_id Id of the new cluster
     * @param _cluster Name of the new cluster
     */
    void set_cluster(int _cluster_id, const std::string& _cluster)
    {
        cluster_id  = _cluster_id;
        cluster     = _cluster;
    };

    /**
     * Returns the cluster ID
     *
     * @return The cluster ID
     */
    int get_cluster_id() const
    {
        return cluster_id;
    };

    /**
     * Returns the cluster name
     *
     * @return The cluster name
     */
    const std::string& get_cluster_name() const
    {
        return cluster;
    };


protected:

    ClusterableSingle(int _cluster_id, const std::string& _cluster):
        cluster_id(_cluster_id),
        cluster(_cluster) {};

    ~ClusterableSingle() {};

    /**
     * ID of the cluster this object belongs to.
     */
    int         cluster_id;

    /**
     *  Name of the cluster this object belongs to.
     */
    std::string cluster;
};

#endif /*CLUSTERABLE_SINGLE_H_*/
