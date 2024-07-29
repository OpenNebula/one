/*******************************************************************************
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems
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
package org.opennebula.client.host;

import java.util.AbstractList;
import java.util.Iterator;


import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.Pool;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula host pool.
 * It also offers static XML-RPC call wrappers.
 */
public class HostPool extends Pool implements Iterable<Host>{

    private static final String ELEMENT_NAME = "HOST";
    private static final String INFO_METHOD  = "hostpool.info";
    private static final String MONITORING   = "hostpool.monitoring";

    /**
     * Creates a new host pool
     * @param client XML-RPC Client.
     */
    public HostPool(Client client)
    {
        super(ELEMENT_NAME, client, INFO_METHOD);
    }

    @Override
    public PoolElement factory(Node node)
    {
        return new Host(node, client);
    }

    /**
     * Retrieves all the hosts in the pool.
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
     * Retrieves the monitoring data for all the hosts in the pool.
     *
     * @param client XML-RPC Client.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse monitoring(Client client)
    {
        return client.call(MONITORING);
    }

    /**
     * Retrieves the monitoring data for all the hosts in the pool.
     *
     * @param client XML-RPC Client.
     * @param num: Retrieve monitor records in the last num seconds.
     * 0 just the last record, -1 all records.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse monitoring(Client client, int num)
    {
        return client.call(MONITORING, num);
    }

    /**
     * Loads the xml representation of the host pool.
     *
     * @see HostPool#info(Client)
     */
    public OneResponse info()
    {
        return super.info();
    }

    /**
     * Retrieves the monitoring data for all the hosts in the pool.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse monitoring()
    {
        return monitoring(client);
    }

    public Iterator<Host> iterator()
    {
        AbstractList<Host> ab = new AbstractList<Host>()
        {
            public int size()
            {
                return getLength();
            }

            public Host get(int index)
            {
                return (Host) item(index);
            }
        };

        return ab.iterator();
    }

    /**
     * Returns the Host with the given Id from the pool. If it is not found,
     * then returns null. The method {@link #info()} must be called before.
     *
     * @param id of the Host to retrieve
     * @return The Image with the given Id, or null if it was not found.
     */
    public Host getById(int id)
    {
        return (Host) super.getById(id);
    }
}
