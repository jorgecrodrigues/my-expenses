import React from "react";
import styles from "./AppGrid.module.scss";

interface LayoutProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "className"
> {
  header?: React.ReactNode | React.ReactNode[];
  sidebar?: React.ReactNode | React.ReactNode[];
  children?: React.ReactNode | React.ReactNode[];
  footer?: React.ReactNode | React.ReactNode[];
}

export default function AppGrid({
  header,
  sidebar,
  children,
  footer,
  ...props
}: LayoutProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { className, ...restProps } =
    props as React.HTMLAttributes<HTMLDivElement>;

  return (
    <div className={`${styles.layout}`} {...restProps}>
      <header className={styles.header}>{header}</header>
      <nav className={styles.sidebar}>{sidebar}</nav>
      <main className={styles.content}>{children}</main>
      <footer className={styles.footer}>{footer}</footer>
    </div>
  );
}
