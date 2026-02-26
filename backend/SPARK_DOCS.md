Работа со спарк:

--Команды для запуска:
docker compose up -d spark-master spark-worker
docker exec -it spark-master bash
/opt/spark/bin/spark-sql


-- какие вообще есть базы
SHOW DATABASES;

-- выбрать базу (например, default)
USE default;

-- какие есть таблицы в выбранной базе
SHOW TABLES;

-- подробности по таблице
DESCRIBE TABLE some_table;
DESCRIBE EXTENDED some_table;

-- Данные для заполнения и локального тестирования:
CREATE DATABASE IF NOT EXISTS prd_advert_ods;
CREATE DATABASE IF NOT EXISTS prd_advert_dict;
CREATE DATABASE IF NOT EXISTS advert_dm;
CREATE DATABASE IF NOT EXISTS pixel;

USE prd_advert_ods;

CREATE TABLE IF NOT EXISTS dsp_events (
  event_id    BIGINT       NOT NULL,
  user_id     STRING,
  event_ts    TIMESTAMP,
  bid_price   DECIMAL(10,4),
  is_viewable BOOLEAN
);

INSERT INTO dsp_events VALUES
  (1001,'usr_001',TIMESTAMP('2025-03-01 10:00:00'),0.0150,TRUE),
  (1002,'usr_002',TIMESTAMP('2025-03-01 10:01:00'),0.0220,FALSE),
  (1003,'usr_003',TIMESTAMP('2025-03-01 10:02:00'),0.0310,TRUE),
  (1004,'usr_004',TIMESTAMP('2025-03-01 10:03:00'),0.0180,TRUE),
  (1005,'usr_005',TIMESTAMP('2025-03-01 10:04:00'),0.0090,FALSE),
  (1006,'usr_006',TIMESTAMP('2025-03-01 10:05:00'),0.0550,TRUE),
  (1007,'usr_007',TIMESTAMP('2025-03-01 10:06:00'),0.1250,TRUE),
  (1008,'usr_008',TIMESTAMP('2025-03-01 10:07:00'),0.3333,FALSE),
  (1009,'usr_009',TIMESTAMP('2025-03-01 10:08:00'),0.7777,TRUE),
  (1010,'usr_010',TIMESTAMP('2025-03-01 10:09:00'),0.0999,TRUE);

CREATE TABLE IF NOT EXISTS sgm_upload_dsp_segment (
  upload_id BIGINT     NOT NULL,
  segment_id INT,
  msisdn    STRING,
  upload_ts TIMESTAMP,
  status    STRING
);

INSERT INTO sgm_upload_dsp_segment VALUES
  (5001,101,'79161234567',TIMESTAMP('2025-02-10 08:00:00'),'success'),
  (5002,102,'79261234568',TIMESTAMP('2025-02-10 08:01:00'),'success'),
  (5003,101,'79361234569',TIMESTAMP('2025-02-10 08:02:00'),'failed'),
  (5004,103,'79461234570',TIMESTAMP('2025-02-10 08:03:00'),'pending'),
  (5005,104,'79561234571',TIMESTAMP('2025-02-10 08:04:00'),'success'),
  (5006,101,'79661234572',TIMESTAMP('2025-02-10 08:05:00'),'failed'),
  (5007,102,'79761234573',TIMESTAMP('2025-02-10 08:06:00'),'pending'),
  (5008,103,'79861234574',TIMESTAMP('2025-02-10 08:07:00'),'success'),
  (5009,104,'79961234575',TIMESTAMP('2025-02-10 08:08:00'),'success'),
  (5010,105,'79001234576',TIMESTAMP('2025-02-10 08:09:00'),'failed');

CREATE TABLE IF NOT EXISTS http_cyrillic (
  request_id BIGINT    NOT NULL,
  url        STRING,
  user_agent STRING,
  request_ts TIMESTAMP,
  is_bot     BOOLEAN
);

INSERT INTO http_cyrillic VALUES
  (2001,'https://example.ru/поиск?q=москва','Mozilla/5.0 (Windows NT)',TIMESTAMP('2025-04-05 09:00:00'),FALSE),
  (2002,'https://example.ru/каталог/товары','Mozilla/5.0 (Android)',TIMESTAMP('2025-04-05 09:01:00'),FALSE),
  (2003,'https://example.ru/новости/спорт','Googlebot/2.1',TIMESTAMP('2025-04-05 09:02:00'),TRUE),
  (2004,'https://example.ru/магазин/одежда','Mozilla/5.0 (iPhone)',TIMESTAMP('2025-04-05 09:03:00'),FALSE),
  (2005,'https://example.ru/акции/скидки','YandexBot/3.0',TIMESTAMP('2025-04-05 09:04:00'),TRUE),
  (2006,'https://example.ru/блог/технологии','Mozilla/5.0 (Linux)',TIMESTAMP('2025-04-05 09:05:00'),FALSE),
  (2007,'https://example.ru/новости/политика','Mozilla/5.0 (Windows NT)',TIMESTAMP('2025-04-05 09:06:00'),FALSE),
  (2008,'https://example.ru/новости/экономика','Googlebot/2.1',TIMESTAMP('2025-04-05 09:07:00'),TRUE),
  (2009,'https://example.ru/каталог/спорт','Mozilla/5.0 (Android)',TIMESTAMP('2025-04-05 09:08:00'),FALSE),
  (2010,'https://example.ru/каталог/дети','Mozilla/5.0 (iPhone)',TIMESTAMP('2025-04-05 09:09:00'),FALSE);

CREATE TABLE IF NOT EXISTS imsi_x_msisdn_actual (
  imsi       STRING NOT NULL,
  msisdn     STRING,
  operator   STRING,
  updated_at TIMESTAMP,
  is_active  BOOLEAN
);

INSERT INTO imsi_x_msisdn_actual VALUES
  ('250011234567890','79161234567','МТС',      TIMESTAMP('2025-01-01 00:00:00'),TRUE),
  ('250021234567891','79261234568','Билайн',   TIMESTAMP('2025-01-02 00:00:00'),TRUE),
  ('250031234567892','79361234569','МегаФон',  TIMESTAMP('2025-01-03 00:00:00'),TRUE),
  ('250041234567893','79461234570','Теле2',    TIMESTAMP('2025-01-04 00:00:00'),FALSE),
  ('250051234567894','79561234571','МТС',      TIMESTAMP('2025-01-05 00:00:00'),TRUE),
  ('250061234567895','79661234572','Билайн',   TIMESTAMP('2025-01-06 00:00:00'),TRUE),
  ('250071234567896','79761234573','МегаФон',  TIMESTAMP('2025-01-07 00:00:00'),FALSE),
  ('250081234567897','79861234574','Теле2',    TIMESTAMP('2025-01-08 00:00:00'),TRUE),
  ('250091234567898','79961234575','МТС',      TIMESTAMP('2025-01-09 00:00:00'),TRUE),
  ('250101234567899','79001234576','Ростелеком',TIMESTAMP('2025-01-10 00:00:00'),FALSE);

CREATE TABLE IF NOT EXISTS cm_id_msisdn (
  cm_id       STRING NOT NULL,
  msisdn      STRING,
  source      STRING,
  created_at  TIMESTAMP,
  is_confirmed BOOLEAN
);

INSERT INTO cm_id_msisdn VALUES
  ('cm_abc123','79161234567','CRM',    TIMESTAMP('2025-03-01 00:00:00'),TRUE),
  ('cm_def456','79261234568','CDP',    TIMESTAMP('2025-03-02 00:00:00'),TRUE),
  ('cm_ghi789','79361234569','manual', TIMESTAMP('2025-03-03 00:00:00'),FALSE),
  ('cm_jkl012','79461234570','CRM',    TIMESTAMP('2025-03-04 00:00:00'),TRUE),
  ('cm_mno345','79561234571','CDP',    TIMESTAMP('2025-03-05 00:00:00'),TRUE),
  ('cm_pqr678','79661234572','API',    TIMESTAMP('2025-03-06 00:00:00'),FALSE),
  ('cm_stu901','79761234573','import', TIMESTAMP('2025-03-07 00:00:00'),TRUE),
  ('cm_vwx234','79861234574','CRM',    TIMESTAMP('2025-03-08 00:00:00'),TRUE),
  ('cm_yza567','79961234575','CDP',    TIMESTAMP('2025-03-09 00:00:00'),FALSE),
  ('cm_bcd890','79001234576','manual', TIMESTAMP('2025-03-10 00:00:00'),TRUE);

USE prd_advert_dict;

CREATE TABLE IF NOT EXISTS v_catalog_2gis_phones (
  phone_id     BIGINT NOT NULL,
  phone_number STRING,
  rubric       STRING,
  city         STRING,
  is_valid     BOOLEAN
);

INSERT INTO v_catalog_2gis_phones VALUES
  (3001,'+74951234567','Рестораны','Москва',TRUE),
  (3002,'+74951234568','Автосервисы','Москва',TRUE),
  (3003,'+78121234569','Салоны красоты','Санкт-Петербург',TRUE),
  (3004,'+74951234570','Банки','Москва',FALSE),
  (3005,'+73431234571','Аптеки','Екатеринбург',TRUE),
  (3006,'+74951234572','Рестораны','Москва',TRUE),
  (3007,'+78121234573','Кафе','Санкт-Петербург',TRUE),
  (3008,'+78121234574','Автосервисы','Санкт-Петербург',FALSE),
  (3009,'+73431234575','Магазины','Екатеринбург',TRUE),
  (3010,'+74951234576','Кинотеатры','Москва',TRUE);

CREATE TABLE IF NOT EXISTS v_region_gibdd_codes (
  region_code     INT    NOT NULL,
  region_name     STRING,
  federal_district STRING,
  auto_code       STRING,
  is_active       BOOLEAN
);

INSERT INTO v_region_gibdd_codes VALUES
  (77,'Москва','Центральный','77',TRUE),
  (78,'Санкт-Петербург','Северо-Западный','78',TRUE),
  (66,'Свердловская область','Уральский','66',TRUE),
  (23,'Краснодарский край','Южный','23',TRUE),
  (63,'Самарская область','Приволжский','63',FALSE),
  (16,'Республика Татарстан','Приволжский','16',TRUE),
  (54,'Новосибирская область','Сибирский','54',TRUE),
  (24,'Красноярский край','Сибирский','24',TRUE),
  (38,'Иркутская область','Сибирский','38',FALSE),
  (27,'Хабаровский край','Дальневосточный','27',TRUE);

CREATE TABLE IF NOT EXISTS v_cities_regions (
  city_id           INT    NOT NULL,
  city_name         STRING,
  region_name       STRING,
  population        BIGINT,
  is_regional_center BOOLEAN
);

INSERT INTO v_cities_regions VALUES
  (1,'Москва','Москва',12600000,TRUE),
  (2,'Санкт-Петербург','Санкт-Петербург',5380000,TRUE),
  (3,'Екатеринбург','Свердловская область',1490000,TRUE),
  (4,'Краснодар','Краснодарский край',920000,TRUE),
  (5,'Новосибирск','Новосибирская область',1600000,TRUE),
  (6,'Казань','Республика Татарстан',1250000,TRUE),
  (7,'Нижний Новгород','Нижегородская область',1250000,TRUE),
  (8,'Челябинск','Челябинская область',1200000,TRUE),
  (9,'Омск','Омская область',1150000,TRUE),
  (10,'Самара','Самарская область',1170000,TRUE);

USE advert_dm;

CREATE TABLE IF NOT EXISTS segments_bd_custom (
  segment_id BIGINT NOT NULL,
  user_id    STRING,
  segments   ARRAY<STRING>,
  score      DECIMAL(5,2),
  updated_at TIMESTAMP
);

INSERT INTO segments_bd_custom VALUES
  (1001,'usr_101',array('auto','travel'),85.50,TIMESTAMP('2025-05-01 00:00:00')),
  (1002,'usr_102',array('gaming','tech'),72.00,TIMESTAMP('2025-05-02 00:00:00')),
  (1003,'usr_103',array('sport'),90.25,TIMESTAMP('2025-05-03 00:00:00')),
  (1004,'usr_104',array('travel','food','retail'),65.75,TIMESTAMP('2025-05-04 00:00:00')),
  (1005,'usr_105',array('auto'),50.00,TIMESTAMP('2025-05-05 00:00:00')),
  (1006,'usr_106',array('tech'),88.10,TIMESTAMP('2025-05-06 00:00:00')),
  (1007,'usr_107',array('media','fashion'),73.30,TIMESTAMP('2025-05-07 00:00:00')),
  (1008,'usr_108',array('health','sport'),69.40,TIMESTAMP('2025-05-08 00:00:00')),
  (1009,'usr_109',array('education','tech'),91.20,TIMESTAMP('2025-05-09 00:00:00')),
  (1010,'usr_110',array('retail','food'),55.60,TIMESTAMP('2025-05-10 00:00:00'));

USE pixel;

CREATE TABLE IF NOT EXISTS tracking_all (
  pixel_id      STRING NOT NULL,
  user_id       STRING,
  page_url      STRING,
  event_ts      TIMESTAMP,
  is_conversion BOOLEAN
);

INSERT INTO tracking_all VALUES
  ('pxl_001','usr_201','https://shop.example.ru/product/123',TIMESTAMP('2025-06-01 14:00:00'),FALSE),
  ('pxl_002','usr_202','https://shop.example.ru/cart',       TIMESTAMP('2025-06-01 14:05:00'),FALSE),
  ('pxl_003','usr_203','https://shop.example.ru/checkout',   TIMESTAMP('2025-06-01 14:10:00'),TRUE),
  ('pxl_004','usr_204','https://shop.example.ru/product/456',TIMESTAMP('2025-06-01 14:15:00'),FALSE),
  ('pxl_005','usr_205','https://shop.example.ru/thanks',     TIMESTAMP('2025-06-01 14:20:00'),TRUE),
  ('pxl_006','usr_206','https://shop.example.ru/catalog',    TIMESTAMP('2025-06-01 14:25:00'),FALSE),
  ('pxl_007','usr_207','https://shop.example.ru/product/789',TIMESTAMP('2025-06-01 14:30:00'),FALSE),
  ('pxl_008','usr_208','https://shop.example.ru/cart',       TIMESTAMP('2025-06-01 14:35:00'),TRUE),
  ('pxl_009','usr_209','https://shop.example.ru/checkout',   TIMESTAMP('2025-06-01 14:40:00'),TRUE),
  ('pxl_010','usr_210','https://shop.example.ru/product/999',TIMESTAMP('2025-06-01 14:45:00'),FALSE);
