"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tabsContainerVariants = cva(
  "inline-flex p-1 rounded-xl bg-surface-container-low",
  {
    variants: {
      orientation: {
        horizontal: "flex items-center gap-1",
        vertical: "flex flex-col items-stretch gap-1",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  },
);

const tabTriggerVariants = cva(
  "flex-1 text-center py-1.5 px-3 rounded-lg font-label-md text-label-md transition-all",
  {
    variants: {
      variant: {
        segmented: "",
        underline: "",
      },
      active: {
        true: "bg-surface-container-lowest text-on-surface font-semibold shadow-xs",
        false: "text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50",
      },
    },
    defaultVariants: {
      variant: "segmented",
      active: false,
    },
  },
);

interface TabsContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsContainerVariants> {}

const TabsContainer = React.forwardRef<HTMLDivElement, TabsContainerProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      aria-orientation={orientation}
      className={cn(tabsContainerVariants({ orientation }), className)}
      {...props}
    />
  ),
);
TabsContainer.displayName = "TabsContainer";

interface TabTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof tabTriggerVariants> {
  /** Whether this tab is currently active */
  isActive?: boolean;
}

const TabTrigger = React.forwardRef<HTMLButtonElement, TabTriggerProps>(
  ({ className, variant = "segmented", isActive = false, children, ...props }, ref) => (
    <button
      ref={ref}
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      className={cn(tabTriggerVariants({ variant, active: isActive }), className)}
      {...props}
    >
      {children}
    </button>
  ),
);
TabTrigger.displayName = "TabTrigger";

interface TabsProps {
  /** Default active tab value (uncontrolled) */
  defaultValue?: string;
  /** Controlled active tab value */
  value?: string;
  /** Callback when active tab changes */
  onValueChange?: (value: string) => void;
  /** Tab orientation */
  orientation?: "horizontal" | "vertical";
  /** Tab variant */
  variant?: "segmented" | "underline";
  children: React.ReactNode;
  className?: string;
}

interface TabListProps {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

interface TabProps {
  /** Unique value for this tab */
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  orientation = "horizontal",
  variant = "segmented",
  children,
  className,
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || "");
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : uncontrolledValue;

  const handleTabChange = (tabValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(tabValue);
    }
    onValueChange?.(tabValue);
  };

  const contextValue = React.useMemo(
    () => ({
      activeValue,
      onValueChange: handleTabChange,
      orientation,
      variant,
    }),
    [activeValue, orientation, variant, isControlled],
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn("space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ children, className, "aria-label": ariaLabel }: TabListProps) {
  const { orientation, variant } = useTabsContext();

  return (
    <TabsContainer orientation={orientation} variant={variant} role="tablist" aria-label={ariaLabel} className={className}>
      {children}
    </TabsContainer>
  );
}

export function Tab({ value, children, disabled = false, className }: TabProps) {
  const { activeValue, onValueChange, variant } = useTabsContext();
  const isActive = activeValue === value;

  const handleClick = () => {
    if (!disabled) {
      onValueChange(value);
    }
  };

  return (
    <TabTrigger
      variant={variant}
      isActive={isActive}
      disabled={disabled}
      onClick={handleClick}
      className={cn(disabled && "opacity-50 cursor-not-allowed", className)}
    >
      {children}
    </TabTrigger>
  );
}

const TabsContext = React.createContext<{
  activeValue: string;
  onValueChange: (value: string) => void;
  orientation: "horizontal" | "vertical";
  variant: "segmented" | "underline";
} | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

export { TabsContainer, TabTrigger };