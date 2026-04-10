import styles from "./QrGeneratorSkeleton.module.css";

export function QrGeneratorSkeleton() {
  return (
    <div className={styles.container} aria-busy="true" aria-label="読み込み中">
      {/* 左カラム: ステップブロック */}
      <div className={styles.leftColumn}>
        <div className={styles.skeletonCard}>
          <div className={styles.skeletonHeader}>
            <div className={`${styles.skeletonBlock} ${styles.badge}`} />
            <div className={`${styles.skeletonBlock} ${styles.title}`} />
          </div>
          <div className={`${styles.skeletonBlock} ${styles.field}`} />
        </div>

        <div className={styles.skeletonCard}>
          <div className={styles.skeletonHeader}>
            <div className={`${styles.skeletonBlock} ${styles.badge}`} />
            <div className={`${styles.skeletonBlock} ${styles.title}`} />
          </div>
          <div className={`${styles.skeletonBlock} ${styles.field}`} />
          <div className={`${styles.skeletonBlock} ${styles.field}`} />
          <div className={`${styles.skeletonBlock} ${styles.field}`} />
        </div>

        <div className={styles.skeletonCard}>
          <div className={styles.skeletonHeader}>
            <div className={`${styles.skeletonBlock} ${styles.badge}`} />
            <div className={`${styles.skeletonBlock} ${styles.title}`} />
          </div>
          <div className={`${styles.skeletonBlock} ${styles.field}`} />
        </div>
      </div>

      {/* 右カラム: QRプレビュー相当の正方形ブロック */}
      <div className={styles.rightColumn}>
        <div className={`${styles.skeletonBlock} ${styles.progressBar}`} />
        <div className={`${styles.skeletonBlock} ${styles.urlPreview}`} />
        <div className={`${styles.skeletonBlock} ${styles.qrSquare}`} />
      </div>
    </div>
  );
}
