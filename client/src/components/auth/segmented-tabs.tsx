"use client";

import * as React from "react";
import { Tabs, TabList, Tab } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface SegmentedTabsProps {
  /** Tab items */
  items: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  /** Current active tab value */
  value: string;
  /** Callback when tab changes */
  onValueChange: (value: string) => void;
  /** Additional className */
  className?: string;
  /** Maximum width for the tabs container */
  maxWidth?: string;
}

export function SegmentedTabs({
  items,
  value,
  onValueChange,
  className,
  maxWidth = "max-w-[260px]",
}: SegmentedTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} variant="segmented">
      <TabList
        className={cn("w-full", maxWidth, className)}
        aria-label="Authentication mode"
      >
        {items.map((item) => (
          <Tab
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className="text-sm sm:text-base font-medium sm:font-semibold "
          >
            {item.label}
          </Tab>
        ))}
      </TabList>
    </Tabs>
  );
}
