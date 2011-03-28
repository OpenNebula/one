/*******************************************************************************
 * Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)
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
package org.opennebula.client.vnet;

import java.util.AbstractList;
import java.util.Iterator;


import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.Pool;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula Virtual Network pool.
 * It also offers static XML-RPC call wrappers.
 */
public class VirtualNetworkPool extends Pool implements Iterable<VirtualNetwork>{

    private static final String ELEMENT_NAME = "VNET";
    private static final String INFO_METHOD  = "vnpool.info";

    private int filter;

    /**
     * Creates a new VN pool with the default filter flag value
     * set to 0 (VNs belonging to user with UID 0)
     * 
     * @param client XML-RPC Client.
     * 
     * @see VirtualNetworkPool#VirtualNetworkPool(Client, int)
     */
    public VirtualNetworkPool(Client client)
    {
        super(ELEMENT_NAME, client);
        this.filter = 0;
    }

    /**
     * Creates a new VN pool.
     * 
     * @param client XML-RPC Client.
     * @param filter Filter flag used by default in the method
     * {@link VirtualNetworkPool#info()}. Possible values:
     * <ul>
     * <li><= -2: All VNs</li>
     * <li>-1: Connected user's VNs</li>
     * <li>>= 0: UID User's VNs</li>
     * </ul>
     */
    public VirtualNetworkPool(Client client, int filter)
    {
        super(ELEMENT_NAME, client);
        this.filter = filter;
    }

    @Override
    public PoolElement factory(Node node)
    {
        return new VirtualNetwork(node, client);
    }

    /**
     * Retrieves all or part of the VNs in the pool.
     *  
     * @param client XML-RPC Client.
     * @param filter Filter flag. Possible values:
     * <ul>
     * <li><= -2: All VNs</li>
     * <li>-1: Connected user's VNs</li>
     * <li>>= 0: UID User's VNs</li>
     * </ul>
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int filter)
    {
        return client.call(INFO_METHOD, filter);
    }

    /**
     * Loads the xml representation of all or part of the
     * VNs in the pool. The filter used is the one set in
     * the constructor.
     * 
     * @see VirtualNetworkPool#info(Client, int)
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse info()
    {
        OneResponse response = info(client, filter);
        super.processInfo(response);
        return response;
    }

    public Iterator<VirtualNetwork> iterator()
    {
        AbstractList<VirtualNetwork> ab = new AbstractList<VirtualNetwork>()
        {
            public int size()
            {
                return getLength();
            }

            public VirtualNetwork get(int index)
            {
                return (VirtualNetwork) item(index);
            }
        };

        return ab.iterator();
    }
}
