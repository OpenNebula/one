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
import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.user.User;
import org.opennebula.client.user.UserPool;

public class UserSample
{
    public static void main(String[] args)
    {
        // Let's try some of the OpenNebula Cloud API functionality.

        // First of all, a Client object has to be created.
        // Here the client will try to connect to OpenNebula using the default
        // options: the auth. file will be assumed to be at $ONE_AUTH, and the
        // endpoint will be set to the environment variable $ONE_XMLRPC.
        Client oneClient;

        try
        {
            oneClient = new Client();
        }
        catch (Exception e)
        {
            System.out.println(e.getMessage());
            return;
        }

        // We will create a user pool and query some information.
        // The info method retrieves and saves internally the information
        // from OpenNebula.
        UserPool    userpool = new UserPool(oneClient);
        OneResponse rc       = userpool.info();

        // The response can be an error, in which case we have access to a
        // human-readable error message.
        if (rc.isError())
        {
            System.out.println(rc.getErrorMessage());
            return;
        }

        // Let's find out the current state of the users pool
        printUserPool(userpool);

        // Now we will try to allocate a new user
        System.out.println("Allocating new user (javaUser,javaPassword)...");
        rc = User.allocate(oneClient, "javaUser", "javaPassword");

        if (rc.isError())
        {
            System.out.println(rc.getErrorMessage());
            return;
        }

        // If the allocation was successful, then the response message contains
        // the new user's ID.
        int userID = Integer.parseInt( rc.getMessage() );
        System.out.println("The allocation request returned this ID: " + userID);

        // We can create a representation for the new user, using the returned
        // user-ID
        User javaUser = new User(userID, oneClient);

        // And request its information
        rc = javaUser.info();

        // Alternatively we could have requested the user's info with the
        // static info method:
        // rc = User.info(oneClient, userID);
        // and processed the xml returned in the message of the OneResponse.

        if (rc.isError())
        {
            System.out.println(rc.getErrorMessage());
            return;
        }

        // This is how the info returned looks like...
        System.out.println("Info for " + javaUser.xpath("name") + "...");
        System.out.println(rc.getMessage());

        // Wait a second... what was that xpath method for?
        // Now that we have the user's info loaded, we can use xpath expressions
        // without parsing and initializing any xml, as simple as
        // String name = javaUser.xpath("name");

        // The user pool information is now outdated, so we need to call the
        // info method again
        userpool.info();
        printUserPool(userpool);

        // Let's delete this new user, using its ID
        System.out.println("Deleting " + javaUser.getName() + "...");
        rc = javaUser.delete();

        if (rc.isError())
        {
            System.out.println(rc.getErrorMessage());
            return;
        }

        // Now the pool information is outdated again, it is time to reload it.
        userpool.info();
        printUserPool(userpool);
    }

    public static void printUserPool (UserPool up)
    {
        System.out.println("--------------------------------------------");
        System.out.println("Number of users: " + up.getLength());
        System.out.println("User ID\t\tName\t\tEnabled");

        // You can use the for-each loops with the OpenNebula pools
        for( User user : up )
        {
            String id   = user.getId();
            String name = user.getName();
            String enab = user.xpath("enabled");

            System.out.println(id+"\t\t"+name+"\t\t"+enab);
        }

        System.out.println("--------------------------------------------");
    }
}
