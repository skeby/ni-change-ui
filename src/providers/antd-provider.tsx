import { ConfigProvider, theme as antdTheme } from "antd";
import { type ReactNode } from "react";
import { useTheme } from "../hooks";

const AntdProvider = ({ children }: { children: ReactNode }) => {
  const { isDarkMode, primary, primaryForeground, primaryTint } = useTheme();

  return (
    <ConfigProvider
      modal={{ mask: { blur: true } }}
      drawer={{ mask: { blur: true } }}
      theme={{
        algorithm: isDarkMode
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
        token: {
          fontFamily: "Sora, sans-serif",
          colorText: "var(--color-text)",
          colorPrimary: primary,
          colorPrimaryHover: primary,
          colorError: "#A82134",
          blue5: primary,
          screenLG: 1024,
          screenSM: 640,
          colorBgContainer: "var(--color-bg)",
          colorBgElevated: "var(--color-bg)",
        },
        components: {
          Button: {
            boxShadow: "none",
            boxShadowSecondary: "none",
            boxShadowTertiary: "none",
            defaultShadow: "none",
            primaryShadow: "none",
            dangerShadow: "none",
          },
          Table: {
            fontSize: 13,
            headerBorderRadius: 0,
            borderRadius: 0,
            borderRadiusLG: 0,
            borderRadiusSM: 0,
            borderRadiusXS: 0,
            borderRadiusOuter: 0,
            cellFontSize: 14,
            headerColor: "var(--color-primary-foreground)",
            headerBg: "var(--color-primary)",
            headerSortActiveBg: "var(--color-primary)",
            headerSortHoverBg: "var(--color-primary)",
            headerFilterHoverBg: "var(--color-primary)",
            colorBgContainer: "var(--color-bg)",
            colorText: "var(--color-secondary-alpha)",
            cellPaddingBlock: 10,
            cellPaddingInline: 12,
            selectionColumnWidth: 35,
            rowHoverBg: "var(--color-bg)",
            rowSelectedBg: "var(--color-bg)",
            borderColor: "var(--color-border-muted)",
            rowSelectedHoverBg: "var(--color-bg)",
          },
          Input: {
            colorBorder: "var(--color-border)",
            controlHeight: 44,
            controlHeightLG: 44,
            controlHeightSM: 44,
            controlHeightXS: 44,
            borderRadius: 8,
          },
          InputNumber: {
            colorBorder: "var(--color-border)",
            controlHeight: 44,
            controlHeightLG: 44,
            controlHeightSM: 44,
            controlHeightXS: 44,
            borderRadius: 8,
          },
          Select: {
            colorBorder: "var(--color-border)",
            colorTextPlaceholder: "var(--color-fade)",
            controlHeight: 44,
            controlHeightLG: 44,
            controlHeightSM: 44,
            controlHeightXS: 44,
            borderRadius: 8,
          },
          Pagination: {
            itemActiveBg: "var(--color-primary)",
            itemActiveColor: "var(--color-primary-foreground)",
            itemActiveColorHover: "var(--color-primary-foreground)",
          },
          Upload: {
            colorError: "#A82134",
          },
          Message: {
            colorError: "#A82134",
            colorSuccess: primary,
          },
          Modal: {
            borderRadius: 20,
            borderRadiusOuter: 20,
            borderRadiusLG: 20,
            borderRadiusSM: 20,
            borderRadiusXS: 20,
            titleFontSize: 18,
            fontWeightStrong: 700,
            boxShadow: "none",
            boxShadowSecondary: "none",
            boxShadowTertiary: "none",
            contentBg: "var(--color-bg)",
            headerBg: "var(--color-bg)",
          },
          Dropdown: {
            boxShadow: "var(--shadow-hover)",
            boxShadowSecondary: "var(--shadow-hover)",
            boxShadowTertiary: "var(--shadow-hover)",
          },
          Popover: {
            boxShadow: "var(--shadow-hover)",
            boxShadowSecondary: "var(--shadow-hover)",
            boxShadowTertiary: "var(--shadow-hover)",
          },
          Menu: {
            itemSelectedBg: primary,
            itemSelectedColor: primaryForeground,
            itemActiveBg: primaryTint,
            itemHoverBg: primaryTint,
            itemColor: "var(--color-gray-500)",
          },
          DatePicker: {
            colorBorder: "var(--color-border)",
            colorTextPlaceholder: "var(--color-fade)",
            controlHeight: 44,
            borderRadius: 8,
          },
          Skeleton: {
            gradientFromColor: "var(--color-border)",
          },
          Tooltip: {
            colorBgBase: "var(--color-bg)",
            colorBgContainer: "var(--color-bg)",
            colorText: "var(--color-text)",
            borderRadius: 8,
            borderRadiusOuter: 8,
            borderRadiusLG: 8,
            borderRadiusSM: 8,
            borderRadiusXS: 8,
          },
          Empty: {
            colorBgContainer: "var(--color-bg)",
            colorText: "var(--color-text)",
            colorBgBase: "var(--color-bg)",
            colorFill: "var(--color-bg)",
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default AntdProvider;
