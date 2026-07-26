import { useEffect, useRef, useState } from 'react';

/**
 * 计算 ProTable 表体在卡片内的可用高度，实现「仅表体在卡片内滚动」。
 *
 * 将返回的 `wrapperRef` 绑定到包裹 ProTable 的容器上（列表页通常为 `flex-1 min-h-0`，
 * 带 Tabs 的页面直接绑定到 Tabs 外层容器），并将 `scrollY` 透传给 ProTable 的 `scroll.y`。
 * hook 会按可见卡片的实时高度，扣除筛选区 / 工具栏 / 选择提示条 / 分页等卡片内非表体部分，
 * 得出表体可滚动高度。
 *
 * @returns 绑定到表格容器的 ref 与动态计算出的表体滚动高度（px）
 */
export function useTableScrollY() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState<number | undefined>(undefined);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const compute = () => {
      // ProTable 会渲染多个 .ant-pro-card：搜索区卡片 + 主表格卡片。
      // 搜索区卡片高度较小（仅表单），主表格卡片包含 .ant-table 且通常更高。
      // 选「包含 .ant-table 且 offsetHeight 最大」的卡片作为高度基准，
      // 避免选到搜索区卡片导致算出过小的 scrollY，进而让表格不滚动、分页器被挤出视口。
      const cards = Array.from(wrapper.querySelectorAll<HTMLElement>('.ant-pro-card'));
      const tableCards = cards.filter((el) => el.querySelector('.ant-table'));
      const card =
        tableCards.length > 0
          ? tableCards.reduce((a, b) => (a.offsetHeight >= b.offsetHeight ? a : b))
          : (cards.find((el) => el.offsetHeight > 0) ?? cards[0]);
      if (!card) return;

      const cardHeight = card.clientHeight;
      if (!cardHeight) return;

      const cardStyle = getComputedStyle(card);
      const padTop = parseFloat(cardStyle.paddingTop) || 0;
      const padBottom = parseFloat(cardStyle.paddingBottom) || 0;

      const search = card.querySelector<HTMLElement>('.ant-pro-table-search')?.offsetHeight ?? 0;
      const toolbar =
        card.querySelector<HTMLElement>('.ant-pro-table-list-toolbar')?.offsetHeight ?? 0;
      const alert = card.querySelector<HTMLElement>('.ant-pro-table-alert')?.offsetHeight ?? 0;
      const pagination = card.querySelector<HTMLElement>(
        '.ant-table-pagination.ant-table-pagination',
      );
      const pagHeight = pagination ? pagination.offsetHeight + 16 : 0;
      // antd v6 的 thead 是 sticky 元素，仍占布局空间；scroll.y 实际是给 .ant-table-content
      // 设 max-height（其内部包含 thead + tbody），所以需从可用高度中扣除 thead，
      // 否则会多算一份 thead 高度，导致表格超出 card 范围、把分页器挤出视口。
      const thead = card.querySelector<HTMLElement>('.ant-table-thead')?.offsetHeight ?? 0;

      const bodyHeight =
        cardHeight - padTop - padBottom - search - toolbar - alert - pagHeight - thead - 16;
      setScrollY(bodyHeight > 100 ? bodyHeight : undefined);
    };

    const schedule = () => requestAnimationFrame(compute);
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(wrapper);
    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(wrapper, { attributes: true, childList: true, subtree: true });
    const raf = requestAnimationFrame(compute);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return { wrapperRef, scrollY };
}
