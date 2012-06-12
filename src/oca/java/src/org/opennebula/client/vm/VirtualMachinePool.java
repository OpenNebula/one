/*******************************************************************************
 * Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)
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
package org.opennebula.client.vm;

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
    private static final String MONITORING   = "vmpool.monitoring";

    /**
     * Flag for Virtual Machines in any state.
     */
    public static final int ALL_VM   = -2;

    /**
     * Flag for Virtual Machines in any state, except for DONE.
     */
    public static final int NOT_DONE = -1;

    private int filter;

    /**
     * Creates a new Virtual Machine pool with the default filter flag value
     * set to {@link Pool#MINE_GROUP} (Virtual Machines belonging to the connected user,
     * and the ones in his group)
     *
     * @param client XML-RPC Client.
     *
     * @see VirtualMachinePool#VirtualMachinePool(Client, int)
     */
    public VirtualMachinePool(Client client)
    {
        super(ELEMENT_NAME, client, INFO_METHOD);
        this.filter = MINE_GROUP;
    }

    /**
     * Creates a new Virtual Machine pool.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use by default in the method
     * {@link VirtualMachinePool#info()}. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and the ones in
     * his group</li>
     * <li>>= 0: UID User's Virtual Machines</li>
     * </ul>
     */
    public VirtualMachinePool(Client client, int filter)
    {
        super(ELEMENT_NAME, client, INFO_METHOD);
        this.filter = filter;
    }

    @Override
    public PoolElement factory(Node node)
    {
        return new VirtualMachine(node, client);
    }


    /**
     * Retrieves all or part of the Virtual Machines in the pool.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and the ones in
     * his group</li>
     * <li>>= 0: UID User's Virtual Machines</li>
     * </ul>
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int filter)
    {
        return client.call(INFO_METHOD, filter, -1, -1, NOT_DONE);
    }

    /**
     * Retrieves all the Virtual Machines in the pool.
     *
     * @param client XML-RPC Client.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse infoAll(Client client)
    {
        return client.call(INFO_METHOD, ALL, -1, -1, NOT_DONE);
    }

    /**
     * Retrieves all the connected user's Virtual Machines.
     *
     * @param client XML-RPC Client.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse infoMine(Client client)
    {
        return client.call(INFO_METHOD, MINE, -1, -1, NOT_DONE);
    }

    /**
     * Retrieves all the connected user's Virtual Machines and the ones in
     * his group.
     *
     * @param client XML-RPC Client.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse infoGroup(Client client)
    {
        return client.call(INFO_METHOD, MINE_GROUP, -1, -1, NOT_DONE);
    }

    /**
     * Retrieves all or part of the Virtual Machines in the pool. The
     * Virtual Machines to retrieve can be also filtered by Id, specifying the
     * first and last Id to include; and by state.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and the ones in
     * his group</li>
     * <li>>= 0: UID User's Virtual Machines</li>
     * </ul>
     * @param startId Lowest Id to retrieve
     * @param endId Biggest Id to retrieve
     * @param state Numeric state of the Virtual Machines wanted, or one
     * of {@link VirtualMachinePool#ALL_VM} or
     * {@link VirtualMachinePool#NOT_DONE}
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int filter,
            int startId, int endId, int state)
    {
        return client.call(INFO_METHOD, filter, startId, endId, state);
    }

    /**
     * Retrieves the monitoring data for all or part of the Virtual
     * Machines in the pool.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and
     * the ones in his group</li>
     * <li>>= 0: UID User's Virtual Machines</li>
     * </ul>
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse monitoring(Client client, int filter)
    {
        return client.call(MONITORING, filter);
    }

    /**
     * Loads the xml representation of all or part of the
     * Virtual Machines in the pool. The filter used is the one set in
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
        processInfo(response);
        return response;
    }

    /**
     * Loads the xml representation of all the Virtual Machines in the pool.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse infoAll()
    {
        OneResponse response = infoAll(client);
        processInfo(response);
        return response;
    }

    /**
     * Loads the xml representation of all the connected user's Virtual Machines.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse infoMine()
    {
        OneResponse response = infoMine(client);
        processInfo(response);
        return response;
    }

    /**
     * Loads the xml representation of all the connected user's Virtual Machines and
     * the ones in his group.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse infoGroup()
    {
        OneResponse response = infoGroup(client);
        processInfo(response);
        return response;
    }

    /**
     * Retrieves all or part of the Virtual Machines in the pool. The Virtual Machines to retrieve
     * can be also filtered by Id, specifying the first and last Id to include.
     *
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and the ones in
     * his group</li>
     * <li>>= 0: UID User's Virtual Machines</li>
     * </ul>
     * @param startId Lowest Id to retrieve
     * @param endId Biggest Id to retrieve
     * @param state Numeric state of the Virtual Machines wanted
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse info(int filter, int startId, int endId, int state)
    {
        OneResponse response = info(client, filter, startId, endId, state);
        processInfo(response);
        return response;
    }

    /**
     * Retrieves the monitoring data for all or part of the Virtual
     * Machines in the pool.
     *
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Virtual Machines</li>
     * <li>{@link Pool#MINE}: Connected user's Virtual Machines</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Virtual Machines, and
     * the ones in his group</li>
     * <li>>= 0: UID User's Virtual Machines</li>
     * </ul>
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse monitoring(int filter)
    {
        return monitoring(client, filter);
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

    /**
     * Returns the Virtual Machine with the given Id from the pool. If it is not found,
     * then returns null. The method {@link #info()} must be called before.
     *
     * @param id of the ACl rule to retrieve
     * @return The Virtual Machine with the given Id, or null if it was not found.
     */
    public VirtualMachine getById(int id)
    {
        return (VirtualMachine) super.getById(id);
    }
}
