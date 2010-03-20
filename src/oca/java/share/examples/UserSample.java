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
import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.user.User;
import org.opennebula.client.user.UserPool;

public class UserSample
{
    public static void main(String[] args)
    {
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

        UserPool    userpool = new UserPool(oneClient);
        OneResponse rc       = userpool.info();

        if (rc.isError())
        {
            System.out.println(rc.getErrorMessage());
            return;
        }

        printUserPool(userpool);

        System.out.println("Allocating new user (javaUser,javaPassword)...");
        rc = User.allocate(oneClient, "javaUser", "javaPassword");

        if (rc.isError())
        {
            System.out.println(rc.getErrorMessage());
            return;
        }

        User javaUser = new User(Integer.parseInt(rc.getMessage()),oneClient);

        rc = javaUser.info();

        if (rc.isError())
        {
            System.out.println(rc.getErrorMessage());
            return;
        }

        System.out.println("Info for " + javaUser.xpath("name") + "...");
        System.out.println(rc.getMessage());

        userpool.info();
        printUserPool(userpool);

        System.out.println("Deleting " + javaUser.getName() + "...");
        rc = javaUser.delete();

        if (rc.isError())
        {
            System.out.println(rc.getErrorMessage());
            return;
        }

        userpool.info();
        printUserPool(userpool);
    }

    public static void printUserPool (UserPool up)
    {
        System.out.println("--------------------------------------------");
        System.out.println("Number of users: " + up.getLength());
        System.out.println("User ID\t\tName\t\tEnabled");

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
