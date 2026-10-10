ALTER TABLE stations MODIFY COLUMN business_area VARCHAR(10) NULL DEFAULT NULL;

UPDATE stations
SET business_area = NULL
WHERE business_area = 'B060' AND wilayah = 'Daop 6 Yogyakarta';
