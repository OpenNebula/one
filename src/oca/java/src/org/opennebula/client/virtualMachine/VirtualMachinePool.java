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
package org.opennebula.client.virtualMachine;

import java.util.AbstractList;
import java.util.Iterator;


import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.Pool;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula VM pool.
 * It also offers static XML-RPC call wrappers.
 */
public class VirtualMachinePool extends Pool implements Iterable<VirtualMachine>{

    private static final String ELEMENT_NAME = "VM";
    private static final String INFO_METHOD  = "vmpool.info";

    private int filter;
    
    /**
     * Creates a new VM pool with the default filter flag value
     * set to 0 (VMs belonging to user with UID 0)
     * 
     * @param client XML-RPC Client.
     * 
     * @see VirtualMachinePool#VirtualMachinePool(Client, int)
     */
    public VirtualMachinePool(Client client)
    {
        super(ELEMENT_NAME, client);
        this.filter = 0;        
    }

    /**
     * Creates a new VM pool.
     * 
     * @param client XML-RPC Client.
     * @param filter Filter flag used by default in the method
     * {@link VirtualMachinePool#info()}. Possible values:
     * <ul>
     * <li><= -2: All VMs</li>
     * <li>-1: Connected user's VMs</li>
     * <li>>= 0: UID User's VMs</li>
     * </ul>
     */
    public VirtualMachinePool(Client client, int filter)
    {
        super(ELEMENT_NAME, client);
        this.filter = filter;
    }

    @Override
    public PoolElement factory(Node node)
    {
        return new VirtualMachine(node, client);
    }

    /**
     * Retrieves all or part of the VMs in the pool.
     *  
     * @param client XML-RPC Client.
     * @param filter Filter flag. Possible values:
     * <ul>
     * <li><= -2: All VMs</li>
     * <li>-1: Connected user's VMs</li>
     * <li>>= 0: UID User's VMs</li>
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
     * VMs in the pool. The filter used is the one set in
     * the constructor.
     * 
     * @see VirtualMachinePool#info(Client, int)
     * 
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse info()
    {
        OneResponse response = info(client, filter);
        super.processInfo(response);
        return response;
    }

    public Iterator<VirtualMachine> iterator()
    {
        AbstractList<VirtualMachine> ab = new AbstractList<VirtualMachine>()
        {
            public int size()
            {
                return getLength();
            }

            public VirtualMachine get(int index)
            {
                return (VirtualMachine) item(index);
            }
        };

        return ab.iterator();
    }
}
