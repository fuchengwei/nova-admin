// 共享响应类型。业务代码历史上从 @/types/common 引用 R / PageResult，
// 实际定义位于 @/types/api，这里统一再导出，避免分散维护。
export type { R, PageResult } from '@/types/api';
