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
  Popconfirm,
  Descriptions,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  getDeptTree,
  getDeptTreeExclude,
  createDept,
  updateDept,
  deleteDept,
  type DeptTreeNode,
  type DeptCreateRequest,
  type DeptUpdateRequest,
} from '@/api/dept';

const QUERY_KEY = ['deptTree'];

export default function DeptPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [selectedDept, setSelectedDept] = useState<DeptTreeNode | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // 查询部门树
  const { data: treeData, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await getDeptTree();
      return res.data ?? [];
    },
  });

  // 编辑时查询排除自身的部门树
  const { data: excludeTreeData } = useQuery({
    queryKey: [...QUERY_KEY, 'exclude', editMode && selectedDept?.id],
    queryFn: async () => {
      const res = await getDeptTreeExclude(selectedDept!.id);
      return res.data ?? [];
    },
    enabled: editMode && !!selectedDept,
  });

  // 创建部门
  const createMutation = useMutation({
    mutationFn: createDept,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('dept.createSuccess'));
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        handleCloseModal();
      }
    },
  });

  // 更新部门
  const updateMutation = useMutation({
    mutationFn: updateDept,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('dept.updateSuccess'));
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        handleCloseModal();
      }
    },
  });

  // 删除部门
  const deleteMutation = useMutation({
    mutationFn: deleteDept,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('dept.deleteSuccess'));
        setSelectedDept(null);
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    },
  });

  // 树选中
  const handleSelect = (_: unknown, info: { node: DeptTreeNode }) => {
    setSelectedDept(info.node);
  };

  // 打开新增根部门
  const handleAddRoot = () => {
    setEditMode(false);
    form.resetFields();
    form.setFieldsValue({ parentId: 0, sort: 0, status: 1 });
    setModalOpen(true);
  };

  // 打开新增子部门
  const handleAddChild = () => {
    if (!selectedDept) return;
    setEditMode(false);
    form.resetFields();
    form.setFieldsValue({ parentId: selectedDept.id, sort: 0, status: 1 });
    setModalOpen(true);
  };

  // 打开编辑
  const handleEdit = () => {
    if (!selectedDept) return;
    setEditMode(true);
    form.resetFields();
    form.setFieldsValue({
      parentId: selectedDept.parentId,
      name: selectedDept.name,
      code: selectedDept.code,
      leader: selectedDept.leader,
      phone: selectedDept.phone,
      email: selectedDept.email,
      sort: selectedDept.sort,
      status: selectedDept.status,
    });
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
      if (editMode && selectedDept) {
        const data: DeptUpdateRequest = { id: selectedDept.id, ...values };
        updateMutation.mutate(data);
      } else {
        const data: DeptCreateRequest = { ...values };
        createMutation.mutate(data);
      }
    } catch {
      // validation failed, ignore
    }
  };

  // 删除前检查
  const hasChildren = useMemo(() => {
    if (!selectedDept) return false;
    return !!(selectedDept.children && selectedDept.children.length > 0);
  }, [selectedDept]);

  // 将树数据转为 TreeSelect 数据
  const buildTreeSelectData = (
    data: DeptTreeNode[],
  ): { value: number; title: string; children?: ReturnType<typeof buildTreeSelectData> }[] =>
    data.map((item) => ({
      value: item.id,
      title: item.name,
      children: item.children ? buildTreeSelectData(item.children) : undefined,
    }));

  const treeSelectData = useMemo(() => {
    const source = editMode ? excludeTreeData ?? [] : treeData ?? [];
    return buildTreeSelectData(source);
  }, [editMode, excludeTreeData, treeData]);

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold m-0">{t('menu.dept')}</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRoot}>
          {t('dept.addRoot')}
        </Button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* 左侧部门树 */}
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
              showIcon
              icon={<ApartmentOutlined />}
              onSelect={handleSelect}
              selectedKeys={selectedDept ? [selectedDept.id] : []}
            />
          )}
        </Card>

        {/* 右侧详情 */}
        <Card className="flex-1 overflow-auto">
          {selectedDept ? (
            <>
              <Descriptions
                column={2}
                bordered
                size="small"
                title={selectedDept.name}
              >
                <Descriptions.Item label={t('dept.name')}>
                  {selectedDept.name}
                </Descriptions.Item>
                <Descriptions.Item label={t('dept.code')}>
                  {selectedDept.code || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('dept.leader')}>
                  {selectedDept.leader || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('dept.phone')}>
                  {selectedDept.phone || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('dept.email')}>
                  {selectedDept.email || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('dept.sort')}>
                  {selectedDept.sort}
                </Descriptions.Item>
                <Descriptions.Item label={t('dept.status')}>
                  {selectedDept.status === 1 ? (
                    <Tag color="green">{t('dept.enabled')}</Tag>
                  ) : (
                    <Tag color="red">{t('dept.disabled')}</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label={t('dept.createTime')}>
                  {selectedDept.createTime || '-'}
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
                    {t('dept.addChild')}
                  </Button>
                  <Popconfirm
                    title={t('dept.deleteConfirm')}
                    description={hasChildren ? t('dept.hasChildren') : undefined}
                    onConfirm={() => deleteMutation.mutate(selectedDept.id)}
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
              {t('dept.selectHint')}
            </div>
          )}
        </Card>
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editMode ? t('dept.editTitle') : t('dept.addTitle')}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={submitting}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="parentId"
            label={t('dept.parent')}
            rules={[{ required: true, message: t('dept.selectParent') }]}
          >
            <TreeSelect
              treeData={treeSelectData}
              placeholder={t('dept.selectParent')}
              treeDefaultExpandAll
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="name"
            label={t('dept.name')}
            rules={[{ required: true, message: t('dept.nameRequired') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="code" label={t('dept.code')}>
            <Input />
          </Form.Item>

          <Form.Item name="leader" label={t('dept.leader')}>
            <Input />
          </Form.Item>

          <Form.Item name="phone" label={t('dept.phone')}>
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label={t('dept.email')}
            rules={[{ type: 'email', message: t('dept.emailInvalid') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="sort" label={t('dept.sort')}>
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item
            name="status"
            label={t('dept.status')}
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio value={1}>{t('dept.enabled')}</Radio>
              <Radio value={0}>{t('dept.disabled')}</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
