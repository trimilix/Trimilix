"use strict";

/**
 * Dependency-resolution hardening for pnpm 10.4.
 *
 * The current pnpm runtime ignores `overrides` in package.json and does not
 * materialize workspace-level overrides in this lockfile version. This hook is
 * therefore the auditable fallback for narrowly scoped, patch-compatible
 * security upgrades. Remove each rule once the parent package ships a fixed
 * dependency range.
 */
function setDependency(pkg, dependencyName, version) {
  if (pkg.dependencies?.[dependencyName]) {
    pkg.dependencies[dependencyName] = version;
  }
}

module.exports = {
  hooks: {
    readPackage(pkg) {
      switch (pkg.name) {
        case "express":
          setDependency(pkg, "path-to-regexp", "0.1.13");
          break;
        case "dagre-d3-es":
          setDependency(pkg, "lodash-es", "4.18.1");
          break;
        case "hast-util-raw":
        case "remark-rehype":
          setDependency(pkg, "mdast-util-to-hast", "13.2.1");
          break;
        case "mermaid":
          setDependency(pkg, "uuid", "14.0.1");
          break;
        default:
          break;
      }

      return pkg;
    },
  },
};
