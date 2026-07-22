import { useState, useMemo } from 'react';
import {
  Card,
  Tree,
  TreeSelect,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Radio,
  Switch,
  Popconfirm,
  Descriptions,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import * as Icons from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { MenuInfo } from '@/types/api';
import {
  getMenuTree,
  createMenu,
  updateMenu,
  deleteMenu,
  type MenuCreateRequest,
  type MenuUpdateRequest,
} from '@/api/menu';

const QUERY_KEY = ['menuTree'];

/** 字符串图标名 → React 图标组件映射 */
const iconMap: Record<string, React.ReactNode> = {
  SettingOutlined: <Icons.SettingOutlined />,
  ApartmentOutlined: <Icons.ApartmentOutlined />,
  UserOutlined: <Icons.UserOutlined />,
  TeamOutlined: <Icons.TeamOutlined />,
  MenuOutlined: <Icons.MenuOutlined />,
  BookOutlined: <Icons.BookOutlined />,
  CodeOutlined: <Icons.CodeOutlined />,
  FileOutlined: <Icons.FileOutlined />,
  MonitorOutlined: <Icons.MonitorOutlined />,
  CloudServerOutlined: <Icons.CloudServerOutlined />,
  ScheduleOutlined: <Icons.ScheduleOutlined />,
  DashboardOutlined: <Icons.DashboardOutlined />,
  SafetyOutlined: <Icons.SafetyOutlined />,
  TableOutlined: <Icons.TableOutlined />,
  ToolOutlined: <Icons.ToolOutlined />,
};

const getIcon = (iconName?: string): React.ReactNode =>
  (iconName && iconMap[iconName]) || <Icons.AppstoreOutlined />;

export default function MenuPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [selectedMenu, setSelectedMenu] = useState<MenuInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [menuType, setMenuType] = useState<string>('M');

  // 查询菜单树
  const { data: treeData, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await getMenuTree();
      return res.data ?? [];
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createMenu,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('menu.createSuccess'));
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        handleCloseModal();
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateMenu,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('menu.updateSuccess'));
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        handleCloseModal();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMenu,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('menu.deleteSuccess'));
        setSelectedMenu(null);
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    },
  });

  // 树选中
  const handleSelect = (_: unknown, info: { node: MenuInfo }) => {
    setSelectedMenu(info.node);
  };

  // 打开新增
  const handleAdd = () => {
    setEditMode(false);
    form.resetFields();
    form.setFieldsValue({
      parentId: selectedMenu?.id ?? 0,
      type: 'M',
      sort: 0,
      status: 1,
      visible: 1,
      keepAlive: 0,
      alwaysShow: 0,
    });
    setMenuType('M');
    setModalOpen(true);
  };

  // 打开新增子菜单
  const handleAddChild = () => {
    if (!selectedMenu) return;
    setEditMode(false);
    form.resetFields();
    form.setFieldsValue({
      parentId: selectedMenu.id,
      type: 'M',
      sort: 0,
      status: 1,
      visible: 1,
      keepAlive: 0,
      alwaysShow: 0,
    });
    setMenuType('M');
    setModalOpen(true);
  };

  // 打开编辑
  const handleEdit = () => {
    if (!selectedMenu) return;
    setEditMode(true);
    form.resetFields();
    form.setFieldsValue({
      parentId: selectedMenu.parentId,
      name: selectedMenu.name,
      type: selectedMenu.type,
      perms: selectedMenu.perms,
      path: selectedMenu.path,
      component: selectedMenu.component,
      redirect: selectedMenu.redirect,
      icon: selectedMenu.icon,
      sort: selectedMenu.sort,
      visible: selectedMenu.visible,
      status: selectedMenu.status,
      keepAlive: selectedMenu.keepAlive ?? 0,
      alwaysShow: selectedMenu.alwaysShow ?? 0,
    });
    setMenuType(selectedMenu.type);
    setModalOpen(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setModalOpen(false);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editMode && selectedMenu) {
        const data: MenuUpdateRequest = { id: selectedMenu.id, ...values };
        updateMutation.mutate(data);
      } else {
        const data: MenuCreateRequest = { ...values };
        createMutation.mutate(data);
      }
    } catch {
      // validation failed
    }
  };

  // 将菜单树转为 TreeSelect 数据
  const buildTreeSelectData = (
    data: MenuInfo[],
  ): { value: number; title: string; children?: ReturnType<typeof buildTreeSelectData> }[] =>
    data.map((item) => ({
      value: item.id,
      title: item.name,
      children: item.children ? buildTreeSelectData(item.children) : undefined,
    }));

  const treeSelectData = useMemo(
    () => buildTreeSelectData(treeData ?? []),
    [treeData],
  );

  // 删除前检查子菜单
  const hasChildren = useMemo(() => {
    if (!selectedMenu) return false;
    return !!(selectedMenu.children && selectedMenu.children.length > 0);
  }, [selectedMenu]);

  // 表单监听类型变化
  const type = Form.useWatch('type', form);

  const submitting = createMutation.isPending || updateMutation.isPending;

  // 类型对应的 Tag 颜色和文字
  const getTypeTag = (menuType: string) => {
    switch (menuType) {
      case 'M':
        return <Tag color="blue">{t('menu.typeDir')}</Tag>;
      case 'C':
        return <Tag color="green">{t('menu.typeMenu')}</Tag>;
      case 'F':
        return <Tag color="orange">{t('menu.typeButton')}</Tag>;
      default:
        return '-';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold m-0">{t('menu.menu')}</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          {t('menu.addMenu')}
        </Button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* 左侧菜单树 */}
        <Card
          className="w-72 shrink-0 overflow-auto"
          styles={{ body: { padding: '12px' } }}
          loading={isLoading}
        >
          {treeData && treeData.length > 0 && (
            <Tree
              treeData={treeData}
              fieldNames={{ key: 'id', title: 'name', children: 'children' }}
              defaultExpandAll
              showLine={{ showLeafIcon: false }}
              showIcon={false}
              titleRender={(node: any) => (
                <Space size={4}>
                  {getIcon(node.icon)}
                  <span>{node.name}</span>
                </Space>
              )}
              onSelect={handleSelect}
              selectedKeys={selectedMenu ? [selectedMenu.id] : []}
            />
          )}
        </Card>

        {/* 右侧详情 */}
        <Card className="flex-1 overflow-auto">
          {selectedMenu ? (
            <>
              <Descriptions
                column={2}
                bordered
                size="small"
                title={
                  <Space>
                    {selectedMenu.name}
                    {getTypeTag(selectedMenu.type)}
                  </Space>
                }
              >
                <Descriptions.Item label={t('menu.menuName')}>
                  {selectedMenu.name}
                </Descriptions.Item>
                <Descriptions.Item label={t('menu.menuType')}>
                  {getTypeTag(selectedMenu.type)}
                </Descriptions.Item>
                <Descriptions.Item label={t('menu.perms')}>
                  {selectedMenu.perms || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('menu.path')}>
                  {selectedMenu.path || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('menu.component')}>
                  {selectedMenu.component || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('menu.redirect')}>
                  {selectedMenu.redirect || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('menu.icon')}>
                  {selectedMenu.icon || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('menu.sort')}>
                  {selectedMenu.sort}
                </Descriptions.Item>
                <Descriptions.Item label={t('menu.visible')}>
                  {selectedMenu.visible === 1 ? (
                    <Tag color="green">{t('menu.yes')}</Tag>
                  ) : (
                    <Tag color="red">{t('menu.no')}</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label={t('menu.status')}>
                  {selectedMenu.status === 1 ? (
                    <Tag color="green">{t('menu.enabled')}</Tag>
                  ) : (
                    <Tag color="red">{t('menu.disabled')}</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label={t('menu.keepAlive')}>
                  {(selectedMenu.keepAlive ?? 0) === 1 ? (
                    <Tag color="green">{t('menu.yes')}</Tag>
                  ) : (
                    <Tag color="red">{t('menu.no')}</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label={t('menu.alwaysShow')}>
                  {(selectedMenu.alwaysShow ?? 0) === 1 ? (
                    <Tag color="green">{t('menu.yes')}</Tag>
                  ) : (
                    <Tag color="red">{t('menu.no')}</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>

              <div className="mt-4">
                <Space>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={handleEdit}
                  >
                    {t('common.edit')}
                  </Button>
                  <Button icon={<PlusOutlined />} onClick={handleAddChild}>
                    {t('menu.addChild')}
                  </Button>
                  <Popconfirm
                    title={t('menu.deleteConfirm')}
                    description={hasChildren ? t('menu.hasChildren') : undefined}
                    onConfirm={() => deleteMutation.mutate(selectedMenu.id)}
                    okText={t('common.confirm')}
                    cancelText={t('common.cancel')}
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      loading={deleteMutation.isPending}
                    >
                      {t('common.delete')}
                    </Button>
                  </Popconfirm>
                </Space>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              {t('menu.selectHint')}
            </div>
          )}
        </Card>
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editMode ? t('menu.editMenu') : t('menu.addMenu')}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={submitting}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        destroyOnClose
        width={640}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="parentId"
            label={t('menu.parentMenu')}
            rules={[{ required: true, message: t('menu.parentMenuRequired') }]}
          >
            <TreeSelect
              treeData={[{ value: 0, title: t('menu.rootMenu'), children: treeSelectData }]}
              placeholder={t('menu.parentMenu')}
              treeDefaultExpandAll
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="type"
            label={t('menu.menuType')}
            rules={[{ required: true }]}
          >
            <Radio.Group
              onChange={(e) => setMenuType(e.target.value)}
              disabled={editMode}
            >
              <Radio value="M">{t('menu.typeDir')}</Radio>
              <Radio value="C">{t('menu.typeMenu')}</Radio>
              <Radio value="F">{t('menu.typeButton')}</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="name"
            label={t('menu.menuName')}
            rules={[{ required: true, message: t('menu.menuNameRequired') }]}
          >
            <Input placeholder={t('menu.menuName')} />
          </Form.Item>

          {/* M/C 显示图标 */}
          {(type ?? menuType) !== 'F' && (
            <Form.Item name="icon" label={t('menu.icon')}>
              <Input placeholder={t('menu.icon')} />
            </Form.Item>
          )}

          {/* M/C 显示路由路径 */}
          {(type ?? menuType) !== 'F' && (
            <Form.Item name="path" label={t('menu.path')}>
              <Input placeholder={t('menu.path')} />
            </Form.Item>
          )}

          {/* C 显示组件路径 */}
          {(type ?? menuType) === 'C' && (
            <Form.Item name="component" label={t('menu.component')}>
              <Input placeholder={t('menu.component')} />
            </Form.Item>
          )}

          {/* M 显示重定向 */}
          {(type ?? menuType) === 'M' && (
            <Form.Item name="redirect" label={t('menu.redirect')}>
              <Input placeholder={t('menu.redirect')} />
            </Form.Item>
          )}

          {/* C/F 显示权限标识 */}
          {(type ?? menuType) !== 'M' && (
            <Form.Item name="perms" label={t('menu.perms')}>
              <Input placeholder={t('menu.perms')} />
            </Form.Item>
          )}

          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="sort" label={t('menu.sort')}>
              <InputNumber min={0} className="w-full" />
            </Form.Item>

            <Form.Item
              name="status"
              label={t('menu.status')}
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Radio value={1}>{t('menu.enabled')}</Radio>
                <Radio value={0}>{t('menu.disabled')}</Radio>
              </Radio.Group>
            </Form.Item>
          </div>

          {/* M/C 显示可见性 */}
          {(type ?? menuType) !== 'F' && (
            <div className="grid grid-cols-3 gap-x-4">
              <Form.Item
                name="visible"
                label={t('menu.visible')}
                valuePropName="checked"
                getValueFromEvent={(checked: boolean) => (checked ? 1 : 0)}
                getValueProps={(value: number) => ({ checked: value === 1 })}
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="keepAlive"
                label={t('menu.keepAlive')}
                valuePropName="checked"
                getValueFromEvent={(checked: boolean) => (checked ? 1 : 0)}
                getValueProps={(value: number) => ({ checked: value === 1 })}
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="alwaysShow"
                label={t('menu.alwaysShow')}
                valuePropName="checked"
                getValueFromEvent={(checked: boolean) => (checked ? 1 : 0)}
                getValueProps={(value: number) => ({ checked: value === 1 })}
              >
                <Switch />
              </Form.Item>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}
