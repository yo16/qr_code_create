import styles from "./Container.module.css";

interface ContainerProps {
  children: React.ReactNode;
  size?: "default" | "narrow" | "wide";
}

export function Container({ children, size = "default" }: ContainerProps) {
  return (
    <div className={`${styles.container} ${styles[size]}`}>{children}</div>
  );
}
