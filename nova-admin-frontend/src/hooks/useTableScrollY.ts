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
      const cards = Array.from(wrapper.querySelectorAll<HTMLElement>('.ant-pro-card'));
      const card = cards.find((el) => el.offsetHeight > 0) ?? cards[0];
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

      const bodyHeight = cardHeight - padTop - padBottom - search - toolbar - alert - pagHeight;
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
