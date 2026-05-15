DO $$
DECLARE
    v_name TEXT;
BEGIN
    FOR v_name IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'verification_code'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) LIKE '%type%'
    LOOP
        EXECUTE format('ALTER TABLE verification_code DROP CONSTRAINT IF EXISTS %I', v_name);
    END LOOP;
END $$;

ALTER TABLE verification_code
    ADD CONSTRAINT verification_code_type_check
    CHECK (type IN ('REGISTER', 'LOGIN', 'SET_PASSWORD', 'CHANGE_EMAIL', 'FORGOT_PASSWORD', 'DELETE_ACCOUNT'));
