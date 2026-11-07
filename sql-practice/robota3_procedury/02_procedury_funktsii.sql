-- Лабораторна робота "Збережені процедури і функції" (база даних avto)

-- ===== Представлення =====
-- Завдання 1. Представлення, що повертає машини, виготовлені в певній країні (Німеччина)
CREATE VIEW v_mashyny_nimechchyna AS
SELECT id, marka, model, kraina, rik, tsina
FROM avto.transport
WHERE kraina = 'Німеччина';

-- Перегляд представлення v_mashyny_nimechchyna
SELECT * FROM avto.v_mashyny_nimechchyna;

-- Завдання 2. Додавання стовпця з вартістю бензину (пального) за 1 л у таблицю transport
ALTER TABLE avto.transport
  ADD vartist_benzynu DECIMAL(6,2);

-- Заповнення стовпця vartist_benzynu залежно від типу пального двигуна
UPDATE avto.transport t, avto.dvyguny d
SET t.vartist_benzynu = IF(d.palyvo = 'дизель', 54.90, 58.50)
WHERE t.dvygun_id = d.id;

-- Таблиця transport після додавання стовпця
SELECT * FROM avto.transport;

-- Представлення із загальною картиною про виробників машин
CREATE VIEW v_vyrobnyky AS
SELECT marka                    AS vyrobnyk,
       kraina,
       COUNT(*)                 AS kilkist_modelei,
       MIN(rik)                 AS rik_vid,
       MAX(rik)                 AS rik_do,
       ROUND(AVG(tsina), 2)     AS serednia_tsina,
       ROUND(AVG(vartist_benzynu), 2) AS vartist_benzynu
FROM avto.transport
GROUP BY marka, kraina;

-- Перегляд представлення v_vyrobnyky
SELECT * FROM avto.v_vyrobnyky;

-- ===== Процедури =====
-- Завдання 1. Процедура, яка відображає характеристики машини за назвою моделі
DELIMITER $$
CREATE PROCEDURE p_kharakterystyky(IN p_model VARCHAR(30))
BEGIN
  SELECT t.marka, t.model, t.kraina, t.rik, t.tsina,
         d.typ, d.obyem, d.potuzhnist, d.palyvo,
         p.nazva AS postachalnyk
  FROM avto.transport t, avto.dvyguny d, avto.postachalnyky p
  WHERE t.dvygun_id = d.id
    AND t.postachalnyk_id = p.id
    AND t.model = p_model;
END $$
DELIMITER ;

-- Виклик процедури p_kharakterystyky
CALL avto.p_kharakterystyky('Camry');

-- Завдання 2. Процедура, яка повертає розрахункову вартість машини з урахуванням податків (мито 10 %, акциз залежно від об'єму двигуна, ПДВ 20 %)
DELIMITER $$
CREATE PROCEDURE p_vartist_z_podatkamy(IN p_id INT)
BEGIN
  DECLARE v_tsina, v_myto, v_aktsyz, v_pdv DECIMAL(12,2);
  DECLARE v_obyem DECIMAL(3,1);
  DECLARE v_stavka DECIMAL(4,2);

  SELECT t.tsina, d.obyem INTO v_tsina, v_obyem
  FROM avto.transport t, avto.dvyguny d
  WHERE t.dvygun_id = d.id AND t.id = p_id;

  IF v_obyem <= 2.0 THEN
    SET v_stavka = 0.05;
  ELSEIF v_obyem <= 3.0 THEN
    SET v_stavka = 0.10;
  ELSE
    SET v_stavka = 0.15;
  END IF;

  SET v_myto   = v_tsina * 0.10;
  SET v_aktsyz = v_tsina * v_stavka;
  SET v_pdv    = (v_tsina + v_myto + v_aktsyz) * 0.20;

  SELECT marka, model, v_tsina AS tsina, v_myto AS myto,
         v_aktsyz AS aktsyz, v_pdv AS pdv,
         v_tsina + v_myto + v_aktsyz + v_pdv AS rozrakhunkova_vartist
  FROM avto.transport WHERE id = p_id;
END $$
DELIMITER ;

-- Виклик процедури p_vartist_z_podatkamy для машини з id = 4 (BMW X5)
CALL avto.p_vartist_z_podatkamy(4);

-- Виклик процедури p_vartist_z_podatkamy для машини з id = 7 (Renault Logan)
CALL avto.p_vartist_z_podatkamy(7);

-- Завдання 3. Процедура, яка за допомогою умовних операторів ділить постачальників на три категорії за середнім об'ємом двигунів машин, які вони постачають
DELIMITER $$
CREATE PROCEDURE p_katehorii_postachalnykiv()
BEGIN
  DECLARE v_kinets INT DEFAULT 0;
  DECLARE v_id INT;
  DECLARE v_nazva VARCHAR(40);
  DECLARE v_obyem DECIMAL(4,2);
  DECLARE v_katehoriia VARCHAR(30);
  DECLARE kur CURSOR FOR
    SELECT p.id, p.nazva, AVG(d.obyem)
    FROM avto.postachalnyky p, avto.transport t, avto.dvyguny d
    WHERE t.postachalnyk_id = p.id AND t.dvygun_id = d.id
    GROUP BY p.id, p.nazva;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_kinets = 1;

  DROP TEMPORARY TABLE IF EXISTS katehorii;
  CREATE TEMPORARY TABLE katehorii (
    postachalnyk VARCHAR(40), serednii_obyem DECIMAL(4,2),
    katehoriia VARCHAR(30));

  OPEN kur;
  cykl: LOOP
    FETCH kur INTO v_id, v_nazva, v_obyem;
    IF v_kinets = 1 THEN
      LEAVE cykl;
    END IF;
    IF v_obyem < 1.6 THEN
      SET v_katehoriia = 'Мала кубатура';
    ELSEIF v_obyem <= 2.5 THEN
      SET v_katehoriia = 'Середня кубатура';
    ELSE
      SET v_katehoriia = 'Велика кубатура';
    END IF;
    INSERT INTO katehorii VALUES (v_nazva, v_obyem, v_katehoriia);
  END LOOP;
  CLOSE kur;

  SELECT * FROM katehorii ORDER BY serednii_obyem;
END $$
DELIMITER ;

-- Виклик процедури p_katehorii_postachalnykiv
CALL avto.p_katehorii_postachalnykiv();

-- ===== Функції =====
-- Завдання 1. Функція f_opys_mashyny, яка повертає повний опис машини за її кодом
DELIMITER $$
CREATE FUNCTION f_opys_mashyny(p_id INT)
RETURNS VARCHAR(100)
READS SQL DATA
BEGIN
  DECLARE v_opys VARCHAR(100);
  SELECT CONCAT(marka, ' ', model, ' (', kraina, ', ', rik, ')')
    INTO v_opys
  FROM avto.transport WHERE id = p_id;
  RETURN v_opys;
END $$
DELIMITER ;

-- Функція f_vik, яка обчислює вік машини за роком випуску
DELIMITER $$
CREATE FUNCTION f_vik(p_rik INT)
RETURNS INT
NOT DETERMINISTIC
BEGIN
  RETURN YEAR(CURDATE()) - p_rik;
END $$
DELIMITER ;

-- Таблиця з переліком машин, отримана за допомогою функцій f_opys_mashyny і f_vik
SELECT id,
       avto.f_opys_mashyny(id) AS mashyna,
       avto.f_vik(rik)         AS vik_rokiv,
       tsina
FROM avto.transport;

-- Завдання 2. Функція f_opys_dvyguna, яка повертає опис двигуна за його кодом
DELIMITER $$
CREATE FUNCTION f_opys_dvyguna(p_id INT)
RETURNS VARCHAR(100)
READS SQL DATA
BEGIN
  DECLARE v_opys VARCHAR(100);
  SELECT CONCAT(typ, ', ', obyem, ' л, ', potuzhnist, ' к.с., ', palyvo)
    INTO v_opys
  FROM avto.dvyguny WHERE id = p_id;
  RETURN v_opys;
END $$
DELIMITER ;

-- Функція f_klas_dvyguna, яка визначає клас двигуна за об'ємом (з умовним оператором IF)
DELIMITER $$
CREATE FUNCTION f_klas_dvyguna(p_obyem DECIMAL(3,1))
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  IF p_obyem < 1.6 THEN
    RETURN 'малий';
  ELSEIF p_obyem <= 2.5 THEN
    RETURN 'середній';
  ELSE
    RETURN 'великий';
  END IF;
END $$
DELIMITER ;

-- Таблиця з переліком двигунів у машинах, отримана за допомогою функцій f_opys_dvyguna і f_klas_dvyguna
SELECT t.marka, t.model,
       avto.f_opys_dvyguna(t.dvygun_id) AS dvygun,
       avto.f_klas_dvyguna(d.obyem)     AS klas
FROM avto.transport t, avto.dvyguny d
WHERE t.dvygun_id = d.id
ORDER BY d.obyem;
