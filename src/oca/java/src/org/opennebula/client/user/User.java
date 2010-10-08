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

import java.io.ByteArrayInputStream;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPathConstants;

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Document;
import org.w3c.dom.Node;


/**
 * This class represents an OpenNebula User.
 * It also offers static XML-RPC call wrappers.
 */
public class User extends PoolElement{

    private static final String METHOD_PREFIX   = "user.";
    private static final String ALLOCATE        = METHOD_PREFIX + "allocate";
    private static final String DELETE          = METHOD_PREFIX + "delete";
    private static final String PASSWD          = METHOD_PREFIX + "passwd";
    
    /**
     * Creates a new User representation.
     * 
     * @param id The user id (uid).
     * @param client XML-RPC Client.
     */
    public User(int id, Client client) 
    {
        super(id, client);
    }

    /**
     * @see PoolElement 
     */
    protected User(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }


    // =================================
    // Static XML-RPC methods
    // =================================

    /**
     * Allocates a new user in OpenNebula.
     * 
     * @param client XML-RPC Client.
     * @param username Username for the new user.
     * @param password Password for the new user 
     * @return If successful the message contains
     * the associated id (int uid) generated for this user.
     */
    public static OneResponse allocate(Client client,
                                       String username,
                                       String password)
    {
        return client.call(ALLOCATE, username, password);
    }
    
    /**
     * Deletes a user from OpenNebula.
     * 
     * @param client XML-RPC Client.
     * @param id The user id (uid) of the target user we want to delete. 
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse delete(Client client, int id)
    {
        return client.call(DELETE, id);
    }

    /**
     * Changes the password for the given user.
     * 
     * @param client XML-RPC Client.
     * @param id The user id (uid) of the target user we want to modify.
     * @param password The new password.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse passwd(Client client, int id, String password)
    {
        return client.call(PASSWD, id, password);
    }

    // =================================
    // Instanced object XML-RPC methods
    // =================================
    
    /**
     * Loads the xml representation of the user.
     * The info is also stored internally.
     * 
     */
    public OneResponse info()
    {
        OneResponse response = client.call("userpool.info");
        if(response.isError())
        {
            return response;
        }
        else
        {
            try
            {
                DocumentBuilder builder =
                    DocumentBuilderFactory.newInstance().newDocumentBuilder();
                Document doc = builder.parse(
                    new ByteArrayInputStream(response.getMessage().getBytes()));

                xml = (Node) xpath.evaluate(    "/USER_POOL/USER[ID="+id+"]",
                                                doc.getDocumentElement(),
                                                XPathConstants.NODE);
            }
            catch (Exception e) {}

            return response;
        }
    }

    /**
     * Deletes the user from OpenNebula.
     * 
     * @see User#delete(Client, int)
     */
    public OneResponse delete()
    {
        return delete(client, id);
    }

    /**
     * Changes the password for the user.
     * 
     * @param password The new password.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse passwd(String password)
    {
        return passwd(client, id, password);
    }

    // =================================
    // Helpers
    // =================================

    /**
     * Returns true if the user is enabled.
     * 
     * @return True if the user is enabled.
     */
    public boolean isEnabled()
    {
        String enabled = xpath("ENABLED");
        return enabled != null && enabled.toLowerCase().equals("true");
    }
}
