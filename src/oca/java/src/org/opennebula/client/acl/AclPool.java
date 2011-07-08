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
package org.opennebula.client.acl;

import java.util.AbstractList;
import java.util.Iterator;


import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.Pool;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula ACL rule pool.
 * It also offers static XML-RPC call wrappers.
 */
public class AclPool extends Pool implements Iterable<Acl>{

    private static final String ELEMENT_NAME = "ACL";
    private static final String INFO_METHOD  = "acl.info";

    /**
     * Creates a new ACL rule pool
     * @param client XML-RPC Client.
     */
    public AclPool(Client client)
    {
        super(ELEMENT_NAME, client);
    }

    @Override
    public PoolElement factory(Node node)
    {
        return new Acl(node, client);
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
        return client.call(INFO_METHOD);
    }

    /**
     * Loads the xml representation of the ACL rule pool.
     *
     * @see AclPool#info(Client)
     */
    public OneResponse info()
    {
        OneResponse response = info(client);
        super.processInfo(response);
        return response;
    }

    public Iterator<Acl> iterator()
    {
        AbstractList<Acl> ab = new AbstractList<Acl>()
        {
            public int size()
            {
                return getLength();
            }

            public Acl get(int index)
            {
                return (Acl) item(index);
            }
        };

        return ab.iterator();
    }

    public Acl getById(int id)
    {
        return (Acl) super.getById(id);
    }
}
