/*******************************************************************************
 * Copyright 2002-2018, OpenNebula Project, OpenNebula Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
package org.opennebula.client.cluster;

import java.util.AbstractList;
import java.util.Iterator;


import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.Pool;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula cluster pool.
 * It also offers static XML-RPC call wrappers.
 */
public class ClusterPool extends Pool implements Iterable<Cluster>{

    public static final int NONE_CLUSTER_ID = -1;

    private static final String ELEMENT_NAME = "CLUSTER";
    private static final String INFO_METHOD  = "clusterpool.info";

    /**
     * Creates a new cluster pool
     * @param client XML-RPC Client.
     */
    public ClusterPool(Client client)
    {
        super(ELEMENT_NAME, client, INFO_METHOD);
    }

    @Override
    public PoolElement factory(Node node)
    {
        return new Cluster(node, client);
    }

    /**
     * Retrieves all the clusters in the pool.
     *
     * @param client XML-RPC Client.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client)
    {
        return Pool.info(client, INFO_METHOD);
    }

    /**
     * Loads the xml representation of the cluster pool.
     *
     * @see ClusterPool#info(Client)
     */
    public OneResponse info()
    {
        return super.info();
    }

    public Iterator<Cluster> iterator()
    {
        AbstractList<Cluster> ab = new AbstractList<Cluster>()
        {
            public int size()
            {
                return getLength();
            }

            public Cluster get(int index)
            {
                return (Cluster) item(index);
            }
        };

        return ab.iterator();
    }

    /**
     * Returns the Cluster with the given Id from the pool. If it is not found,
     * then returns null. The method {@link #info()} must be called before.
     *
     * @param id of the Cluster to retrieve
     * @return The Image with the given Id, or null if it was not found.
     */
    public Cluster getById(int id)
    {
        return (Cluster) super.getById(id);
    }
}
