// Експорт схеми в PNG тим самим кодом, що й File > Export Image у Logisim Evolution 5.0.0
// (circuit.draw з ComponentDrawContext). Аргументи: <file.circ> <out.png> <scale> <printerView:true|false>
import com.cburch.logisim.circuit.CircuitState;
import com.cburch.logisim.comp.ComponentDrawContext;
import com.cburch.logisim.file.Loader;
import com.cburch.logisim.proj.Project;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import javax.imageio.ImageIO;

public class ExportCircuitPng {
  public static void main(String[] a) {
    try {
      var file = new Loader(null).openLogisimFile(new File(a[0]));
      var proj = new Project(file);
      var circ = file.getMainCircuit();
      double scale = Double.parseDouble(a[2]);
      boolean printer = Boolean.parseBoolean(a[3]);
      var probe = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB).createGraphics();
      var bds = circ.getBounds(probe).expand(10); // BORDER_SIZE як у ExportImage
      int w = (int) Math.round(bds.getWidth() * scale), h = (int) Math.round(bds.getHeight() * scale);
      var img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
      Graphics base = img.getGraphics();
      Graphics2D g = (Graphics2D) base.create();
      g.setColor(Color.WHITE); g.fillRect(0, 0, w, h);
      g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
      g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
      g.scale(scale, scale);
      g.translate(-bds.getX(), -bds.getY());
      CircuitState st = proj.getCircuitState(circ);
      var ctx = new ComponentDrawContext(new Canvas(), circ, st, base, g, printer);
      // У Logisim 5.0.0 T-тригер (вигляд logisim_evolution) малює свій підпис поточним кольором,
      // який у printer view лишається білим -> DD7/DD8 зникають. Тому тригери малюємо окремо після
      // решти схеми, попередньо виставивши чорний колір.
      var ffs = new java.util.ArrayList<com.cburch.logisim.comp.Component>();
      for (var c : circ.getNonWires()) if (c.getFactory().getName().equals("T Flip-Flop")) ffs.add(c);
      circ.draw(ctx, ffs);
      for (var c : ffs) { g.setColor(Color.BLACK); c.draw(ctx); }
      ImageIO.write(img, "PNG", new File(a[1]));
      System.out.println("OK " + a[1] + " " + w + "x" + h);
    } catch (Throwable t) { t.printStackTrace(); System.exit(1); }
    System.exit(0);
  }
}
