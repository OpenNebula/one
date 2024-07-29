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

public class SessionInit {

    public static void main(String[] args)
    {
        System.out.print("Creating a new OpenNebula session...");

        try
        {
            Client oneClient = new Client();
            System.out.println(" ok");
        }
        catch (Exception e)
        {
            System.out.println(e.getMessage());
        }


        System.out.println("Forcing a wrong user/password initialization...");
        try
        {
            // The secret string should be user:password. The url is null, so it
            // will be set to default.
            Client oneClient = new Client("wrong_password_token",null);
        }
        catch (Exception e)
        {
            System.out.println("\t" + e.getMessage());
        }

        System.out.println("Forcing a wrong url initialization...");
        try
        {
            // The HTTP is misspelled
            Client oneClient = new Client(null,"HTP://localhost:2633/RPC2");
        }
        catch (Exception e)
        {
            System.out.println("\t" + e.getMessage());
        }
    }
}
