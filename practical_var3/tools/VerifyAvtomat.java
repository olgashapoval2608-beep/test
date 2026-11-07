// Автоматична перевірка avtomat_var3.circ симулятором Logisim Evolution 5.0.0.
// Компіляція і запуск: див. tools/run_verify.sh
import com.cburch.logisim.circuit.Circuit;
import com.cburch.logisim.circuit.CircuitState;
import com.cburch.logisim.comp.Component;
import com.cburch.logisim.data.Location;
import com.cburch.logisim.data.Value;
import com.cburch.logisim.file.Loader;
import com.cburch.logisim.instance.Instance;
import com.cburch.logisim.instance.StdAttr;
import com.cburch.logisim.proj.Project;
import com.cburch.logisim.std.wiring.Pin;
import java.io.File;
import java.io.PrintWriter;
import java.util.*;

public class VerifyAvtomat {
  static CircuitState st;
  static Map<String, Instance> pins = new HashMap<>();
  static Map<String, Location> gateOut = new LinkedHashMap<>();
  static Map<String, String> gateNet = new LinkedHashMap<>();

  static void set(String p, int v) {
    Pin.FACTORY.driveInputPin(st.getInstanceState(pins.get(p)), v == 1 ? Value.TRUE : Value.FALSE);
    st.markComponentAsDirty(pins.get(p).getComponent()); // як Poke Tool у GUI
  }
  static void prop() {
    st.getPropagator().propagate();
    if (st.getPropagator().isOscillating()) throw new RuntimeException("oscillation");
  }
  static String get(String p) { return Pin.FACTORY.getValue(st.getInstanceState(pins.get(p))).toDisplayString(); }
  static String net(Location l) { return st.getValue(l).toDisplayString(); }
  static void reset() { set("C", 0); set("x1", 0); set("x2", 0); set("R", 1); prop(); set("R", 0); prop(); }
  static void clock() { set("C", 1); prop(); set("C", 0); prop(); }
  static void in(int x1, int x2) { set("x1", x1); set("x2", x2); prop(); }
  static String q() { return get("Q1") + get("Q2"); }
  static int b(String s, int i) { return s.charAt(i) - '0'; }

  public static void main(String[] args) {
    try { run(args); } catch (Throwable t) { t.printStackTrace(); System.exit(2); }
  }

  static void run(String[] args) throws Exception {
    var file = new Loader(null).openLogisimFile(new File(args[0]));
    var proj = new Project(file);
    Circuit circ = file.getMainCircuit();
    int nor = 0, tff = 0, pin = 0, other = 0;
    for (Component c : circ.getNonWires()) {
      String f = c.getFactory().getName();
      String label = c.getAttributeSet().getValue(StdAttr.LABEL);
      switch (f) {
        case "NOR Gate" -> { nor++; gateOut.put(label, c.getLocation()); }
        case "T Flip-Flop" -> tff++;
        case "Pin" -> { pin++; pins.put(label, (Instance) ((com.cburch.logisim.instance.InstanceComponent) c).getInstance()); }
        case "Text" -> {}
        default -> other++;
      }
    }
    String[][] names = {{"DD1.1","nx1"},{"DD1.2","nx2"},{"DD1.3","a1"},{"DD1.4","a2"},{"DD2.1","a3"},{"DD2.2","a4"},
      {"DD2.3","T1"},{"DD2.4","b1"},{"DD3.1","b2"},{"DD3.2","b3"},{"DD3.3","b4"},{"DD3.4","T2"},{"DD4.1","c1"},
      {"DD4.2","c2"},{"DD4.3","y1"},{"DD4.4","d1"},{"DD5.1","d2"},{"DD5.2","d3"},{"DD5.3","d4"},{"DD5.4","d5"},{"DD6.1","y2"}};
    for (var n : names) gateNet.put(n[0].replace(".", "_"), n[1]);

    st = CircuitState.createRootState(proj, circ, Thread.currentThread());
    var out = new PrintWriter(args[1], "UTF-8");
    out.println("# Результати перевірки avtomat_var3.circ\n");
    out.println("Симулятор: Logisim Evolution 5.0.0 (рушій симуляції з logisim-evolution-5.0.0-all.jar, без GUI).\n");
    out.printf("Склад схеми (порахував Logisim): NOR Gate (2 входи) = %d, T Flip-Flop = %d, Pin = %d, інших елементів = %d.%n%n", nor, tff, pin, other);

    // ---------------- 1. тестова послідовність
    String[][] seq = { // x1x2, y1y2 очік., Q1Q2 після очік.
      {"00","00","00"},{"01","00","01"},{"01","10","01"},{"00","01","00"},{"01","00","01"},{"10","00","11"},
      {"10","10","11"},{"00","11","10"},{"11","11","10"},{"01","00","11"},{"00","11","10"},{"00","01","00"}};
    reset();
    out.println("## 1. Тестова послідовність (12 тактів)\n");
    out.println("Після скидання R (стан 00). y1y2 зчитано ДО переднього фронту C, Q1Q2 – ПІСЛЯ.\n");
    out.println("| Такт | Q1Q2 до | Вхід x1x2 | T1T2 | y1y2 очікувано | y1y2 отримано | Q1Q2 після очікувано | Q1Q2 після отримано | Збіг |");
    out.println("|---|---|---|---|---|---|---|---|---|");
    int ok = 0;
    for (int i = 0; i < seq.length; i++) {
      String before = q();
      in(b(seq[i][0], 0), b(seq[i][0], 1));
      String t = get("T1") + get("T2");
      String y = get("y1") + get("y2");
      clock();
      String after = q();
      boolean m = y.equals(seq[i][1]) && after.equals(seq[i][2]);
      if (m) ok++;
      out.printf("| %d | %s | %s | %s | %s | %s | %s | %s | %s |%n", i + 1, before, seq[i][0], t, seq[i][1], y, seq[i][2], after, m ? "так" : "НІ");
    }
    out.printf("%nЗбіглося тактів: **%d з %d**.%n%n", ok, seq.length);

    // ---------------- 2. статична перевірка комбінаційної частини
    String[] states = {"00", "01", "11", "10"};
    String[][] path = {{}, {"01"}, {"01", "10"}, {"01", "10", "00"}}; // як дійти до стану
    Map<String, String[]> table = new HashMap<>(); // "Q1Q2,x1x2" -> {next, out}
    String[][] tr = {{"00","00","00","00"},{"00","01","01","00"},{"01","00","00","01"},{"01","01","01","10"},
      {"01","10","11","00"},{"11","00","10","11"},{"11","10","11","10"},{"10","00","00","01"},{"10","01","11","00"},{"10","11","10","11"}};
    for (var r : tr) table.put(r[0] + "," + r[1], new String[]{r[2], r[3]});
    String[] an = {"a1","a2","a3","a4","b1","b2","b3","b4","c1","c2","c3","d1","d2","d3","d4","d5"};
    out.println("## 2. Статична перевірка комбінаційної частини (без тактового фронту)\n");
    out.println("Для кожного стану тригерів (досягнутого скиданням і тактами) подано всі 4 вхідні набори без такту;");
    out.println("зчитано T1, T2, y1, y2 і значення на виході кожного з 21 елемента NOR. Новий стан = Q xor T.\n");
    out.println("| Q1Q2 | x1x2 | T1T2 | y1y2 | Новий стан Q⊕T | За таблицею переходів | Збіг |");
    out.println("|---|---|---|---|---|---|---|");
    int defOk = 0, defN = 0, nodeErr = 0;
    List<String> nodeErrors = new ArrayList<>();
    for (int s = 0; s < 4; s++) {
      for (int x = 0; x < 4; x++) {
        reset();
        for (String p : path[s]) { in(b(p, 0), b(p, 1)); clock(); }
        String cur = q();
        if (!cur.equals(states[s])) throw new RuntimeException("не досягнуто стан " + states[s]);
        int x1 = x >> 1, x2 = x & 1, Q1 = b(cur, 0), Q2 = b(cur, 1);
        in(x1, x2);
        String t = get("T1") + get("T2"), y = get("y1") + get("y2");
        String nxt = "" + (Q1 ^ b(t, 0)) + (Q2 ^ b(t, 1));
        // очікувані значення внутрішніх вузлів за списком з'єднань
        int nx1 = 1 - x1, nx2 = 1 - x2, nQ1 = 1 - Q1, nQ2 = 1 - Q2;
        Map<String, Integer> e = new LinkedHashMap<>();
        e.put("nx1", nx1); e.put("nx2", nx2);
        e.put("a1", nr(Q1, x1)); e.put("a2", nr(nQ1, nQ2)); e.put("a3", nr(x2, e.get("a1"))); e.put("a4", nr(e.get("a3"), e.get("a3")));
        e.put("T1", nr(e.get("a4"), e.get("a2")));
        e.put("b1", nr(Q2, x2)); e.put("b2", nr(nQ2, nx2)); e.put("b3", nr(x1, e.get("b1"))); e.put("b4", nr(e.get("b3"), e.get("b3")));
        e.put("T2", nr(e.get("b4"), e.get("b2")));
        e.put("c1", nr(Q2, x1)); e.put("c2", nr(Q1, x2)); e.put("y1", nr(e.get("c1"), e.get("c2")));
        e.put("d1", nr(x1, nx2)); e.put("d2", nr(nx1, x2)); e.put("d3", nr(Q1, Q2)); e.put("d4", nr(e.get("d1"), e.get("d2")));
        e.put("d5", nr(e.get("d4"), e.get("d4"))); e.put("y2", nr(e.get("d5"), e.get("d3")));
        // формули МКНФ
        int fT1 = (1 - x2) & (Q1 | x1) & (nQ1 | nQ2), fT2 = (1 - x1) & (Q2 | x2) & (nQ2 | nx2);
        int fy1 = (Q2 | x1) & (Q1 | x2), fy2 = (x1 | nx2) & (nx1 | x2) & (Q1 | Q2);
        if (e.get("T1") != fT1 || e.get("T2") != fT2 || e.get("y1") != fy1 || e.get("y2") != fy2)
          nodeErrors.add("список з'єднань не відповідає МКНФ при Q=" + cur + " x=" + x1 + x2);
        for (var g : gateNet.entrySet()) {
          String got = net(gateOut.get(g.getKey()));
          if (!got.equals("" + e.get(g.getValue()))) { nodeErr++; nodeErrors.add(g.getKey() + "->" + g.getValue() + " Q=" + cur + " x=" + x1 + x2 + ": " + got + " замість " + e.get(g.getValue())); }
        }
        if (!t.equals("" + fT1 + fT2) || !y.equals("" + fy1 + fy2)) nodeErrors.add("виходи не збіглися з МКНФ при Q=" + cur + " x=" + x1 + x2);
        String[] def = table.get(cur + "," + x1 + x2);
        String ref = def == null ? "не визначено (байдужий)" : "→ " + def[0] + " / " + def[1];
        String m = "–";
        if (def != null) { defN++; boolean okk = def[0].equals(nxt) && def[1].equals(y); if (okk) defOk++; m = okk ? "так" : "НІ"; }
        out.printf("| %s | %s | %s | %s | %s | %s | %s |%n", cur, "" + x1 + x2, t, y, nxt, ref, m);
      }
    }
    out.printf("%nВизначених переходів збіглося: **%d з %d**.%n", defOk, defN);
    out.printf("Перевірка внутрішніх вузлів (21 вихід NOR × 16 наборів = 336 значень) і формул МКНФ: %s.%n",
        nodeErrors.isEmpty() ? "**усі збіглися**" : "ПОМИЛКИ: " + nodeErrors);
    out.close();
    System.out.println("seq " + ok + "/12, static " + defOk + "/" + defN + ", node errors " + nodeErrors.size()
        + " | NOR=" + nor + " TFF=" + tff + " pins=" + pin + " other=" + other);
    proj.getSimulator().shutDown();
    System.exit(ok == 12 && defOk == defN && nodeErrors.isEmpty() ? 0 : 1);
  }
  static int nr(int a, int b) { return (a | b) == 1 ? 0 : 1; }
}
