/*******************************************************************************
 * Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)
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
 * This class represents an OpenNebula Cluster pool.
 * It also offers static XML-RPC call wrappers.
 */
public class ClusterPool extends Pool implements Iterable<Cluster>
{
    private static final String ELEMENT_NAME = "CLUSTER";
    private static final String INFO_METHOD  = "clusterpool.info";

    /**
     * Creates a new Image pool
     * 
     * @param client XML-RPC Client.
     */
    public ClusterPool(Client client)
    {
        super(ELEMENT_NAME, client);
    }

    /* (non-Javadoc)
     * @see org.opennebula.client.Pool#factory(org.w3c.dom.Node)
     */
    @Override
    public PoolElement factory(Node node)
    {
        return new Cluster(node, client);
    }

    /**
     * Returns the Cluster pool information.
     *  
     * @param client XML-RPC Client.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client)
    {
        return client.call(INFO_METHOD);
    }

    /**
     * Loads the xml representation of the Cluster pool.
     * 
     * @see ClusterPool#info(Client)
     */
    public OneResponse info()
    {
        OneResponse response = info(client);
        super.processInfo(response);
        return response;
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
}
