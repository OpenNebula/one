import java.util.AbstractList;
import java.util.Iterator;

import org.opennebula.client.Client;
import org.opennebula.client.document.DocumentPool;
import org.w3c.dom.Node;


public class GenericObjBPool extends DocumentPool implements Iterable<GenericObjB>
{
    private static final int TYPE = 201;

    @Override
    protected int type()
    {
        return TYPE;
    }

    public GenericObjBPool(Client client)
    {
        super(client);
    }

    public GenericObjBPool(Client client, int filter)
    {
        super(client, filter);
    }

    @Override
    public GenericObjB factory(Node node)
    {
        return new GenericObjB(node, client);
    }

    @Override
    public Iterator<GenericObjB> iterator()
    {
        AbstractList<GenericObjB> ab = new AbstractList<GenericObjB>()
        {
            public int size()
            {
                return getLength();
            }

            public GenericObjB get(int index)
            {
                return (GenericObjB) item(index);
            }
        };

        return ab.iterator();
    }
}
