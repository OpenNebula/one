/*******************************************************************************
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems
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

import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.PoolElement;
import org.w3c.dom.Node;


/**
 * This class represents an OpenNebula User.
 * It also offers static XML-RPC call wrappers.
 */
public class User extends PoolElement{

    private static final String METHOD_PREFIX   = "user.";
    private static final String ALLOCATE        = METHOD_PREFIX + "allocate";
    private static final String INFO            = METHOD_PREFIX + "info";
    private static final String DELETE          = METHOD_PREFIX + "delete";
    private static final String PASSWD          = METHOD_PREFIX + "passwd";
    private static final String CHGRP           = METHOD_PREFIX + "chgrp";
    private static final String CHAUTH          = METHOD_PREFIX + "chauth";
    private static final String UPDATE          = METHOD_PREFIX + "update";
    private static final String QUOTA           = METHOD_PREFIX + "quota";
    private static final String ADDGROUP        = METHOD_PREFIX + "addgroup";
    private static final String DELGROUP        = METHOD_PREFIX + "delgroup";
    private static final String LOGIN           = METHOD_PREFIX + "login";

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
        Integer[] empty = new Integer[0];

        return allocate(client, username, password, "", empty);
    }

    /**
     * Allocates a new user in OpenNebula.
     *
     * @param client XML-RPC Client.
     * @param username Username for the new user.
     * @param password Password for the new user
     * @param auth Auth driver for the new user.
     * @param gids Group IDs. The first ID will be used as the main group. This
     * array can be empty, in which case the default group will be used.
     * @return If successful the message contains
     * the associated id (int uid) generated for this user.
     */
    public static OneResponse allocate(Client client,
                                       String username,
                                       String password,
                                       String auth,
                                       Integer[]  gids)
    {
        return client.call(ALLOCATE, username, password, auth, gids);
    }

    /** Retrieves the information of the given user.
     *
     * @param client XML-RPC Client.
     * @param id The user id (uid) for the user to
     * retrieve the information from.
     * @return if successful the message contains the
     * string with the information about the user returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id)
    {
        return client.call(INFO, id);
    }

    /**
     * Retrieves the information of the given User.
     *
     * @param client XML-RPC Client.
     * @param id The User id for the User to retrieve the information from
     * @param decrypt If true decrypt sensitive attributes
     * @return If successful the message contains the string
     * with the information returned by OpenNebula.
     */
    public static OneResponse info(Client client, int id, boolean decrypt)
    {
        return client.call(INFO, id, decrypt);
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

    /**
     * Changes the main group of the given user
     *
     * @param client XML-RPC Client.
     * @param id The user id (uid) of the target user we want to modify.
     * @param gid The new group ID.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chgrp(Client client, int id, int gid)
    {
        return client.call(CHGRP, id, gid);
    }

    /**
     * Adds the User to a secondary group
     *
     * @param client XML-RPC Client.
     * @param id The user id (uid) of the target user we want to modify.
     * @param gid The new group ID.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse addgroup(Client client, int id, int gid)
    {
        return client.call(ADDGROUP, id, gid);
    }

    /**
     * Removes the User from a secondary group. Fails if the
     * group is the main one
     *
     * @param client XML-RPC Client.
     * @param id The user id (uid) of the target user we want to modify.
     * @param gid The group ID.
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse delgroup(Client client, int id, int gid)
    {
        return client.call(DELGROUP, id, gid);
    }

    /**
     * Changes the auth driver and the password of the given user
     *
     * @param client XML-RPC Client.
     * @param id The user id (uid) of the target user we want to modify.
     * @param auth The new auth driver.
     * @param password The new password. If it is an empty string,
     * the user password is not changed
     * @return If an error occurs the error message contains the reason.
     */
    public static OneResponse chauth(Client client,
                                    int id,
                                    String auth,
                                    String password)
    {
        return client.call(CHAUTH, id, auth, password);
    }

    /**
     * Replaces the user template contents.
     *
     * @param client XML-RPC Client.
     * @param id The user id of the target user we want to modify.
     * @param new_template New template contents.
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the user id.
     */
    public static OneResponse update(Client client, int id, String new_template,
        boolean append)
    {
        return client.call(UPDATE, id, new_template, append ? 1 : 0);
    }

    /**
     * Replaces the user quota template contents.
     *
     * @param client XML-RPC Client.
     * @param id The user id of the target user we want to modify.
     * @param quota_template New quota template contents.
     * @return If successful the message contains the user id.
     */
    public static OneResponse setQuota(Client client, int id, String quota_template)
    {
        return client.call(QUOTA, id, quota_template);
    }

    /**
     * Sets the LOGIN_TOKEN for the user
     *
     * @param username of the user
     * @param token the login token, if empty OpenNebula will
     *   generate one
     * @param expire valid period of the token in secs. If &lt;= 0
     *   the token will be reset
     * @return token in case of success, Error otherwise
     */
    public static OneResponse login(Client client,
                                    String username,
                                    String token,
                                    int expire)
    {
        return login(client, username, token, expire, -1);
    }

    /**
     * Sets the LOGIN_TOKEN for the user
     *
     * @param username of the user
     * @param token the login token, if empty OpenNebula will
     *   generate one
     * @param expire valid period of the token in secs. If &lt;= 0
     *   the token will be reset
     * @param egid effective GID to use with this token. To use the
     *   current GID and user groups set it to -1
     * @return token in case of success, Error otherwise
     */
    public static OneResponse login(Client client,
                                    String username,
                                    String token,
                                    int expire,
                                    int egid)
    {
        return client.call(LOGIN, username, token, expire, egid);
    }

    // =================================
    // Instanced object XML-RPC methods
    // =================================

    /**
     * Loads the xml representation of the user.
     * The info is also stored internally.
     *
     * @see User#info(Client, int)
     */
    public OneResponse info()
    {
        OneResponse response = info(client, id);
        super.processInfo(response);

        return response;
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

    /**
     * Changes the main group of the given user
     *
     * @param gid The new group ID.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse chgrp(int gid)
    {
        return chgrp(client, id, gid);
    }

    /**
     * Adds the User to a secondary group
     *
     * @param gid The new group ID.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse addgroup(int gid)
    {
        return addgroup(client, id, gid);
    }

    /**
     * Removes the User from a secondary group. Fails if the
     * group is the main one
     *
     * @param gid The group ID.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse delgroup(int gid)
    {
        return delgroup(client, id, gid);
    }

    /**
     * Changes the auth driver and the password of the given user
     *
     * @param auth The new auth driver.
     * @param password The new password. If it is an empty string,
     * the user password is not changed
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse chauth(String auth, String password)
    {
        return chauth(client, id, auth, password);
    }

    /**
     * Changes the auth driver of the given user
     *
     * @param auth The new auth driver.
     * @return If an error occurs the error message contains the reason.
     */
    public OneResponse chauth(String auth)
    {
        return chauth(auth, "");
    }

    /**
     * Replaces the user template contents.
     *
     * @param new_template New template contents.
     * @return If successful the message contains the user id.
     */
    public OneResponse update(String new_template)
    {
        return update(new_template, false);
    }

    /**
     * Replaces the user template contents.
     *
     * @param new_template New template contents.
     * @param append True to append new attributes instead of replace the whole template
     * @return If successful the message contains the user id.
     */
    public OneResponse update(String new_template, boolean append)
    {
        return update(client, id, new_template, append);
    }

    /**
     * Replaces the user quota template contents.
     *
     * @param quota_template New quota template contents.
     * @return If successful the message contains the user id.
     */
    public OneResponse setQuota(String quota_template)
    {
        return setQuota(client, id, quota_template);
    }

    /**
     * Sets the LOGIN_TOKEN for the user. The method info() must be called before.
     *
     * @param token the login token, if empty OpenNebula will
     *   generate one
     * @param expire valid period of the token in secs. If &lt;= 0
     *   the token will be reset
     * @return token in case of success, Error otherwise
     */
    public OneResponse login(String token, int expire)
    {
        return client.call(LOGIN, getName(), token, expire);
    }

    /**
     * Sets the LOGIN_TOKEN for the user. The method info() must be called before.
     *
     * @param token the login token, if empty OpenNebula will
     *   generate one
     * @param expire valid period of the token in secs. If &lt;= 0
     *   the token will be reset
     * @param egid effective GID to use with this token. To use the
     *   current GID and user groups set it to -1
     * @return token in case of success, Error otherwise
     */
    public OneResponse login(String token, int expire, int egid)
    {
        return client.call(LOGIN, getName(), token, expire, egid);
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
        return enabled != null && enabled.equals("1");
    }
}
