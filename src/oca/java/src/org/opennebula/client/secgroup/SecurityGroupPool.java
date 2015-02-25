/*******************************************************************************
 * Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs
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
package org.opennebula.client.secgroup;

import java.util.AbstractList;
import java.util.Iterator;


import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.Pool;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula Security Group pool.
 * It also offers static XML-RPC call wrappers.
 */
public class SecurityGroupPool extends Pool implements Iterable<SecurityGroup>{

    private static final String ELEMENT_NAME = "SECURITY_GROUP";
    private static final String INFO_METHOD  = "secgrouppool.info";

    private int filter;

    /**
     * Creates a new Security Group pool with the default filter flag value
     * set to {@link Pool#MINE_GROUP} (Security Groups belonging to the connected user,
     * and the ones in his group)
     *
     * @param client XML-RPC Client.
     *
     * @see SecurityGroupPool#SecurityGroupPool(Client, int)
     */
    public SecurityGroupPool(Client client)
    {
        super(ELEMENT_NAME, client, INFO_METHOD);
        this.filter = MINE_GROUP;
    }

    /**
     * Creates a new Security Group pool.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use by default in the method
     * {@link SecurityGroupPool#info()}. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Security Groups</li>
     * <li>{@link Pool#MINE}: Connected user's Security Groups</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Security Groups, and the ones in
     * his group</li>
     * <li>>= 0: UID User's Security Groups</li>
     * </ul>
     */
    public SecurityGroupPool(Client client, int filter)
    {
        super(ELEMENT_NAME, client, INFO_METHOD);
        this.filter = filter;
    }

    @Override
    public PoolElement factory(Node node)
    {
        return new SecurityGroup(node, client);
    }

    /**
     * Retrieves all or part of the Security Groups in the pool.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Security Groups</li>
     * <li>{@link Pool#MINE}: Connected user's Security Groups</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Security Groups, and the ones in
     * his group</li>
     * <li>>= 0: UID User's Security Groups</li>
     * </ul>
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int filter)
    {
        return Pool.info(client, INFO_METHOD, filter, -1, -1);
    }

    /**
     * Retrieves all the Security Groups in the pool.
     *
     * @param client XML-RPC Client.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse infoAll(Client client)
    {
        return Pool.infoAll(client, INFO_METHOD);
    }

    /**
     * Retrieves all the connected user's Security Groups.
     *
     * @param client XML-RPC Client.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse infoMine(Client client)
    {
        return Pool.infoMine(client, INFO_METHOD);
    }

    /**
     * Retrieves all the connected user's Security Groups and the ones in
     * his group.
     *
     * @param client XML-RPC Client.
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse infoGroup(Client client)
    {
        return Pool.infoGroup(client, INFO_METHOD);
    }

    /**
     * Retrieves all or part of the Security Groups in the pool. The Security Groups to retrieve
     * can be also filtered by Id, specifying the first and last Id to include.
     *
     * @param client XML-RPC Client.
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Security Groups</li>
     * <li>{@link Pool#MINE}: Connected user's Security Groups</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Security Groups, and the ones in
     * his group</li>
     * <li>>= 0: UID User's Security Groups</li>
     * </ul>
     * @param startId Lowest Id to retrieve
     * @param endId Biggest Id to retrieve
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int filter,
            int startId, int endId)
    {
        return Pool.info(client, INFO_METHOD, filter, startId, endId);
    }

    /**
     * Loads the xml representation of all or part of the
     * Security Groups in the pool. The filter used is the one set in
     * the constructor.
     *
     * @see SecurityGroupPool#info(Client, int)
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse info()
    {
        return super.info(filter, -1, -1);
    }

    /**
     * Loads the xml representation of all the Security Groups in the pool.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse infoAll()
    {
        return super.infoAll();
    }

    /**
     * Loads the xml representation of all the connected user's Security Groups.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse infoMine()
    {
        return super.infoMine();
    }

    /**
     * Loads the xml representation of all the connected user's Security Groups and
     * the ones in his group.
     *
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse infoGroup()
    {
        return super.infoGroup();
    }

    /**
     * Retrieves all or part of the Security Groups in the pool. The Security Groups to retrieve
     * can be also filtered by Id, specifying the first and last Id to include.
     *
     * @param filter Filter flag to use. Possible values:
     * <ul>
     * <li>{@link Pool#ALL}: All Security Groups</li>
     * <li>{@link Pool#MINE}: Connected user's Security Groups</li>
     * <li>{@link Pool#MINE_GROUP}: Connected user's Security Groups, and the ones in
     * his group</li>
     * <li>>= 0: UID User's Security Groups</li>
     * </ul>
     * @param startId Lowest Id to retrieve
     * @param endId Biggest Id to retrieve
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public OneResponse info(int filter, int startId, int endId)
    {
        return super.info(filter, startId, endId);
    }

    public Iterator<SecurityGroup> iterator()
    {
        AbstractList<SecurityGroup> ab = new AbstractList<SecurityGroup>()
        {
            public int size()
            {
                return getLength();
            }

            public SecurityGroup get(int index)
            {
                return (SecurityGroup) item(index);
            }
        };

        return ab.iterator();
    }

    /**
     * Returns the Security Group with the given Id from the pool. If it is not found,
     * then returns null. The method {@link #info()} must be called before.
     *
     * @param id of the Security Group to retrieve
     * @return The Image with the given Id, or null if it was not found.
     */
    public SecurityGroup getById(int id)
    {
        return (SecurityGroup) super.getById(id);
    }
}
