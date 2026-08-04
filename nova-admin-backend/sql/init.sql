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
    account         VARCHAR(64) NOT NULL,
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
    force_password_change SMALLINT NOT NULL DEFAULT 0,
    password_changed_at TIMESTAMP,
    last_login_time TIMESTAMP,
    last_login_ip   VARCHAR(64),
    create_by       BIGINT,
    create_time     TIMESTAMP,
    update_by       BIGINT,
    update_time     TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
COMMENT ON TABLE sys_user IS '用户表';
CREATE UNIQUE INDEX uk_user_account ON sys_user(account) WHERE deleted = 0;
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
COMMENT ON COLUMN sys_role.data_scope IS '数据权限范围: 1全部 2本部门及下级 3本部门 4本人及下级 5本人 6自定义部门';
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
COMMENT ON TABLE sys_role_dept IS '角色自定义部门（data_scope=6 时生效）';

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
    account         VARCHAR(64),
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
    account         VARCHAR(64),
    ip              VARCHAR(64),
    user_agent      VARCHAR(512),
    os              VARCHAR(64),
    browser         VARCHAR(64),
    status          SMALLINT,
    msg             VARCHAR(255),
    login_time      TIMESTAMP
);
COMMENT ON TABLE sys_login_log IS '登录日志';
CREATE INDEX idx_loginlog_account ON sys_login_log(account);
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
    job_name        VARCHAR(64) NOT NULL,
    job_group       VARCHAR(64) NOT NULL DEFAULT 'DEFAULT',
    invoke_target   VARCHAR(255) NOT NULL,
    cron_expression VARCHAR(64) NOT NULL,
    status          SMALLINT NOT NULL DEFAULT 0,
    misfire_policy  VARCHAR(32) NOT NULL DEFAULT 'DO_NOTHING',
    concurrent      SMALLINT NOT NULL DEFAULT 1,
    remark          VARCHAR(255),
    create_by       BIGINT,
    create_time     TIMESTAMP,
    update_by       BIGINT,
    update_time     TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
COMMENT ON TABLE sys_job IS '定时任务';
CREATE INDEX idx_job_status ON sys_job(status);

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
-- 10. 系统配置
-- =====================================================
DROP TABLE IF EXISTS sys_config CASCADE;
CREATE TABLE sys_config (
    id              BIGINT PRIMARY KEY,
    config_key      VARCHAR(128) NOT NULL,
    config_value    TEXT,
    config_group    VARCHAR(32) NOT NULL,
    value_type      VARCHAR(32) NOT NULL DEFAULT 'string',
    description     VARCHAR(255),
    builtin         SMALLINT NOT NULL DEFAULT 1,
    create_by       BIGINT,
    create_time     TIMESTAMP,
    update_by       BIGINT,
    update_time     TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
COMMENT ON TABLE sys_config IS '系统配置表';
CREATE UNIQUE INDEX uk_config_key ON sys_config(config_key) WHERE deleted = 0;
CREATE INDEX idx_config_group ON sys_config(config_group);

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

-- 基础设施-文件管理菜单与权限
INSERT INTO sys_menu (id, parent_id, name, type, perms, path, component, icon, sort, visible, status, create_time)
VALUES
    (31, 3,  '文件管理', 'C', 'infra:file:list',   '/infra/file', 'infra/file/index', 'FolderOpenOutlined', 0, 1, 1, NOW()),
    (32, 31, '上传文件', 'F', 'infra:file:upload', '',            '',                 '',                   0, 0, 1, NOW()),
    (33, 31, '删除文件', 'F', 'infra:file:remove', '',            '',                 '',                   1, 0, 1, NOW());

-- 系统管理子菜单与权限（补全此前模块所需的种子数据，否则超管无权限访问）
INSERT INTO sys_menu (id, parent_id, name, type, perms, path, component, icon, sort, visible, status, create_time)
VALUES
    -- 用户管理
    (15, 1, '用户管理', 'C', 'system:user:list',      '/system/user', 'system/user/index', 'UserOutlined', 0, 1, 1, NOW()),
    (16, 15, '新增用户', 'F', 'system:user:add',       '', '', '', 0, 0, 1, NOW()),
    (17, 15, '修改用户', 'F', 'system:user:edit',      '', '', '', 1, 0, 1, NOW()),
    (18, 15, '删除用户', 'F', 'system:user:remove',    '', '', '', 2, 0, 1, NOW()),
    (19, 15, '重置密码', 'F', 'system:user:reset-pwd', '', '', '', 3, 0, 1, NOW()),
    (20, 15, '导入用户', 'F', 'system:user:import',    '', '', '', 4, 0, 1, NOW()),
    (21, 15, '导出用户', 'F', 'system:user:export',    '', '', '', 5, 0, 1, NOW()),
    -- 部门管理
    (11, 1, '部门管理', 'C', 'system:dept:list',   '/system/dept', 'system/dept/index', 'ApartmentOutlined', 1, 1, 1, NOW()),
    (12, 11, '新增部门', 'F', 'system:dept:add',    '', '', '', 0, 0, 1, NOW()),
    (13, 11, '修改部门', 'F', 'system:dept:edit',   '', '', '', 1, 0, 1, NOW()),
    (14, 11, '删除部门', 'F', 'system:dept:remove', '', '', '', 2, 0, 1, NOW()),
    -- 角色管理
    (20, 1, '角色管理', 'C', 'system:role:list',   '/system/role', 'system/role/index', 'TeamOutlined', 2, 1, 1, NOW()),
    (21, 20, '新增角色', 'F', 'system:role:add',    '', '', '', 0, 0, 1, NOW()),
    (22, 20, '修改角色', 'F', 'system:role:edit',   '', '', '', 1, 0, 1, NOW()),
    (23, 20, '删除角色', 'F', 'system:role:remove', '', '', '', 2, 0, 1, NOW()),
    -- 菜单管理
    (24, 1, '菜单管理', 'C', 'system:menu:list',   '/system/menu', 'system/menu/index', 'MenuOutlined', 3, 1, 1, NOW()),
    (25, 24, '新增菜单', 'F', 'system:menu:add',    '', '', '', 0, 0, 1, NOW()),
    (26, 24, '修改菜单', 'F', 'system:menu:edit',   '', '', '', 1, 0, 1, NOW()),
    (27, 24, '删除菜单', 'F', 'system:menu:remove', '', '', '', 2, 0, 1, NOW()),
    -- 字典管理
    (28, 1, '字典管理', 'C', 'system:dict:list',   '/system/dict', 'system/dict/index', 'BookOutlined', 4, 1, 1, NOW()),
    (29, 28, '新增字典', 'F', 'system:dict:add',    '', '', '', 0, 0, 1, NOW()),
    (30, 28, '修改字典', 'F', 'system:dict:edit',   '', '', '', 1, 0, 1, NOW()),
    (34, 28, '删除字典', 'F', 'system:dict:remove', '', '', '', 2, 0, 1, NOW()),
    -- 日志管理
    (35, 1, '日志管理', 'C', 'system:log:list',    '/system/log', 'system/log/index', 'FileOutlined', 5, 1, 1, NOW()),
    (36, 35, '删除日志', 'F', 'system:log:remove', '', '', '', 0, 0, 1, NOW()),
    -- 系统设置
    (37, 1, '系统设置', 'C', 'system:settings:view', '/system/settings', 'system/settings/index', 'ControlOutlined', 6, 1, 1, NOW()),
    (38, 37, '修改设置', 'F', 'system:settings:edit', '', '', '', 0, 0, 1, NOW());

-- 系统配置默认值
INSERT INTO sys_config (id, config_key, config_value, config_group, value_type, description, builtin, create_time, update_time, deleted)
VALUES
    (1001, 'site.name', 'Nova Admin', 'basic', 'string', '系统名称', 1, NOW(), NOW(), 0),
    (1002, 'site.browser-title', 'Nova Admin', 'basic', 'string', '浏览器标题', 1, NOW(), NOW(), 0),
    (1003, 'site.logo-url', '', 'basic', 'string', 'Logo URL', 1, NOW(), NOW(), 0),
    (1004, 'site.default-language', 'zh_CN', 'basic', 'string', '默认语言', 1, NOW(), NOW(), 0),
    (1005, 'site.theme-color', '#1677ff', 'basic', 'string', '主题色', 1, NOW(), NOW(), 0),
    (1006, 'site.copyright', '© 2026 Nova Admin', 'basic', 'string', '版权文本', 1, NOW(), NOW(), 0),
    (1101, 'security.password.min-length', '6', 'security', 'number', '密码最小长度', 1, NOW(), NOW(), 0),
    (1102, 'security.password.require-number', 'false', 'security', 'boolean', '密码要求数字', 1, NOW(), NOW(), 0),
    (1103, 'security.password.require-letter', 'false', 'security', 'boolean', '密码要求字母', 1, NOW(), NOW(), 0),
    (1104, 'security.password.require-special', 'false', 'security', 'boolean', '密码要求特殊字符', 1, NOW(), NOW(), 0),
    (1111, 'security.password.expire-days', '0', 'security', 'number', '密码有效期（天）', 1, NOW(), NOW(), 0),
    (1105, 'security.login.max-attempts', '5', 'security', 'number', '登录失败锁定次数', 1, NOW(), NOW(), 0),
    (1106, 'security.login.lock-minutes', '10', 'security', 'number', '登录锁定分钟数', 1, NOW(), NOW(), 0),
    (1107, 'security.captcha.enabled', 'true', 'security', 'boolean', '验证码开关', 1, NOW(), NOW(), 0),
    (1108, 'security.token.access-minutes', '120', 'security', 'number', '访问 Token 有效期', 1, NOW(), NOW(), 0),
    (1109, 'security.token.refresh-minutes', '10080', 'security', 'number', '刷新 Token 有效期', 1, NOW(), NOW(), 0),
    (1110, 'security.user-import.initial-password', 'Nova@123', 'security', 'string', '用户导入初始密码', 1, NOW(), NOW(), 0),
    (1201, 'upload.max-size-mb', '100', 'upload', 'number', '通用最大上传大小', 1, NOW(), NOW(), 0),
    (1202, 'upload.allowed-types', '*', 'upload', 'string', '通用允许文件类型', 1, NOW(), NOW(), 0),
    (1203, 'upload.avatar.max-size-mb', '5', 'upload', 'number', '头像最大上传大小', 1, NOW(), NOW(), 0),
    (1204, 'upload.avatar.allowed-types', 'image/png,image/jpeg,image/gif,image/webp,.png,.jpg,.jpeg,.gif,.webp', 'upload', 'string', '头像允许文件类型', 1, NOW(), NOW(), 0),
    (1301, 'notice.title', '', 'notice', 'string', '公告标题', 1, NOW(), NOW(), 0),
    (1302, 'notice.content', '', 'notice', 'string', '公告内容', 1, NOW(), NOW(), 0),
    (1303, 'notice.enabled', 'false', 'notice', 'boolean', '公告启用状态', 1, NOW(), NOW(), 0),
    (1304, 'notice.level', 'info', 'notice', 'string', '公告级别', 1, NOW(), NOW(), 0),
    (1305, 'notice.email.enabled', 'false', 'notice', 'boolean', '邮件通知开关', 1, NOW(), NOW(), 0),
    (1306, 'notice.email.host', '', 'notice', 'string', '邮件服务器', 1, NOW(), NOW(), 0),
    (1307, 'notice.email.port', '25', 'notice', 'number', '邮件端口', 1, NOW(), NOW(), 0),
    (1308, 'notice.email.username', '', 'notice', 'string', '邮件账号', 1, NOW(), NOW(), 0),
    (1309, 'notice.sms.enabled', 'false', 'notice', 'boolean', '短信通知开关', 1, NOW(), NOW(), 0),
    (1310, 'notice.sms.provider', '', 'notice', 'string', '短信服务商', 1, NOW(), NOW(), 0);

-- 定时任务示例数据（默认暂停，可在界面启动）
INSERT INTO sys_job (id, job_name, job_group, invoke_target, cron_expression, status, misfire_policy, concurrent, remark, create_time)
VALUES (10001, '演示任务', 'DEFAULT', 'demoJob.execute', '0 0/1 * * * ?', 0, 'DO_NOTHING', 1, '每分钟执行一次的示例任务（默认暂停）', NOW());

-- 监控管理-定时任务菜单与权限
INSERT INTO sys_menu (id, parent_id, name, type, perms, path, component, icon, sort, visible, status, create_time)
VALUES
    (41, 2,  '定时任务', 'C', 'monitor:job:list',   '/monitor/job', 'monitor/job/index', 'ScheduleOutlined', 0, 1, 1, NOW()),
    (42, 41, '新增任务', 'F', 'monitor:job:add',    '', '', '', 0, 0, 1, NOW()),
    (43, 41, '修改任务', 'F', 'monitor:job:edit',   '', '', '', 1, 0, 1, NOW()),
    (44, 41, '删除任务', 'F', 'monitor:job:remove', '', '', '', 2, 0, 1, NOW()),
    (45, 41, '暂停任务', 'F', 'monitor:job:pause',  '', '', '', 3, 0, 1, NOW()),
    (46, 41, '恢复任务', 'F', 'monitor:job:resume', '', '', '', 4, 0, 1, NOW()),
    (47, 41, '执行任务', 'F', 'monitor:job:run',    '', '', '', 5, 0, 1, NOW());

-- 监控管理-服务监控菜单与权限（在线用户/缓存为同一页签下的权限点）
INSERT INTO sys_menu (id, parent_id, name, type, perms, path, component, icon, sort, visible, status, create_time)
VALUES
    (52, 2,  '服务监控', 'C', 'monitor:server:list', '/monitor/server', 'monitor/server/index', 'DashboardOutlined', 1, 1, 1, NOW()),
    (53, 52, '在线用户', 'F', 'monitor:online:list', '', '', '', 0, 0, 1, NOW()),
    (54, 52, '缓存监控', 'F', 'monitor:cache:list', '', '', '', 1, 0, 1, NOW()),
    (55, 52, '踢出用户', 'F', 'monitor:online:remove', '', '', '', 2, 0, 1, NOW());

-- 初始账号（密码均为 123456 的 BCrypt 哈希，cost=10）
-- 如需重新生成：new BCryptPasswordEncoder().encode("123456")
INSERT INTO sys_user (id, account, password, nickname, dept_id, super_admin, status, create_time)
VALUES
    (1, 'superAdmin', '$2b$10$1HGY4CVItB50Wmfeaf09gO8LWa5eTKpF0V/0syMPc6/sxTsalYgBO', '超级管理员', 1, 1, 1, NOW()),
    (2, 'admin',      '$2b$10$1HGY4CVItB50Wmfeaf09gO8LWa5eTKpF0V/0syMPc6/sxTsalYgBO', '管理员',   1, 0, 1, NOW());

-- 用户角色关联
INSERT INTO sys_user_role (user_id, role_id) VALUES (1, 1), (2, 1);

-- 角色菜单关联（全部菜单给超管）
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu
ON CONFLICT DO NOTHING;

-- =====================================================
-- 常用字典数据
-- =====================================================
INSERT INTO sys_dict_type (id, type, name, description, status, create_time, update_time, deleted)
VALUES
    (1, 'sys_gender', '性别', '用户性别',  1, NOW(), NOW(), 0),
    (2, 'sys_yes_no', '是否', '通用是/否', 1, NOW(), NOW(), 0),
    (3, 'sys_status', '状态', '启用/禁用', 1, NOW(), NOW(), 0);

INSERT INTO sys_dict_data (id, type_id, label, value, css_class, sort, status, default_flag, create_time, update_time, deleted)
VALUES
    -- 性别
    (101, 1, '男',   'MAN',     NULL, 0, 1, 0, NOW(), NOW(), 0),
    (102, 1, '女',   'WOMAN',   NULL, 1, 1, 0, NOW(), NOW(), 0),
    (103, 1, '未知', 'UNKNOWN', NULL, 2, 1, 1, NOW(), NOW(), 0),
    -- 是否
    (201, 2, '是', 'YES', NULL, 0, 1, 0, NOW(), NOW(), 0),
    (202, 2, '否', 'NO',  NULL, 1, 1, 1, NOW(), NOW(), 0),
    -- 状态（启用/禁用）
    (301, 3, '启用', 'ENABLED',  NULL, 0, 1, 0, NOW(), NOW(), 0),
    (302, 3, '禁用', 'DISABLED', NULL, 1, 1, 1, NOW(), NOW(), 0);
