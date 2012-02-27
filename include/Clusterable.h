/* ------------------------------------------------------------------------ */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)           */
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

using namespace std;

class Clusterable
{
public:

    /**
     * Changes the cluster this object belongs to
     *
     * @param _cluster_id Id of the new cluster
     * @param _cluster Name of the new cluster
     */
    void set_cluster(int _cluster_id, const string& _cluster)
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
    const string& get_cluster_name() const
    {
        return cluster;
    };


protected:

    Clusterable(int _cluster_id, const string& _cluster):
        cluster_id(_cluster_id),
        cluster(_cluster){};

    ~Clusterable(){};

    /**
     * ID of the cluster this object belongs to.
     */
    int         cluster_id;

    /**
     *  Name of the cluster this object belongs to.
     */
    string      cluster;
};

#endif /*CLUSTERABLE_H_*/
