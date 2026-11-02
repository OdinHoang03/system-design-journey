import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/** Returns a picker for {vi,en,zh} objects based on the current locale. */
export default function useL() {
  const {i18n} = useDocusaurusContext();
  const key = i18n.currentLocale.startsWith('zh') ? 'zh' : i18n.currentLocale;
  return (obj) => obj[key] ?? obj.vi;
}
