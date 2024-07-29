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
package org.opennebula.client.group;

import java.util.AbstractList;
import java.util.Iterator;


import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.Pool;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula group pool.
 * It also offers static XML-RPC call wrappers.
 */
public class GroupPool extends Pool implements Iterable<Group>{

    private static final String ELEMENT_NAME = "GROUP";
    private static final String INFO_METHOD  = "grouppool.info";

    /**
     * Creates a new group pool
     * @param client XML-RPC Client.
     */
    public GroupPool(Client client)
    {
        super(ELEMENT_NAME, client, INFO_METHOD);
    }

    @Override
    public PoolElement factory(Node node)
    {
        return new Group(node, client);
    }

    /**
     * Retrieves all the groups in the pool.
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
     * Loads the xml representation of the group pool.
     *
     * @see GroupPool#info(Client)
     */
    public OneResponse info()
    {
        return super.info();
    }

    public Iterator<Group> iterator()
    {
        AbstractList<Group> ab = new AbstractList<Group>()
        {
            public int size()
            {
                return getLength();
            }

            public Group get(int index)
            {
                return (Group) item(index);
            }
        };

        return ab.iterator();
    }

    /**
     * Returns the Group with the given Id from the pool. If it is not found,
     * then returns null. The method {@link #info()} must be called before.
     *
     * @param id of the Group to retrieve
     * @return The Image with the given Id, or null if it was not found.
     */
    public Group getById(int id)
    {
        return (Group) super.getById(id);
    }
}
