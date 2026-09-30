import { cn } from '@precisa-saude/ui/utils';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as React from 'react';

const TooltipProvider = ({
  delayDuration = 0,
  ...props
}: TooltipPrimitive.TooltipProviderProps) => (
  <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
);

const TooltipTouchContext = React.createContext<(() => void) | undefined>(undefined);
const TooltipCloseContext = React.createContext<(() => void) | undefined>(undefined);

/**
 * Tooltip que também responde a tap em mobile (Radix só trata hover).
 */
const Tooltip = ({
  children,
  hoverOnly,
  ...props
}: TooltipPrimitive.TooltipProps & { children: React.ReactNode; hoverOnly?: boolean }) => {
  const [open, setOpen] = React.useState(false);
  const isControlled = props.open !== undefined;
  const skipTap = isControlled || hoverOnly;

  return (
    <TooltipPrimitive.Root
      {...props}
      open={skipTap ? props.open : open}
      onOpenChange={skipTap ? props.onOpenChange : setOpen}
    >
      <TooltipTouchContext.Provider value={skipTap ? undefined : () => setOpen((v) => !v)}>
        <TooltipCloseContext.Provider value={skipTap ? undefined : () => setOpen(false)}>
          {children}
        </TooltipCloseContext.Provider>
      </TooltipTouchContext.Provider>
    </TooltipPrimitive.Root>
  );
};

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ onClick, ...props }, ref) => {
  const toggle = React.useContext(TooltipTouchContext);

  return (
    <TooltipPrimitive.Trigger
      ref={ref}
      {...props}
      onClick={(e) => {
        toggle?.();
        onClick?.(e);
      }}
    />
  );
});
TooltipTrigger.displayName = 'TooltipTrigger';

/**
 * Com texto quebrado em várias linhas, a caixa fica na largura máxima mesmo
 * que as linhas (equilibradas pelo text-balance) sejam mais curtas. Mede a
 * linha mais larga e fixa a largura nela, para a caixa abraçar o texto. É um
 * callback ref porque o Portal do Radix só monta o conteúdo depois do
 * primeiro commit, quando um efeito do componente já rodou com o ref vazio.
 */
const hugText = (el: HTMLSpanElement | null) => {
  if (!el) return;
  el.style.width = '';
  const range = document.createRange();
  range.selectNodeContents(el);
  const rects = [...range.getClientRects()];
  if (rects.length < 2) return;
  const left = Math.min(...rects.map((r) => r.left));
  const right = Math.max(...rects.map((r) => r.right));
  el.style.width = `${Math.ceil(right - left) + 1}px`;
};

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ children, className, sideOffset = 4, ...props }, ref) => {
  const close = React.useContext(TooltipCloseContext);
  // Recria o ref quando o texto muda, para medir de novo.
  const textRef = React.useCallback(hugText, [children]);

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        className={cn(
          'z-50 w-fit max-w-xs origin-[--radix-tooltip-content-transform-origin] rounded-xl bg-primary px-3 py-2 text-xs text-balance text-primary-foreground shadow-md duration-150 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className,
        )}
        sideOffset={sideOffset}
        onPointerDownOutside={() => close?.()}
        {...props}
      >
        <span ref={textRef} className="block">
          {children}
        </span>
        <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-primary fill-primary" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
