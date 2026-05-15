-- Hibernate tarafından oluşturulan eski CHECK constraint'i kaldır.
-- Bu constraint yalnızca ilk oluşturulduğundaki ConfType değerlerini biliyor;
-- sonradan eklenen DELETE_ACCOUNT değerine izin vermiyor.
ALTER TABLE verification_code DROP CONSTRAINT IF EXISTS verification_code_type_check;

-- Tüm mevcut ve yeni ConfType değerlerini kapsayan yeni constraint ekle.
ALTER TABLE verification_code
    ADD CONSTRAINT verification_code_type_check
    CHECK (type IN ('REGISTER', 'LOGIN', 'SET_PASSWORD', 'CHANGE_EMAIL', 'FORGOT_PASSWORD', 'DELETE_ACCOUNT'));
