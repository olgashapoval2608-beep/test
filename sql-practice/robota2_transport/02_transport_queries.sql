-- Прості запити на вибірку даних, база даних "Транспорт"

-- 1.1 Загальна, середня, мінімальна й максимальна вартість рейсів та їх кількість (SUM, AVG, MIN, MAX, COUNT)
SELECT SUM(vartist)   AS suma,
       AVG(vartist)   AS serednie,
       MIN(vartist)   AS minimum,
       MAX(vartist)   AS maksymum,
       COUNT(*)       AS kilkist_reysiv
FROM transport.reysy;

-- 1.2 Середньоквадратичне відхилення та дисперсія вартості рейсів (у MySQL: STDDEV і VARIANCE)
SELECT ROUND(STDDEV(vartist), 2)   AS st_vidhylennia,
       ROUND(VARIANCE(vartist), 2) AS dyspersiia
FROM transport.reysy;

-- 1.3 Кількість рейсів і сумарна відстань кожного водія (COUNT, SUM з GROUP BY)
SELECT kod_vodiya,
       COUNT(*)     AS kilkist_reysiv,
       SUM(vidstan) AS suma_km
FROM transport.reysy
GROUP BY kod_vodiya;

-- 1.4 Середня, мінімальна й максимальна зарплата водіїв, найбільший стаж
SELECT ROUND(AVG(zarplata), 2) AS serednia_zp,
       MIN(zarplata)            AS min_zp,
       MAX(zarplata)            AS max_zp,
       MAX(stazh)               AS max_stazh
FROM transport.vodii;

-- 2.1 Водії, прізвище яких починається на «К»
SELECT prizvyshche, imya, stazh
FROM transport.vodii
WHERE prizvyshche LIKE 'К%';

-- 2.2 Автомобілі з номером, що починається на «AA» (Київ)
SELECT marka, model, nomer
FROM transport.avtomobili
WHERE nomer LIKE 'AA%';

-- 2.3 Рейси до міст, назва яких закінчується на «ів»
SELECT kod, punkt, vidstan
FROM transport.reysy
WHERE punkt LIKE '%ів';

-- 2.4 Водії, у прізвищі яких друга літера «е» (символ _ — один будь-який символ)
SELECT prizvyshche, imya
FROM transport.vodii
WHERE prizvyshche LIKE '_е%';

-- 3.1 Псевдоніми стовпців (AS)
SELECT prizvyshche AS `Прізвище`,
       imya        AS `Ім'я`,
       stazh       AS `Стаж (років)`,
       zarplata    AS `Зарплата, грн`
FROM transport.vodii;

-- 3.2 Псевдоніми таблиць: хто, на якому автомобілі й куди їздив
SELECT v.prizvyshche AS `Водій`,
       a.marka       AS `Марка`,
       a.nomer       AS `Номер`,
       r.punkt       AS `Пункт призначення`
FROM transport.reysy r, transport.vodii v, transport.avtomobili a
WHERE r.kod_vodiya = v.kod
  AND r.kod_avto = a.kod
ORDER BY v.prizvyshche;

-- 3.3 Псевдонім для обчислюваного стовпця: ціна за 1 км
SELECT r.punkt                           AS `Пункт`,
       r.vidstan                         AS `Км`,
       r.vartist                         AS `Вартість`,
       ROUND(r.vartist / r.vidstan, 2)   AS `Ціна за км`
FROM transport.reysy AS r;

-- 4.1 Водії з категорією прав C або CE (IN)
SELECT prizvyshche, imya, kategoriya
FROM transport.vodii
WHERE kategoriya IN ('C', 'CE');

-- 4.2 Рейси, крім рейсів до Києва, Львова та Одеси (NOT IN)
SELECT kod, punkt, vidstan, vartist
FROM transport.reysy
WHERE punkt NOT IN ('Київ', 'Львів', 'Одеса');

-- 4.3 Водії, які виконували рейси на автомобілях Volvo або MAN (IN з підзапитом)
SELECT prizvyshche, imya
FROM transport.vodii
WHERE kod IN (SELECT kod_vodiya
              FROM transport.reysy
              WHERE kod_avto IN (SELECT kod
                                 FROM transport.avtomobili
                                 WHERE marka IN ('Volvo', 'MAN')));

-- 4.4 Водії, які не виконали жодного рейсу (NOT IN з підзапитом)
SELECT prizvyshche, imya, stazh
FROM transport.vodii
WHERE kod NOT IN (SELECT kod_vodiya FROM transport.reysy);

-- 4.5 Автомобілі, які не використовувались у рейсах (NOT IN з підзапитом)
SELECT marka, model, nomer
FROM transport.avtomobili
WHERE kod NOT IN (SELECT kod_avto FROM transport.reysy);
