// Знімок вікна Simulate > Timing Diagram (Chronogram) Logisim Evolution 5.0.0 для тестової послідовності.
// Запуск під графічним дисплеєм (напр. xvfb-run). Аргументи: <file.circ> <out.png>
import com.cburch.logisim.circuit.CircuitState;
import com.cburch.logisim.comp.Component;
import com.cburch.logisim.data.Value;
import com.cburch.logisim.file.Loader;
import com.cburch.logisim.gui.log.*;
import com.cburch.logisim.gui.chrono.ChronoPanel;
import com.cburch.logisim.instance.StdAttr;
import com.cburch.logisim.proj.Project;
import com.cburch.logisim.std.wiring.Pin;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.util.*;
import java.util.List;
import javax.imageio.ImageIO;
import javax.swing.*;

public class ExportChronogram {
  static Project proj; static Map<String, Component> pins = new HashMap<>();
  // Одночасна зміна кількох вхідних пінів = один крок діаграми.
  static void set(String[] p, int[] v) throws Exception {
    SwingUtilities.invokeAndWait(() -> {
      CircuitState st = proj.getCircuitState();
      for (int i = 0; i < p.length; i++) {
        Component c = pins.get(p[i]);
        Pin.FACTORY.driveInputPin(st.getInstanceState(c), v[i] == 1 ? Value.TRUE : Value.FALSE);
        st.markComponentAsDirty(c);                 // так само діє Poke Tool
      }
      proj.getSimulator().nudge();
    });
    Thread.sleep(150);
    // зафіксувати новий стабільний стан як один крок діаграми (те саме робить LogFrame після propagation)
  }
  static Model model;
  public static void main(String[] a) {
    try { run(a); } catch (Throwable t) { t.printStackTrace(); System.exit(1); }
    System.exit(0);
  }
  static void run(String[] a) throws Exception {
    var file = new Loader(null).openLogisimFile(new File(a[0]));
    proj = new Project(file);
    var circ = file.getMainCircuit();
    SwingUtilities.invokeAndWait(() -> {
      var fr = new com.cburch.logisim.gui.main.Frame(proj);
      proj.setFrame(fr); proj.getSimulator().setAutoPropagation(true); fr.setSize(1200, 900); fr.setVisible(true);
    });
    for (var c : circ.getNonWires()) if (c.getFactory() instanceof Pin)
      pins.put(c.getAttributeSet().getValue(StdAttr.LABEL), c);
    final LogFrame[] lf = new LogFrame[1];
    SwingUtilities.invokeAndWait(() -> { lf[0] = proj.getLogFrame(); });
    Model m = lf[0].getModel();
    // прибрати сигнали за замовчуванням, додати потрібні в заданому порядку
    SwingUtilities.invokeAndWait(() -> {
      List<SignalInfo> old = new ArrayList<>();
      for (int i = 0; i < m.getSignalCount(); i++) old.add(m.getItem(i));
      m.remove(old);
      List<SignalInfo> sig = new ArrayList<>();
      for (String n : new String[]{"R", "C", "x1", "x2", "Q1", "Q2", "T1", "T2", "y1", "y2"})
        sig.add(new SignalInfo(circ, new Component[]{pins.get(n)}, null));
      m.addOrMove(sig, 0);
      m.setSelected(true);
    });
    model = m;
    System.out.println("simState==projState " + (proj.getSimulator().getCircuitState() == proj.getCircuitState()) + " auto=" + proj.getSimulator().isAutoPropagating() + " modelState==" + (m.getCircuitState() == proj.getCircuitState()));
    String[] seq = {"00","01","01","00","01","10","10","00","11","01","00","00"};
    // Скидання при x1x2 = вхід 1-го такту, далі кожен крок = зміна C:
    // передній фронт C (тригери перемикаються), потім спад C разом з поданням наступного входу.
    // Отже, y1y2 на інтервалі C=0 перед фронтом – це вихід такту, Q1Q2 після фронту – новий стан.
    set(new String[]{"C", "x1", "x2", "R"}, new int[]{0, seq[0].charAt(0) - '0', seq[0].charAt(1) - '0', 1});
    set(new String[]{"R"}, new int[]{0});
    for (int i = 0; i < seq.length; i++) {
      set(new String[]{"C"}, new int[]{1});
      System.out.println("такт " + (i + 1) + " x=" + seq[i] + " Q після=" + val("Q1") + val("Q2"));
      String nx = i + 1 < seq.length ? seq[i + 1] : "00";
      set(new String[]{"C", "x1", "x2"}, new int[]{0, nx.charAt(0) - '0', nx.charAt(1) - '0'});
    }
    Thread.sleep(500);
    SwingUtilities.invokeAndWait(() -> {
      lf[0].setSize(1900, 700); lf[0].setVisible(true);
    });
    Thread.sleep(1500);
    SwingUtilities.invokeAndWait(() -> {
      try {
        ChronoPanel cp = findChrono(lf[0].getContentPane());
        // вибрати вкладку з діаграмою
        JTabbedPane tp = findTabs(lf[0].getContentPane());
        if (tp != null) for (int i = 0; i < tp.getTabCount(); i++)
          if (SwingUtilities.isDescendingFrom(cp, tp.getComponentAt(i))) tp.setSelectedIndex(i);
        lf[0].validate();
        var rp = cp.getRightPanel();
        int vw = cp.getRightViewport().getWidth();
        for (int k = 0; k < 40 && rp.getPreferredSize().width < vw * 0.8; k++) rp.zoom(1, 0);
        for (int k = 0; k < 40 && rp.getPreferredSize().width > vw; k++) rp.zoom(-1, 0);
        System.out.println("right width=" + rp.getPreferredSize().width + " viewport=" + vw);
        System.out.println("signals=" + m.getSignalCount() + " chrono=" + cp.getSize());
      } catch (Exception e) { throw new RuntimeException(e); }
    });
    Thread.sleep(1500);
    SwingUtilities.invokeAndWait(() -> {
      try {
        Container root = lf[0].getContentPane();
        ChronoPanel cp = findChrono(root);
        var img = new BufferedImage(cp.getWidth(), cp.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics(); cp.printAll(g); g.dispose();
        ImageIO.write(img, "PNG", new File(a[1]));
        var rootPane = lf[0].getRootPane();
        var img2 = new BufferedImage(rootPane.getWidth(), rootPane.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g2 = img2.createGraphics(); rootPane.printAll(g2); g2.dispose();
        // обрізати порожнє місце: до кінця останнього сигналу і кінця записаної шкали часу
        Point p0 = SwingUtilities.convertPoint(cp, 0, 0, rootPane);
        int hh = p0.y + ChronoPanel.HEADER_HEIGHT + m.getSignalCount() * ChronoPanel.SIGNAL_HEIGHT + 40;
        Point pr = SwingUtilities.convertPoint(cp.getRightPanel(), 0, 0, rootPane);
        int ww = pr.x + cp.getRightPanel().getPreferredSize().width + 15;
        ImageIO.write(img2.getSubimage(0, 0, Math.min(ww, img2.getWidth()), Math.min(hh, img2.getHeight())), "PNG",
            new File(a[1].replace(".png", "_window.png")));
        // окремо лише панель діаграми (без меню), та сама обрізка
        int cw = Math.min(ww - p0.x, img.getWidth()), ch = Math.min(hh - p0.y, img.getHeight());
        ImageIO.write(img.getSubimage(0, 0, cw, ch), "PNG", new File(a[1]));
      } catch (Exception e) { throw new RuntimeException(e); }
    });
  }
  static String val(String p) { return Pin.FACTORY.getValue(proj.getCircuitState().getInstanceState(pins.get(p))).toDisplayString(); }
  static ChronoPanel findChrono(Container c) {
    for (var ch : c.getComponents()) {
      if (ch instanceof ChronoPanel cp) return cp;
      if (ch instanceof Container cc) { var r = findChrono(cc); if (r != null) return r; }
    }
    return null;
  }
  static JTabbedPane findTabs(Container c) {
    for (var ch : c.getComponents()) {
      if (ch instanceof JTabbedPane t) return t;
      if (ch instanceof Container cc) { var r = findTabs(cc); if (r != null) return r; }
    }
    return null;
  }
}
