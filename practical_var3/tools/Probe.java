import com.cburch.logisim.file.Loader;
import com.cburch.logisim.comp.*;
import java.io.File;
public class Probe {
  public static void main(String[] a) throws Exception {
    var loader = new Loader(null);
    var file = loader.openLogisimFile(new File(a[0]));
    for (var circ : file.getCircuits()) {
      System.out.println("circuit " + circ.getName());
      for (Component c : circ.getNonWires()) {
        System.out.println(c.getFactory().getName() + " @" + c.getLocation() + " attrs=" + c.getAttributeSet().getValue(com.cburch.logisim.instance.StdAttr.APPEARANCE) + " bounds=" + c.getBounds());
        int i = 0;
        for (EndData e : c.getEnds()) System.out.println("   port" + (i++) + " " + e.getLocation() + (e.isOutput() ? " OUT" : " IN"));
      }
    }
    System.exit(0);
  }
}
