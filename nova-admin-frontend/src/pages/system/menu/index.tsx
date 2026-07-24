import { useState, useMemo } from 'react';
import { Button, Tree, Space, Tag, Popconfirm, message, Form } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import * as Icons from '@ant-design/icons';
import {
  ProCard,
  ProDescriptions,
  ModalForm,
  ProFormText,
  ProFormRadio,
  ProFormTreeSelect,
  ProFormDigit,
} from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  getMenuTree,
  createMenu,
  updateMenu,
  deleteMenu,
  type MenuCreateRequest,
  type MenuUpdateRequest,
} from '@/api/menu';
import type { MenuInfo } from '@/types/api';
import { toTreeSelectData } from '@/utils/tree';

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

const getTypeTag = (t: (k: string) => string, type?: string) => {
  if (type === 'M') return <Tag color="blue">{t('menu.typeDir')}</Tag>;
  if (type === 'C') return <Tag color="green">{t('menu.typeMenu')}</Tag>;
  if (type === 'F') return <Tag color="orange">{t('menu.typeButton')}</Tag>;
  return <Tag>{type}</Tag>;
};

export default function MenuPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [selectedMenu, setSelectedMenu] = useState<MenuInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const { data: menuTree, isLoading } = useQuery({
    queryKey: ['menuTree'],
    queryFn: async () => {
      const res = await getMenuTree();
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({ mutationFn: createMenu });
  const updateMutation = useMutation({ mutationFn: updateMenu });
  const deleteMutation = useMutation({ mutationFn: deleteMenu });

  const menuMap = useMemo(() => {
    const map = new Map<number, MenuInfo>();
    const walk = (nodes: MenuInfo[]) => {
      for (const n of nodes) {
        map.set(n.id, n);
        if (n.children) walk(n.children);
      }
    };
    if (menuTree) walk(menuTree);
    return map;
  }, [menuTree]);

  const handleSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length === 0) {
      setSelectedMenu(null);
      return;
    }
    setSelectedMenu(menuMap.get(Number(selectedKeys[0])) ?? null);
  };

  const handleAdd = () => {
    setEditMode(false);
    setModalOpen(true);
  };

  const handleAddChild = () => {
    if (!selectedMenu) return;
    setEditMode(false);
    setModalOpen(true);
  };

  const handleEdit = () => {
    if (!selectedMenu) return;
    setEditMode(true);
    setModalOpen(true);
  };

  const treeSelectData = useMemo(() => toTreeSelectData(menuTree ?? []), [menuTree]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold m-0">{t('menu.menu')}</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          {t('menu.addMenu')}
        </Button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <ProCard className="flex-1 w-72 shrink-0 overflow-auto" loading={isLoading}>
          {menuTree && menuTree.length > 0 && (
            <Tree
              treeData={menuTree}
              fieldNames={{ key: 'id', title: 'name', children: 'children' }}
              defaultExpandAll
              showLine={{ showLeafIcon: false }}
              showIcon={false}
              titleRender={(node: MenuInfo) => (
                <Space size={4}>
                  {getIcon(node.icon)}
                  <span>{node.name}</span>
                </Space>
              )}
              onSelect={handleSelect}
              selectedKeys={selectedMenu ? [selectedMenu.id] : []}
            />
          )}
        </ProCard>

        <ProCard className="flex-2 h-full">
          {selectedMenu ? (
            <>
              <ProDescriptions<MenuInfo>
                title={selectedMenu.name}
                dataSource={selectedMenu}
                column={2}
                bordered
                size='small'
                columns={[
                  { title: t('menu.menuName'), dataIndex: 'name' },
                  { title: t('menu.menuType'), dataIndex: 'type', render: (_, r) => getTypeTag(t, r.type) },
                  { title: t('menu.perms'), dataIndex: 'perms', render: (v) => v || '-' },
                  { title: t('menu.path'), dataIndex: 'path', render: (v) => v || '-' },
                  { title: t('menu.component'), dataIndex: 'component', render: (v) => v || '-' },
                  { title: t('menu.redirect'), dataIndex: 'redirect', render: (v) => v || '-' },
                  { title: t('menu.icon'), dataIndex: 'icon', render: (v) => (v ? getIcon(v as string) : '-') },
                  { title: t('menu.sort'), dataIndex: 'sort' },
                  {
                    title: t('menu.visible'),
                    dataIndex: 'visible',
                    render: (_, r) =>
                      r.visible === 1 ? (
                        <Tag color="green">{t('menu.yes')}</Tag>
                      ) : (
                        <Tag color="red">{t('menu.no')}</Tag>
                      ),
                  },
                  {
                    title: t('menu.status'),
                    dataIndex: 'status',
                    render: (_, r) =>
                      r.status === 1 ? (
                        <Tag color="green">{t('menu.enabled')}</Tag>
                      ) : (
                        <Tag color="red">{t('menu.disabled')}</Tag>
                      ),
                  },
                  {
                    title: t('menu.keepAlive'),
                    dataIndex: 'keepAlive',
                    render: (_, r) =>
                      r.keepAlive === 1 ? (
                        <Tag color="green">{t('menu.yes')}</Tag>
                      ) : (
                        <Tag color="red">{t('menu.no')}</Tag>
                      ),
                  },
                  {
                    title: t('menu.alwaysShow'),
                    dataIndex: 'alwaysShow',
                    render: (_, r) =>
                      r.alwaysShow === 1 ? (
                        <Tag color="green">{t('menu.yes')}</Tag>
                      ) : (
                        <Tag color="red">{t('menu.no')}</Tag>
                      ),
                  },
                ]}
              />

              <div className="mt-4">
                <Space>
                  <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
                    {t('common.edit')}
                  </Button>
                  <Button icon={<PlusOutlined />} onClick={handleAddChild}>
                    {t('menu.addChild')}
                  </Button>
                  <Popconfirm
                    title={t('menu.deleteConfirm')}
                    description={selectedMenu.children && selectedMenu.children.length > 0 ? t('menu.hasChildren') : undefined}
                    onConfirm={() => {
                      if (!selectedMenu) return;
                      deleteMutation.mutate(selectedMenu.id);
                      setSelectedMenu(null);
                      queryClient.invalidateQueries({ queryKey: ['menuTree'] });
                    }}
                    okText={t('common.confirm')}
                    cancelText={t('common.cancel')}
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger icon={<DeleteOutlined />} loading={deleteMutation.isPending}>
                      {t('common.delete')}
                    </Button>
                  </Popconfirm>
                </Space>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">{t('menu.selectHint')}</div>
          )}
        </ProCard>
      </div>

      <ModalForm
        title={editMode ? t('menu.editMenu') : t('menu.addMenu')}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditMode(false);
        }}
        modalProps={{ destroyOnHidden: true }}
        width={640}
        layout="vertical"
        initialValues={
          editMode && selectedMenu
            ? {
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
              keepAlive: selectedMenu.keepAlive,
              alwaysShow: selectedMenu.alwaysShow,
            }
            : {
              parentId: selectedMenu?.id ?? 0,
              type: 'M',
              sort: 0,
              visible: 1,
              status: 1,
              keepAlive: 1,
              alwaysShow: 1,
            }
        }
        onFinish={async (values) => {
          const res =
            editMode && selectedMenu
              ? await updateMutation.mutateAsync({ id: selectedMenu.id, ...values } as unknown as MenuUpdateRequest)
              : await createMutation.mutateAsync(values as unknown as MenuCreateRequest);
          if (res.code !== 0) {
            message.error(res.msg || t('common.error'));
            return false;
          }
          message.success(editMode ? t('menu.updateSuccess') : t('menu.createSuccess'));
          queryClient.invalidateQueries({ queryKey: ['menuTree'] });
          return true;
        }}
      >
        <ProFormTreeSelect
          name="parentId"
          label={t('menu.parentMenu')}
          rules={[{ required: true, message: t('menu.parentMenuRequired') }]}
          fieldProps={{
            treeData: [{ value: 0, title: t('menu.rootMenu'), children: treeSelectData }],
            allowClear: true,
            treeDefaultExpandAll: true,
            placeholder: t('menu.parentMenu'),
          }}
        />
        <ProFormRadio.Group
          name="type"
          label={t('menu.menuType')}
          disabled={editMode}
          rules={[{ required: true }]}
          options={[
            { label: t('menu.typeDir'), value: 'M' },
            { label: t('menu.typeMenu'), value: 'C' },
            { label: t('menu.typeButton'), value: 'F' },
          ]}
        />
        <ProFormText
          name="name"
          label={t('menu.menuName')}
          rules={[{ required: true, message: t('menu.menuNameRequired') }]}
        />

        <Form.Item noStyle shouldUpdate>
          {(form) => {
            const mt = ((form.getFieldValue('type') as string) || selectedMenu?.type || 'M');
            return (
              <>
                {mt !== 'F' && <ProFormText name="icon" label={t('menu.icon')} />}
                {mt !== 'F' && <ProFormText name="path" label={t('menu.path')} />}
                {mt === 'C' && <ProFormText name="component" label={t('menu.component')} />}
                {mt === 'M' && <ProFormText name="redirect" label={t('menu.redirect')} />}
                {mt !== 'M' && <ProFormText name="perms" label={t('menu.perms')} />}
                {mt !== 'F' && (
                  <div className="grid grid-cols-3 gap-x-4">
                    <ProFormRadio.Group
                      name="visible"
                      label={t('menu.visible')}
                      options={[
                        { label: t('menu.yes'), value: 1 },
                        { label: t('menu.no'), value: 0 },
                      ]}
                    />
                    <ProFormRadio.Group
                      name="keepAlive"
                      label={t('menu.keepAlive')}
                      options={[
                        { label: t('menu.yes'), value: 1 },
                        { label: t('menu.no'), value: 0 },
                      ]}
                    />
                    <ProFormRadio.Group
                      name="alwaysShow"
                      label={t('menu.alwaysShow')}
                      options={[
                        { label: t('menu.yes'), value: 1 },
                        { label: t('menu.no'), value: 0 },
                      ]}
                    />
                  </div>
                )}
              </>
            );
          }}
        </Form.Item>

        <ProFormDigit name="sort" label={t('menu.sort')} min={0} />
        <ProFormRadio.Group
          name="status"
          label={t('menu.status')}
          rules={[{ required: true }]}
          options={[
            { label: t('menu.enabled'), value: 1 },
            { label: t('menu.disabled'), value: 0 },
          ]}
        />
      </ModalForm>
    </div>
  );
}
