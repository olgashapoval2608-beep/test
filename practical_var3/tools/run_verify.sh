#!/bin/sh
# Перевірка схеми симулятором Logisim Evolution 5.0.0 (без GUI).
# Використання: sh tools/run_verify.sh [шлях/до/logisim-evolution-5.0.0-all.jar]
set -e
cd "$(dirname "$0")/.."
JAR=${1:-/opt/logisim/logisim-evolution-5.0.0-all.jar}
OUT=$(mktemp -d)
javac -encoding UTF-8 -cp "$JAR" -d "$OUT" tools/VerifyAvtomat.java
java -Djava.awt.headless=true -cp "$JAR:$OUT" VerifyAvtomat avtomat_var3.circ results_verification.md
# офіційна статистика елементів з консольного режиму Logisim (--tty stats)
{
  printf '\n## 3. Статистика елементів (java -jar logisim-evolution-5.0.0-all.jar avtomat_var3.circ --tty stats)\n\n```\n'
  java -jar "$JAR" avtomat_var3.circ --tty stats 2>/dev/null | grep -v 'INFO\|prefs'
  printf '```\n'
} >> results_verification.md
