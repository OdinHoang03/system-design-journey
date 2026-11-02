import React from 'react';
import Link from '@theme-original/DocSidebarItem/Link';
import {useProgress} from '@site/src/components/progress/store';

/** Adds a ✓ after the label of lessons the reader marked as read. */
export default function LinkWrapper(props) {
  const {read} = useProgress();
  const {item} = props;
  if (!item.docId || !read[item.docId]) return <Link {...props} />;
  const label = (
    <>
      {item.label} <span aria-label="✓" title="✓">✓</span>
    </>
  );
  return <Link {...props} item={{...item, label}} />;
}
