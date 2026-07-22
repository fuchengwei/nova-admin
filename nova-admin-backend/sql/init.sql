-- =====================================================
-- Nova Admin 数据库初始化脚本
-- PostgreSQL 17+
-- =====================================================

-- 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 1. 部门表
-- =====================================================
DROP TABLE IF EXISTS sys_dept CASCADE;
CREATE TABLE sys_dept (
    id              BIGINT PRIMARY KEY,
    parent_id       BIGINT NOT NULL DEFAULT 0,
    name            VARCHAR(64) NOT NULL,
    code            VARCHAR(64),
    leader          VARCHAR(64),
    phone           VARCHAR(20),
    email           VARCHAR(128),
    sort            INT NOT NULL DEFAULT 0,
    status          SMALLINT NOT NULL DEFAULT 1,
    create_by       BIGINT,
    create_time     TIMESTAMP,
    update_by       BIGINT,
    update_time     TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
COMMENT ON TABLE sys_dept IS '部门表';
CREATE INDEX idx_dept_parent ON sys_dept(parent_id);
CREATE INDEX idx_dept_deleted ON sys_dept(deleted);

-- =====================================================
-- 2. 用户表
-- =====================================================
DROP TABLE IF EXISTS sys_user CASCADE;
CREATE TABLE sys_user (
    id              BIGINT PRIMARY KEY,
    username        VARCHAR(64) NOT NULL,
    password        VARCHAR(128) NOT NULL,
    nickname        VARCHAR(64),
    real_name       VARCHAR(64),
    avatar          VARCHAR(255),
    email           VARCHAR(128),
    phone           VARCHAR(20),
    gender          SMALLINT DEFAULT 0,
    dept_id         BIGINT,
    super_admin     SMALLINT NOT NULL DEFAULT 0,
    status          SMALLINT NOT NULL DEFAULT 1,
    last_login_time TIMESTAMP,
    last_login_ip   VARCHAR(64),
    create_by       BIGINT,
    create_time     TIMESTAMP,
    update_by       BIGINT,
    update_time     TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
COMMENT ON TABLE sys_user IS '用户表';
CREATE UNIQUE INDEX uk_user_username ON sys_user(username) WHERE deleted = 0;
CREATE INDEX idx_user_dept ON sys_user(dept_id);
CREATE INDEX idx_user_deleted ON sys_user(deleted);

-- =====================================================
-- 3. 角色表
-- =====================================================
DROP TABLE IF EXISTS sys_role CASCADE;
CREATE TABLE sys_role (
    id              BIGINT PRIMARY KEY,
    name            VARCHAR(64) NOT NULL,
    code            VARCHAR(64) NOT NULL,
    description     VARCHAR(255),
    data_scope      SMALLINT NOT NULL DEFAULT 1,
    sort            INT NOT NULL DEFAULT 0,
    status          SMALLINT NOT NULL DEFAULT 1,
    create_by       BIGINT,
    create_time     TIMESTAMP,
    update_by       BIGINT,
    update_time     TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
COMMENT ON TABLE sys_role IS '角色表';
COMMENT ON COLUMN sys_role.data_scope IS '数据权限范围: 1全部 2本部门及下级 3本部门 4本人及下级 5本人';
CREATE UNIQUE INDEX uk_role_code ON sys_role(code) WHERE deleted = 0;

-- =====================================================
-- 4. 菜单/权限表
-- =====================================================
DROP TABLE IF EXISTS sys_menu CASCADE;
CREATE TABLE sys_menu (
    id              BIGINT PRIMARY KEY,
    parent_id       BIGINT NOT NULL DEFAULT 0,
    name            VARCHAR(64) NOT NULL,
    type            CHAR(1) NOT NULL,  -- M目录 C菜单 F按钮
    perms           VARCHAR(128),
    path            VARCHAR(255),
    component       VARCHAR(255),
    redirect        VARCHAR(255),
    icon            VARCHAR(64),
    sort            INT NOT NULL DEFAULT 0,
    visible         SMALLINT NOT NULL DEFAULT 1,
    status          SMALLINT NOT NULL DEFAULT 1,
    keep_alive      SMALLINT NOT NULL DEFAULT 0,
    always_show     SMALLINT NOT NULL DEFAULT 0,
    create_by       BIGINT,
    create_time     TIMESTAMP,
    update_by       BIGINT,
    update_time     TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
COMMENT ON TABLE sys_menu IS '菜单/权限表';
CREATE INDEX idx_menu_parent ON sys_menu(parent_id);
CREATE INDEX idx_menu_perms ON sys_menu(perms);

-- =====================================================
-- 5. 关联表
-- =====================================================
DROP TABLE IF EXISTS sys_user_role CASCADE;
CREATE TABLE sys_user_role (
    user_id         BIGINT NOT NULL,
    role_id         BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id)
);
COMMENT ON TABLE sys_user_role IS '用户角色关联';

DROP TABLE IF EXISTS sys_role_menu CASCADE;
CREATE TABLE sys_role_menu (
    role_id         BIGINT NOT NULL,
    menu_id         BIGINT NOT NULL,
    PRIMARY KEY (role_id, menu_id)
);
COMMENT ON TABLE sys_role_menu IS '角色菜单关联';

DROP TABLE IF EXISTS sys_role_dept CASCADE;
CREATE TABLE sys_role_dept (
    role_id         BIGINT NOT NULL,
    dept_id         BIGINT NOT NULL,
    PRIMARY KEY (role_id, dept_id)
);
COMMENT ON TABLE sys_role_dept IS '角色自定义部门（data_scope=2 时生效）';

-- =====================================================
-- 6. 字典表
-- =====================================================
DROP TABLE IF EXISTS sys_dict_type CASCADE;
CREATE TABLE sys_dict_type (
    id              BIGINT PRIMARY KEY,
    type            VARCHAR(128) NOT NULL,
    name            VARCHAR(64) NOT NULL,
    description     VARCHAR(255),
    status          SMALLINT NOT NULL DEFAULT 1,
    create_by       BIGINT,
    create_time     TIMESTAMP,
    update_by       BIGINT,
    update_time     TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
COMMENT ON TABLE sys_dict_type IS '字典类型';
CREATE UNIQUE INDEX uk_dict_type ON sys_dict_type(type) WHERE deleted = 0;

DROP TABLE IF EXISTS sys_dict_data CASCADE;
CREATE TABLE sys_dict_data (
    id              BIGINT PRIMARY KEY,
    type_id         BIGINT NOT NULL,
    label           VARCHAR(128) NOT NULL,
    value           VARCHAR(128) NOT NULL,
    css_class       VARCHAR(64),
    sort            INT NOT NULL DEFAULT 0,
    status          SMALLINT NOT NULL DEFAULT 1,
    default_flag    SMALLINT NOT NULL DEFAULT 0,
    create_by       BIGINT,
    create_time     TIMESTAMP,
    update_by       BIGINT,
    update_time     TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
COMMENT ON TABLE sys_dict_data IS '字典数据';
CREATE INDEX idx_dict_data_type ON sys_dict_data(type_id);

-- =====================================================
-- 7. 日志表
-- =====================================================
DROP TABLE IF EXISTS sys_operation_log CASCADE;
CREATE TABLE sys_operation_log (
    id              BIGINT PRIMARY KEY,
    module          VARCHAR(64),
    action          VARCHAR(64),
    description     VARCHAR(255),
    request_method  VARCHAR(8),
    request_url     VARCHAR(255),
    java_method     VARCHAR(255),
    java_args       TEXT,
    user_id         BIGINT,
    username        VARCHAR(64),
    ip              VARCHAR(64),
    user_agent      VARCHAR(512),
    cost_ms         BIGINT,
    status          SMALLINT,
    error_msg       TEXT,
    create_time     TIMESTAMP
);
COMMENT ON TABLE sys_operation_log IS '操作日志';
CREATE INDEX idx_oplog_user ON sys_operation_log(user_id);
CREATE INDEX idx_oplog_time ON sys_operation_log(create_time);

DROP TABLE IF EXISTS sys_login_log CASCADE;
CREATE TABLE sys_login_log (
    id              BIGINT PRIMARY KEY,
    username        VARCHAR(64),
    ip              VARCHAR(64),
    user_agent      VARCHAR(512),
    os              VARCHAR(64),
    browser         VARCHAR(64),
    status          SMALLINT,
    msg             VARCHAR(255),
    login_time      TIMESTAMP
);
COMMENT ON TABLE sys_login_log IS '登录日志';
CREATE INDEX idx_loginlog_username ON sys_login_log(username);
CREATE INDEX idx_loginlog_time ON sys_login_log(login_time);

-- =====================================================
-- 8. 文件表
-- =====================================================
DROP TABLE IF EXISTS sys_file CASCADE;
CREATE TABLE sys_file (
    id              BIGINT PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    original_name   VARCHAR(255),
    url             VARCHAR(512) NOT NULL,
    size            BIGINT,
    content_type    VARCHAR(128),
    storage_type    VARCHAR(32),
    bucket          VARCHAR(64),
    object_key      VARCHAR(255),
    uploader_id     BIGINT,
    create_time     TIMESTAMP,
    update_time     TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
COMMENT ON TABLE sys_file IS '文件表';
CREATE INDEX idx_file_uploader ON sys_file(uploader_id);

-- =====================================================
-- 9. 定时任务
-- =====================================================
DROP TABLE IF EXISTS sys_job CASCADE;
CREATE TABLE sys_job (
    id              BIGINT PRIMARY KEY,
    name            VARCHAR(64) NOT NULL,
    handler         VARCHAR(255) NOT NULL,
    cron            VARCHAR(64) NOT NULL,
    param           VARCHAR(255),
    status          SMALLINT NOT NULL DEFAULT 1,
    remark          VARCHAR(255),
    next_time       TIMESTAMP,
    create_by       BIGINT,
    create_time     TIMESTAMP,
    update_by       BIGINT,
    update_time     TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
COMMENT ON TABLE sys_job IS '定时任务';

DROP TABLE IF EXISTS sys_job_log CASCADE;
CREATE TABLE sys_job_log (
    id              BIGINT PRIMARY KEY,
    job_id          BIGINT NOT NULL,
    job_name        VARCHAR(64),
    start_time      TIMESTAMP,
    end_time        TIMESTAMP,
    cost_ms         BIGINT,
    status          SMALLINT,
    error_msg       TEXT,
    create_time     TIMESTAMP
);
COMMENT ON TABLE sys_job_log IS '任务执行日志';
CREATE INDEX idx_joblog_job ON sys_job_log(job_id);

-- =====================================================
-- 10. 代码生成
-- =====================================================
DROP TABLE IF EXISTS gen_table CASCADE;
CREATE TABLE gen_table (
    id              BIGINT PRIMARY KEY,
    table_name      VARCHAR(64) NOT NULL,
    table_comment   VARCHAR(255),
    class_name      VARCHAR(128),
    tpl_category    VARCHAR(32),
    module_name     VARCHAR(64),
    business_name   VARCHAR(64),
    function_name   VARCHAR(64),
    author          VARCHAR(64),
    gen_path        VARCHAR(255),
    create_by       BIGINT,
    create_time     TIMESTAMP,
    update_by       BIGINT,
    update_time     TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
COMMENT ON TABLE gen_table IS '代码生成-表配置';

DROP TABLE IF EXISTS gen_table_column CASCADE;
CREATE TABLE gen_table_column (
    id              BIGINT PRIMARY KEY,
    table_id        BIGINT NOT NULL,
    column_name     VARCHAR(64) NOT NULL,
    column_comment  VARCHAR(255),
    column_type     VARCHAR(64),
    java_type       VARCHAR(32),
    java_field      VARCHAR(64),
    is_pk           SMALLINT,
    is_increment    SMALLINT,
    is_required     SMALLINT,
    is_list         SMALLINT,
    is_query        SMALLINT,
    query_type      VARCHAR(32),
    html_type       VARCHAR(32),
    dict_type       VARCHAR(128),
    sort            INT
);
COMMENT ON TABLE gen_table_column IS '代码生成-字段配置';
CREATE INDEX idx_gencol_table ON gen_table_column(table_id);

-- =====================================================
-- 11. 初始化数据
-- =====================================================
-- 根部门
INSERT INTO sys_dept (id, parent_id, name, code, leader, sort, status, create_time)
VALUES (1, 0, 'Nova 科技', 'ROOT', '超级管理员', 0, 1, NOW());

-- 超级管理员角色 (BCrypt of 'admin123' - cost 10, generated)
-- 注：真实部署时通过 AdminApplication 的 CommandLineRunner 重新生成密码哈希
INSERT INTO sys_role (id, name, code, description, data_scope, sort, status, create_time)
VALUES
    (1, '超级管理员', 'super_admin', '系统最高权限', 1, 0, 1, NOW()),
    (2, '普通用户',   'user',         '默认基础角色', 5, 1, 1, NOW());

-- 默认菜单（占位，Phase 5 完善）
INSERT INTO sys_menu (id, parent_id, name, type, perms, path, component, icon, sort, visible, status, create_time)
VALUES
    (1, 0, '系统管理', 'M', '', '/system',  '',          'SettingOutlined',    0, 1, 1, NOW()),
    (2, 0, '监控管理', 'M', '', '/monitor', '',          'MonitorOutlined',    1, 1, 1, NOW()),
    (3, 0, '基础设施', 'M', '', '/infra',   '',          'CloudServerOutlined',2, 1, 1, NOW());

-- 超级管理员用户 (密码 admin123 的 BCrypt 哈希)
-- 替换为你生成的实际哈希
INSERT INTO sys_user (id, username, password, nickname, dept_id, super_admin, status, create_time)
VALUES (1, 'admin', '$2a$10$YdS7uGOGKHdGsJdqb02Nz.X/IFPEaBmuYjPDRfvJSftiGZsPaKKcq', '超级管理员', 1, 1, 1, NOW());

-- 用户角色关联
INSERT INTO sys_user_role (user_id, role_id) VALUES (1, 1);

-- 角色菜单关联（全部菜单给超管）
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu;
