import { memo, useMemo } from "react";

import { BreadcrumbsBar } from "@/components/layout/breadcrumbs-bar";
import { ProjectHeaderBar, type ProjectHeaderBarProps } from "@/components/project-detail/project-header-bar";

export type ProjectDetailChromeProps = {
  breadcrumbLabel: string;
} & ProjectHeaderBarProps;

function ProjectDetailChromeInner({ breadcrumbLabel, ...header }: ProjectDetailChromeProps) {
  const items = useMemo(() => [{ label: breadcrumbLabel }], [breadcrumbLabel]);
  return (
    <>
      <BreadcrumbsBar items={items} />
      <ProjectHeaderBar {...header} />
    </>
  );
}

export const ProjectDetailChrome = memo(ProjectDetailChromeInner);
