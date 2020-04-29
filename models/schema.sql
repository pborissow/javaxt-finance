
CREATE TABLE TRANSACTION (
    ID BIGSERIAL NOT NULL,
    DATE TIMESTAMP with time zone NOT NULL,
    DESCRIPTION text,
    NOTES text,
    AMOUNT numeric NOT NULL,
    RAW_DATA text UNIQUE,
    SOURCE_ID bigint NOT NULL,
    VENDOR_ID bigint,
    CATEGORY_ID bigint,
    INFO jsonb,
    CONSTRAINT PK_TRANSACTION PRIMARY KEY (ID)
);


CREATE TABLE ACCOUNT (
    ID BIGSERIAL NOT NULL,
    NAME VARCHAR(75) NOT NULL UNIQUE,
    DESCRIPTION text,
    ACTIVE boolean NOT NULL DEFAULT true,
    INFO jsonb,
    CONSTRAINT PK_ACCOUNT PRIMARY KEY (ID)
);


CREATE TABLE CATEGORY (
    ID BIGSERIAL NOT NULL,
    NAME VARCHAR(75) NOT NULL,
    DESCRIPTION text,
    IS_EXPENSE boolean NOT NULL,
    ACCOUNT_ID bigint NOT NULL,
    INFO jsonb,
    CONSTRAINT PK_CATEGORY PRIMARY KEY (ID)
);


CREATE TABLE SOURCE (
    ID BIGSERIAL NOT NULL,
    ACCOUNT_ID bigint NOT NULL,
    TEMPLATE_ID bigint NOT NULL,
    CONSTRAINT PK_SOURCE PRIMARY KEY (ID)
);


CREATE TABLE SOURCE_ACCOUNT (
    ID BIGSERIAL NOT NULL,
    VENDOR_ID bigint NOT NULL,
    ACCOUNT_NAME VARCHAR(75) NOT NULL,
    ACCOUNT_NUMBER VARCHAR(125),
    ACTIVE boolean NOT NULL DEFAULT true,
    INFO jsonb,
    CONSTRAINT PK_SOURCE_ACCOUNT PRIMARY KEY (ID)
);


CREATE TABLE SOURCE_TEMPLATE (
    ID BIGSERIAL NOT NULL,
    VENDOR_ID bigint NOT NULL,
    NAME VARCHAR(75) NOT NULL UNIQUE,
    DESCRIPTION text,
    ACTIVE boolean NOT NULL DEFAULT true,
    INFO jsonb,
    CONSTRAINT PK_SOURCE_TEMPLATE PRIMARY KEY (ID)
);


CREATE TABLE VENDOR (
    ID BIGSERIAL NOT NULL,
    NAME VARCHAR(75) NOT NULL UNIQUE,
    DESCRIPTION text,
    ACTIVE boolean NOT NULL DEFAULT true,
    INFO jsonb,
    CONSTRAINT PK_VENDOR PRIMARY KEY (ID)
);


CREATE TABLE RULE (
    ID BIGSERIAL NOT NULL,
    NAME VARCHAR(75) NOT NULL UNIQUE,
    DESCRIPTION text,
    ACTIVE boolean NOT NULL DEFAULT true,
    INFO jsonb,
    CONSTRAINT PK_RULE PRIMARY KEY (ID)
);



ALTER TABLE TRANSACTION ADD FOREIGN KEY (SOURCE_ID) REFERENCES SOURCE(ID)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE TRANSACTION ADD FOREIGN KEY (VENDOR_ID) REFERENCES VENDOR(ID)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE TRANSACTION ADD FOREIGN KEY (CATEGORY_ID) REFERENCES CATEGORY(ID)
    ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE CATEGORY ADD FOREIGN KEY (ACCOUNT_ID) REFERENCES ACCOUNT(ID)
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE SOURCE ADD FOREIGN KEY (ACCOUNT_ID) REFERENCES SOURCE_ACCOUNT(ID)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE SOURCE ADD FOREIGN KEY (TEMPLATE_ID) REFERENCES SOURCE_TEMPLATE(ID)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE SOURCE_ACCOUNT ADD FOREIGN KEY (VENDOR_ID) REFERENCES VENDOR(ID)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE SOURCE_TEMPLATE ADD FOREIGN KEY (VENDOR_ID) REFERENCES VENDOR(ID)
    ON DELETE NO ACTION ON UPDATE NO ACTION;



CREATE INDEX IDX_TRANSACTION_SOURCE ON TRANSACTION(SOURCE_ID);
CREATE INDEX IDX_TRANSACTION_VENDOR ON TRANSACTION(VENDOR_ID);
CREATE INDEX IDX_TRANSACTION_CATEGORY ON TRANSACTION(CATEGORY_ID);
CREATE INDEX IDX_CATEGORY_ACCOUNT ON CATEGORY(ACCOUNT_ID);
CREATE INDEX IDX_SOURCE_SOURCE_ACCOUNT ON SOURCE(ACCOUNT_ID);
CREATE INDEX IDX_SOURCE_SOURCE_TEMPLATE ON SOURCE(TEMPLATE_ID);
CREATE INDEX IDX_SOURCE_ACCOUNT_VENDOR ON SOURCE_ACCOUNT(VENDOR_ID);
CREATE INDEX IDX_SOURCE_TEMPLATE_VENDOR ON SOURCE_TEMPLATE(VENDOR_ID);
