import React from 'react';
import Content from '@theme-original/DocItem/Content';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import MarkRead from '@site/src/components/progress/MarkRead';

export default function ContentWrapper(props) {
  const {metadata} = useDoc();
  return (
    <>
      <Content {...props} />
      <MarkRead lessonId={metadata.id} />
    </>
  );
}
