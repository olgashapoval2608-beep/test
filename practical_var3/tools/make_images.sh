#!/bin/sh
# Експорт PNG: схема (код File > Export Image) і часова діаграма (вікно Simulate > Timing Diagram).
# Використання: sh tools/make_images.sh [шлях/до/logisim-evolution-5.0.0-all.jar]
set -e
cd "$(dirname "$0")/.."
JAR=${1:-/opt/logisim/logisim-evolution-5.0.0-all.jar}
OUT=$(mktemp -d)
mkdir -p screenshots
javac -encoding UTF-8 -cp "$JAR" -d "$OUT" tools/ExportCircuitPng.java tools/ExportChronogram.java
java -Djava.awt.headless=true -cp "$JAR:$OUT" ExportCircuitPng avtomat_var3.circ screenshots/scheme_avtomat_var3.png 2 true
java -Djava.awt.headless=true -cp "$JAR:$OUT" ExportCircuitPng avtomat_var3.circ screenshots/scheme_avtomat_var3_color.png 2 false
xvfb-run -a -s "-screen 0 1920x1080x24" java -cp "$JAR:$OUT" ExportChronogram avtomat_var3.circ screenshots/timing_diagram.png
