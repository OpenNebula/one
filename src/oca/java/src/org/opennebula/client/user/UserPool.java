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
package org.opennebula.client.user;

import java.util.AbstractList;
import java.util.Iterator;


import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.Pool;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;

/**
 * This class represents an OpenNebula user pool.
 * It also offers static XML-RPC call wrappers.
 */
public class UserPool extends Pool implements Iterable<User>{

    private static final String ELEMENT_NAME = "USER";
    private static final String INFO_METHOD  = "userpool.info";

    /**
     * Creates a new user pool
     * @param client XML-RPC Client.
     */
    public UserPool(Client client)
    {
        super(ELEMENT_NAME, client);
    }

    @Override
    public PoolElement factory(Node node)
    {
        return new User(node, client);
    }

    /**
     * Loads the xml representation of the user pool.
     */
    public OneResponse info()
    {
        OneResponse response = client.call(INFO_METHOD);

        super.processInfo(response);

        return response;
    }

    public Iterator<User> iterator()
    {
        AbstractList<User> ab = new AbstractList<User>()
        {
            public int size()
            {
                return getLength();
            }

            public User get(int index)
            {
                return (User) item(index);
            }
        };

        return ab.iterator();
    }
}
