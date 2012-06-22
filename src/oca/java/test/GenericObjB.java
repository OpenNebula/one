import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.document.Document;
import org.w3c.dom.Node;

public class GenericObjB extends Document
{
    private static final int TYPE = 201;

    public GenericObjB(int id, Client client)
    {
        super(id, client);
    }

    public GenericObjB(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }


    public static OneResponse allocate(Client client, String description)
    {
        return Document.allocate(client, description, TYPE);
    }
}