-- База даних "Транспорт"
DROP DATABASE IF EXISTS transport;
CREATE DATABASE transport CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE transport;

CREATE TABLE vodii (            -- Водії
  kod          INT PRIMARY KEY,
  prizvyshche  VARCHAR(30),
  imya         VARCHAR(20),
  stazh        INT,             -- стаж, років
  kategoriya   VARCHAR(5),      -- категорія прав
  zarplata     DECIMAL(10,2)    -- зарплата, грн
);

CREATE TABLE avtomobili (       -- Автомобілі
  kod     INT PRIMARY KEY,
  marka   VARCHAR(30),
  model   VARCHAR(30),
  nomer   VARCHAR(10),
  rik     INT,                  -- рік випуску
  probig  INT                   -- пробіг, км
);

CREATE TABLE reysy (            -- Рейси
  kod        INT PRIMARY KEY,
  kod_vodiya INT,
  kod_avto   INT,
  punkt      VARCHAR(30),       -- пункт призначення
  vidstan    INT,               -- відстань, км
  vartist    DECIMAL(10,2),     -- вартість рейсу, грн
  data       DATE,
  FOREIGN KEY (kod_vodiya) REFERENCES vodii(kod),
  FOREIGN KEY (kod_avto)   REFERENCES avtomobili(kod)
);

INSERT INTO vodii VALUES
 (1,'Коваленко','Іван',12,'C',18500),
 (2,'Бондар','Петро',5,'B',14200),
 (3,'Кравчук','Олег',20,'D',22000),
 (4,'Мельник','Андрій',8,'C',16800),
 (5,'Ткаченко','Сергій',3,'B',12500),
 (6,'Петренко','Василь',15,'CE',21000),
 (7,'Шевчук','Микола',1,'B',11000);

INSERT INTO avtomobili VALUES
 (1,'Toyota','Prius','AA1234BC',2018,154000),
 (2,'Mercedes-Benz','Sprinter','KA5678IO',2016,320000),
 (3,'Volvo','FH16','BC9012AK',2019,410000),
 (4,'Renault','Master','AA3456KH',2020,98000),
 (5,'MAN','TGX','BH7890CE',2015,520000),
 (6,'Ford','Transit','KA2345EI',2021,65000);

INSERT INTO reysy VALUES
 (1, 1,2,'Львів',   540,12500,'2026-09-01'),
 (2, 3,3,'Одеса',   475,15800,'2026-09-02'),
 (3, 2,1,'Житомир', 140, 3200,'2026-09-03'),
 (4, 4,4,'Вінниця', 270, 6100,'2026-09-05'),
 (5, 6,5,'Харків',  480,17400,'2026-09-06'),
 (6, 1,2,'Полтава', 340, 8300,'2026-09-08'),
 (7, 5,1,'Черкаси', 190, 4100,'2026-09-10'),
 (8, 3,3,'Дніпро',  480,16200,'2026-09-12'),
 (9, 6,5,'Луцьк',   400,14100,'2026-09-15'),
 (10,2,4,'Київ',     30,  900,'2026-09-16'),
 (11,4,2,'Одеса',   475,11200,'2026-09-18'),
 (12,1,4,'Харків',  480,10800,'2026-09-20');
